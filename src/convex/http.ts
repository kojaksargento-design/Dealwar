import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { PACKAGES } from "./packages";

const http = httpRouter();

auth.addHttpRoutes(http);

/** CORS headers — the storefront (Vercel/preview) is a different origin. */
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

// ---------------------------------------------------------------------------
// Stripe Checkout
// ---------------------------------------------------------------------------

/**
 * Creates a Stripe Checkout Session via REST (no SDK needed) and stores a
 * pending order. Only works when STRIPE_SECRET_KEY is configured — otherwise
 * returns 503 and the UI falls back to MB Way (honesty rule: no fake flows).
 */
const createCheckout = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: {
    packageKey?: string;
    businessName?: string;
    email?: string;
    origin?: string;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const pkg = PACKAGES.find((p) => p.key === body.packageKey);
  const name = (body.businessName ?? "").trim().slice(0, 80);
  const email = (body.email ?? "").trim().slice(0, 120);
  if (!pkg || name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid order data" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Where to send the customer after paying: prefer the server-configured
  // app URL, else the storefront origin sent by the client (the convex.site
  // request origin is the BACKEND, not the app — never use it directly).
  const origin =
    process.env.PUBLIC_APP_URL ??
    (body.origin && /^https?:\/\//.test(body.origin)
      ? body.origin
      : new URL(request.url).origin);

  // 1. Create the pending order.
  const orderId = await ctx.runMutation(internal.packages.insertPending, {
    businessName: name,
    email,
    packageKey: pkg.key,
    amount: pkg.amountCents,
  });

  // 2. Create the Stripe Checkout Session (REST form-encoded).
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/business?order=success&order_id=${orderId}`);
  form.set("cancel_url", `${origin}/business?order=cancelled`);
  form.set("customer_email", email);
  form.set("client_reference_id", orderId);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "eur");
  form.set("line_items[0][price_data][unit_amount]", String(pkg.amountCents));
  form.set("line_items[0][price_data][product_data][name]", `DEALWAR — ${pkg.name}`);
  form.set("line_items[0][price_data][product_data][description]", pkg.description);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const data = (await res.json()) as {
    id?: string;
    url?: string;
    error?: { message: string };
  };
  if (!res.ok || !data.id || !data.url) {
    return new Response(JSON.stringify({ error: "Stripe error" }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // 3. Attach the session id to the order for webhook matching.
  await ctx.runMutation(internal.packages.attachSession, {
    orderId,
    sessionId: data.id,
  });

  return new Response(JSON.stringify({ url: data.url }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

/**
 * Stripe webhook: the ONLY place an order becomes "paid". Authenticity is
 * guaranteed by verifying the Stripe-Signature HMAC (v1 scheme) with the
 * webhook secret. On success the order is marked paid and a REAL revenue
 * entry is recorded in the owner dashboard.
 */
const stripeWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const payload = await request.text();
  const sigHeader = request.headers.get("stripe-signature") ?? "";
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v];
    }),
  );
  const timestamp = parts["t"];
  const expected = parts["v1"];
  if (!timestamp || !expected) {
    return new Response("Bad signature header", { status: 400 });
  }

  // HMAC-SHA256 over `${timestamp}.${payload}` using the Web Crypto API
  // (available in Convex runtime).
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time-ish comparison + replay protection (5 min tolerance).
  if (hex !== expected) {
    return new Response("Invalid signature", { status: 400 });
  }
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) {
    return new Response("Timestamp out of tolerance", { status: 400 });
  }

  let event: {
    type?: string;
    data?: { object?: { id?: string; client_reference_id?: string } };
  };
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" &&
    event.data?.object?.id &&
    event.data.object.client_reference_id
  ) {
    await ctx.runMutation(internal.packages.markPaid, {
      orderId: event.data.object.client_reference_id as never,
      sessionId: event.data.object.id,
    });
  }

  // Always 200 so Stripe stops retrying.
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

http.route({
  path: "/stripe/checkout",
  method: "POST",
  handler: createCheckout,
});

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: stripeWebhook,
});

export default http;
