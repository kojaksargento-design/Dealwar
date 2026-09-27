import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Public lead capture: a company asks to sponsor a Price War. No sign-in
 * required (the Business page is the sales funnel). Rate-limited per email to
 * block spam floods; a lead is NOT revenue — money only enters the dashboard
 * when the owner registers a real payment manually.
 */
export const requestSponsorship = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const message = args.message.trim();

    if (name.length < 2 || name.length > 80) {
      throw new Error("Company name must be 2–80 characters.");
    }
    if (!EMAIL_RE.test(email) || email.length > 120) {
      throw new Error("Please enter a valid email address.");
    }
    if (message.length < 10 || message.length > 600) {
      throw new Error("Message must be 10–600 characters.");
    }

    // Simple anti-spam: max 3 leads per email, ever.
    const prior = await ctx.db
      .query("sponsorLeads")
      .filter((q) => q.eq(q.field("email"), email))
      .collect();
    if (prior.length >= 3) {
      throw new Error("This email already has 3 requests. We will contact you.");
    }

    const now = Date.now();
    const id = await ctx.db.insert("sponsorLeads", {
      name,
      email,
      message,
      status: "new",
      createdAt: now,
    });

    // Notify every admin (the owner) in-app.
    const admins = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("isAdmin"), true))
      .collect();
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        profileId: admin._id,
        type: "sponsor_lead",
        title: "Novo pedido de patrocínio",
        body: `${name} (${email}): ${message.slice(0, 120)}`,
        read: false,
        createdAt: now,
      });
    }

    // Immediate email to the owner (convenience layer; the bell is the
    // source of truth). Scheduled so the mutation stays fast.
    if (admins.length > 0) {
      ctx.scheduler.runAfter(0, internal.email.sendLeadNotification, {
        name,
        email,
        message,
      });
    }

    return id;
  },
});

/** Owner queue of sponsorship leads. */
export const listLeads = query({
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
      .query("sponsorLeads")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);
  },
});

/** Owner marks a lead contacted/closed. */
export const setLeadStatus = mutation({
  args: {
    leadId: v.id("sponsorLeads"),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile?.isAdmin) throw new Error("Admin access required.");
    await ctx.db.patch(args.leadId, { status: args.status });
    return { ok: true };
  },
});
