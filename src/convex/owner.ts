import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { minuteSeries, sumLast, sumSeries } from "./minuteSeries";

const HOUR = 60 * 60_000;

/**
 * Record REAL money the owner received outside the platform (bank transfer,
 * MB Way, invoice). Owner-only, audit-logged, never simulated.
 */
export const recordManualPayment = mutation({
  args: {
    amount: v.number(), // cents, > 0
    source: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile?.isAdmin) throw new Error("Admin access required.");

    if (!Number.isInteger(args.amount) || args.amount <= 0 || args.amount > 100_000_000) {
      throw new Error("Invalid amount.");
    }
    const source = args.source.trim();
    if (source.length < 2 || source.length > 80) {
      throw new Error("Source must be 2–80 characters.");
    }

    const now = Date.now();
    const id = await ctx.db.insert("manualPayments", {
      amount: args.amount,
      source,
      note: args.note?.trim().slice(0, 200) || undefined,
      receivedAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: profile._id,
      action: "payment.manual_record",
      targetType: "manualPayment",
      targetId: id,
      meta: `${args.amount}c — ${source}`,
      createdAt: now,
    });
    return id;
  },
});

/**
 * Live owner dashboard. Same server-side gate as every other admin surface
 * (profiles.isAdmin). Never throws for the client — the page gates rendering
 * with api.gamification.isMyAdmin before subscribing (query uses "skip").
 */
export const ownerStats = query({
  args: { buckets: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile?.isAdmin) return null;

    const now = Date.now();
    const since = now - HOUR;
    const buckets = Math.min(Math.max(args.buckets ?? 60, 5), 120);

    // ---- per-minute activity (last hour) ----
    const evs = await ctx.db
      .query("analyticsEvents")
      .filter((q) => q.gt(q.field("createdAt"), since))
      .collect();

    const seriesOf = (names: string[]): number[] =>
      evs.filter((e) => names.includes(e.name)).map((e) => e.createdAt);

    const visitsSeries = minuteSeries(seriesOf(["page_view"]), now, buckets);
    const warsSeries = minuteSeries(
      seriesOf(["war_view", "war_join", "war_create", "submission_create"]),
      now,
      buckets,
    );
    const signupsSeries = minuteSeries(seriesOf(["signup", "login"]), now, buckets);
    const clicksSeries = minuteSeries(seriesOf(["affiliate_click"]), now, buckets);

    // ---- lifetime platform counters ----
    const [profiles, wars, subs, users] = await Promise.all([
      ctx.db.query("profiles").collect(),
      ctx.db.query("wars").collect(),
      ctx.db.query("submissions").collect(),
      ctx.db.query("users").collect(),
    ]);
    const stores = await ctx.db.query("stores").collect();

    const counts = {
      profiles: profiles.length,
      demoProfiles: profiles.filter((p) => p.demo).length,
      users: users.filter((u) => !u.isAnonymous).length,
      guests: users.filter((u) => u.isAnonymous).length,
      warsTotal: wars.length,
      warsOpen: wars.filter((w) => w.status === "open").length,
      submissionsTotal: subs.length,
      submissionsPending: subs.filter((s) => s.status === "pending").length,
      submissionsApproved: subs.filter((s) => s.status === "approved").length,
      stores: stores.length,
      storesWithAffiliate: stores.filter((s) => !!s.affiliateUrl).length,
    };

    // ---- revenue: REAL money only, starts at €0.00 ----
    const [conversions, clicks, manualPayments, orders] = await Promise.all([
      ctx.db.query("conversions").collect(),
      ctx.db.query("affiliateClicks").collect(),
      ctx.db.query("manualPayments").withIndex("by_receivedAt").order("desc").collect(),
      ctx.db.query("orders").withIndex("by_createdAt").order("desc").collect(),
    ]);
    const stripePaid = orders
      .filter((o) => o.status === "paid")
      .reduce((a, o) => a + o.amount, 0);
    const sum = (list: typeof conversions) =>
      list.reduce((acc, c) => acc + (c.commission ?? 0), 0);
    const confirmedRevenue = sum(
      conversions.filter((c) => c.status === "approved" || c.status === "paid"),
    );
    const pendingRevenue = sum(
      conversions.filter((c) => c.status === "pending"),
    );
    const manualRevenue = manualPayments.reduce((acc, p) => acc + p.amount, 0);
    const hourAgo = now - HOUR;
    const manualLastHour = manualPayments
      .filter((p) => p.receivedAt > hourAgo)
      .reduce((acc, p) => acc + p.amount, 0);
    const recentPayments = manualPayments.slice(0, 10).map((p) => ({
      _id: p._id,
      amount: p.amount,
      source: p.source,
      note: p.note ?? null,
      receivedAt: p.receivedAt,
    }));

    return {
      now,
      buckets,
      visitsPerMinute: visitsSeries,
      warsPerMinute: warsSeries,
      signupsPerMinute: signupsSeries,
      clicksPerMinute: clicksSeries,
      totals: {
        visitsLastMinute: sumLast(visitsSeries, 1),
        visitsLastHour: sumSeries(visitsSeries),
        warsLastMinute: sumLast(warsSeries, 1),
        signupsLastMinute: sumLast(signupsSeries, 1),
        clicksLastHour: sumSeries(clicksSeries),
      },
      counts,
      revenue: {
        confirmedRevenue, // cents — network-confirmed only
        pendingRevenue, // cents — reported by network, not paid yet
        manualRevenue, // cents — REAL money the owner received directly
        stripePaid, // cents — REAL money received via Stripe (webhook-verified)
        sponsoredRevenue: 0, // no real sponsored billing in V1 — stays €0.00
        premiumRevenue: 0, // no premium tier in V1 — stays €0.00
        payoutConfigured: false, // flipped server-side only when a payout account is connected
      },
      orders: {
        paid: orders.filter((o) => o.status === "paid").length,
        pending: orders.filter((o) => o.status === "pending").length,
      },
      manualLastHour,
      recentPayments,
    };
  },
});
