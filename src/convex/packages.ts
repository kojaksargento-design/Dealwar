import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sponsoring packages (cents). Single source of truth for the pricing UI and
 * the Stripe Checkout endpoint.
 */
export const PACKAGES = [
  {
    key: "basic",
    name: "Básico",
    description: "1 guerra patrocinada, 7 dias, badge SPONSORED",
    amountCents: 3000, // €30
  },
  {
    key: "pro",
    name: "Pro",
    description: "1 guerra patrocinada, 14 dias, destaque na home",
    amountCents: 8000, // €80
  },
  {
    key: "brand",
    name: "Marca",
    description: "Guerra de marca, 30 dias, banner no ranking",
    amountCents: 20000, // €200
  },
] as const;

/**
 * Internal order mutations — only callable from Convex server code (the HTTP
 * actions in http.ts). Clients can never insert or mark orders directly.
 */
export const insertPending = internalMutation({
  args: {
    businessName: v.string(),
    email: v.string(),
    packageKey: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("orders", {
      businessName: args.businessName,
      email: args.email,
      packageKey: args.packageKey,
      amount: args.amount,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const attachSession = internalMutation({
  args: { orderId: v.id("orders"), sessionId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, { stripeSessionId: args.sessionId });
  },
});

/**
 * Marks an order paid. Idempotent: a replayed webhook finds the order already
 * paid and does nothing. This is where REAL revenue enters the platform —
 * the owner dashboard aggregates paid orders.
 */
export const markPaid = internalMutation({
  args: { orderId: v.id("orders"), sessionId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return;
    if (order.status === "paid") return; // idempotent
    await ctx.db.patch(args.orderId, {
      status: "paid",
      paidAt: Date.now(),
      stripeSessionId: args.sessionId,
    });
  },
});

export const markCancelled = internalMutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_sessionId", (q) => q.eq("stripeSessionId", args.sessionId))
      .first();
    if (!order || order.status !== "pending") return;
    await ctx.db.patch(order._id, { status: "cancelled" });
  },
});

/** Owner: recent orders (paid = REAL revenue via Stripe). */
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile?.isAdmin) throw new Error("Admin access required.");
    return await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .order("desc")
      .take(30);
  },
});
