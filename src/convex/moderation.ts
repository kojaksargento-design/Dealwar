import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { XP } from "./engine";
import { requireProfile } from "./profileService";

const D1 = 24 * 3600 * 1000;

// ---------- Queries ----------

/** Admin queue: pending submissions. Admin-only. */
export const listPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Admin access required.");
    const subs = await ctx.db
      .query("submissions")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(args.limit ?? 50);
    const out = [];
    for (const s of subs) {
      const war = await ctx.db.get(s.warId);
      const profile = await ctx.db.get(s.profileId);
      const store = s.storeId ? await ctx.db.get(s.storeId) : null;
      out.push({
        _id: s._id,
        warId: s.warId,
        warTitle: war?.title ?? "—",
        warSlug: war?.slug ?? null,
        username: profile?.username ?? "unknown",
        price: s.price,
        storeLabel: store?.name ?? s.storeName ?? "—",
        url: s.url,
        notes: s.notes,
        status: s.status,
        createdAt: s.createdAt,
      });
    }
    return out;
  },
});

/** Admin queue: open reports. Admin-only. */
export const listReports = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (!(await requireAdmin(ctx))) throw new Error("Admin access required.");
    return await ctx.db
      .query("reports")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "open"))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

/** Admin: all stores. */
export const listStores = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdmin(ctx))) throw new Error("Admin access required.");
    return await ctx.db.query("stores").withIndex("by_active").collect();
  },
});

/** Admin: businesses. */
export const listBusinesses = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdmin(ctx))) throw new Error("Admin access required.");
    return await ctx.db.query("businesses").collect();
  },
});

/** Admin: campaigns. */
export const listCampaignsAdmin = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdmin(ctx))){throw new Error("Admin access required.");}
    return await ctx.db.query("campaigns").collect();
  },
});

/** Admin: user list for the Users tab. */
export const listUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (!(await requireAdmin(ctx))) throw new Error("Admin access required.");
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_xp")
      .order("desc")
      .take(args.limit ?? 50);
    return profiles.map((p) => ({
      _id: p._id,
      username: p.username,
      country: p.country ?? null,
      xp: p.xp,
      level: p.level,
      wins: p.wins,
      reputation: p.reputation,
      suspended: !!p.suspended,
      isAdmin: !!p.isAdmin,
      isDemo: !!p.demo,
    }));
  },
});

/** Admin: war list for the Wars tab. */
export const listWarsAdmin = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (!(await requireAdmin(ctx))) throw new Error("Admin access required.");
    const wars = await ctx.db
      .query("wars")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 50);
    return wars.map((w) => ({
      _id: w._id,
      slug: w.slug,
      title: w.title,
      status: w.status,
      participants: w.participants,
      bestPrice: w.bestPrice,
      originalPrice: w.originalPrice,
      featured: !!w.featured,
      sponsored: !!w.sponsored,
      isDemo: !!w.demo,
      endTime: w.endTime,
    }));
  },
});

/**
 * Revenue dashboard. Starts at €0.00 — never simulated. Admin-only: it
 * aggregates platform-wide affiliate clicks and conversions.
 */
export const revenueDashboard = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdmin(ctx))) throw new Error("Admin access required.");

    const conversions = await ctx.db.query("conversions").collect();
    const clicks = await ctx.db.query("affiliateClicks").collect();

    const sum = (list: typeof conversions) =>
      list.reduce((acc, c) => acc + (c.commission ?? 0), 0);

    const approved = conversions.filter((c) => c.status === "approved" || c.status === "paid");
    const pending = conversions.filter((c) => c.status === "pending");

    return {
      clicksTotal: clicks.length,
      conversionsTotal: conversions.length,
      confirmedRevenue: sum(approved), // cents
      pendingRevenue: sum(pending),
      estimatedRevenue: sum(approved) + sum(pending),
      sponsoredRevenue: 0, // no real sponsored billing in V1 — stays €0.00
      premiumRevenue: 0, // no premium tier in V1 — stays €0.00
    };
  },
});

/** Platform analytics for the admin dashboard (real events only). */
export const analytics = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (!(await requireAdmin(ctx))) throw new Error("Admin access required.");
    const since = Date.now() - (args.days ?? 7) * D1;
    const events = await ctx.db
      .query("analyticsEvents")
      .filter((q) => q.gt(q.field("createdAt"), since))
      .collect();
    const counts: Record<string, number> = {};
    for (const e of events) counts[e.name] = (counts[e.name] ?? 0) + 1;
    return counts;
  },
});

// ---------- Mutations ----------

/** Approve a submission. Only admins/moderators. Awards XP server-side. */
export const approveSubmission = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Admin access required.");

    const sub = await ctx.db.get(args.submissionId);
    if (!sub) throw new Error("Submission not found.");
    if (sub.status === "approved") return { ok: true };

    const war = await ctx.db.get(sub.warId);
    if (!war) throw new Error("War not found.");

    const now = Date.now();
    await ctx.db.patch(args.submissionId, {
      status: "approved",
      reviewedAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: admin._id,
      action: "submission.approve",
      targetType: "submission",
      targetId: args.submissionId,
      createdAt: now,
    });

    const profile = await ctx.db.get(sub.profileId);
    if (profile) {
      await ctx.db.patch(profile._id, {
        discoveries: profile.discoveries + 1,
      });

      // XP: verified discovery
      await ctx.runMutation(internal.engine.awardXp, {
        profileId: profile._id,
        amount: XP.VERIFIED_DISCOVERY,
        reason: "Verified discovery",
        refType: "submission",
        refId: args.submissionId,
      });
      await ctx.runMutation(internal.engine.awardBadge, {
        profileId: profile._id,
        badgeKey: "price_hunter",
      });

      // did they beat the best price?
      const beatsBest = sub.price < war.bestPrice;
      if (beatsBest) {
        await ctx.db.patch(war._id, { bestPrice: sub.price });
        await ctx.db.insert("priceHistory", {
          warId: war._id,
          price: sub.price,
          label: `Verified by @${profile.username}`,
          source: "submission",
          createdAt: now,
        });
        await ctx.runMutation(internal.engine.awardXp, {
          profileId: profile._id,
          amount: XP.BEAT_BEST_PRICE,
          reason: "Beat the best price",
          refType: "submission",
          refId: `${args.submissionId}:beat`,
        });
        await ctx.runMutation(internal.engine.awardBadge, {
          profileId: profile._id,
          badgeKey: "first_win",
        });
        // wins counter: user now holds the best price
        await ctx.db.patch(profile._id, { wins: profile.wins + 1 });
        // Viral loop: reward the inviter when a referred hunter wins their first hunt.
        await ctx.runMutation(internal.referrals.onInviteeFirstWin, { profileId: profile._id });
        await ctx.runMutation(internal.missions.bumpMission, {
          missionKey: "beat_a_price",
          amount: 1,
        });

        // notify the previous best-price holder
        const prevBest = await ctx.db
          .query("submissions")
          .withIndex("by_war_createdAt", (q) => q.eq("warId", war._id))
          .filter((q) => q.eq(q.field("status"), "approved"))
          .order("asc")
          .first();
        // (simple notification to war creator as placeholder for prior holder)
        if (war.creatorId && war.creatorId !== profile._id) {
          await ctx.db.insert("notifications", {
            profileId: war.creatorId,
            type: "price_beaten",
            title: "Someone beat the price in your war",
            body: `New best: ${formatEur(sub.price)} in “${war.title}”.`,
            warId: war._id,
            read: false,
            createdAt: now,
          });
        }
      }

      await ctx.runMutation(internal.engine.recomputeReputation, {
        profileId: profile._id,
      });
    }

    await ctx.db.insert("analyticsEvents", {
      name: "submission_approved",
      profileId: sub.profileId,
      warId: war._id,
      createdAt: now,
    });
    return { ok: true };
  },
});

/** Reject a submission with a reason. Only admins/moderators. */
export const rejectSubmission = mutation({
  args: { submissionId: v.id("submissions"), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Admin access required.");

    const sub = await ctx.db.get(args.submissionId);
    if (!sub) throw new Error("Submission not found.");
    if (sub.status === "rejected") return { ok: true };

    const now = Date.now();
    await ctx.db.patch(args.submissionId, {
      status: "rejected",
      reviewedAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: admin._id,
      action: "submission.reject",
      targetType: "submission",
      targetId: args.submissionId,
      meta: args.reason.slice(0, 200),
      createdAt: now,
    });
    await ctx.runMutation(internal.engine.recomputeReputation, {
      profileId: sub.profileId,
    });
    await ctx.db.insert("analyticsEvents", {
      name: "submission_rejected",
      profileId: sub.profileId,
      warId: sub.warId,
      createdAt: now,
    });
    return { ok: true };
  },
});

/** Moderate a war: feature / suspend / end. */
export const moderateWar = mutation({
  args: {
    warId: v.id("wars"),
    action: v.union(v.literal("feature"), v.literal("unfeature"), v.literal("end")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Admin access required.");
    const war = await ctx.db.get(args.warId);
    if (!war) throw new Error("War not found.");

    if (args.action === "feature") await ctx.db.patch(war._id, { featured: true });
    if (args.action === "unfeature") await ctx.db.patch(war._id, { featured: false });
    if (args.action === "end") await ctx.db.patch(war._id, { status: "ended" });

    await ctx.db.insert("auditLogs", {
      actorProfileId: admin._id,
      action: `war.${args.action}`,
      targetType: "war",
      targetId: args.warId,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Suspend or reinstate a user (admin). */
export const setUserSuspended = mutation({
  args: { profileId: v.id("profiles"), suspended: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Admin access required.");
    if (admin._id === args.profileId) {
      throw new Error("You cannot suspend your own account.");
    }
    await ctx.db.patch(args.profileId, { suspended: args.suspended });
    await ctx.db.insert("auditLogs", {
      actorProfileId: admin._id,
      action: args.suspended ? "user.suspend" : "user.unsuspend",
      targetType: "profile",
      targetId: args.profileId,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/**
 * Submit a report (any authenticated user). Targets: war / product / user /
 * store / submission / price. Feeds the admin Reports queue.
 */
export const submitReport = mutation({
  args: {
    targetType: v.union(
      v.literal("war"),
      v.literal("product"),
      v.literal("user"),
      v.literal("store"),
      v.literal("submission"),
      v.literal("price"),
    ),
    targetId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx, "Sign in to report content.");
    const reason = args.reason.trim();
    if (reason.length < 4 || reason.length > 400) {
      throw new Error("Reason must be 4–400 characters.");
    }
    // basic anti-spam: max 10 open reports per reporter
    const open = await ctx.db
      .query("reports")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "open"))
      .filter((q) =>
        q.eq(q.field("reporterProfileId"), profile._id),
      )
      .collect();
    if (open.length >= 10) {
      throw new Error("You already have 10 open reports. Wait for moderation.");
    }
    const id = await ctx.db.insert("reports", {
      reporterProfileId: profile._id,
      targetType: args.targetType,
      targetId: args.targetId.slice(0, 64),
      reason,
      status: "open",
      createdAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: profile._id,
      action: "report.create",
      targetType: args.targetType,
      targetId: args.targetId.slice(0, 64),
      createdAt: Date.now(),
    });
    return id;
  },
});

/** Resolve a report. */
export const resolveReport = mutation({
  args: {
    reportId: v.id("reports"),
    outcome: v.union(v.literal("resolved"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Admin access required.");
    await ctx.db.patch(args.reportId, { status: args.outcome });
    await ctx.db.insert("auditLogs", {
      actorProfileId: admin._id,
      action: `report.${args.outcome}`,
      targetType: "report",
      targetId: args.reportId,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Create a store (admin). No invented URLs — leave fields empty if unknown. */
export const createStore = mutation({
  args: {
    name: v.string(),
    website: v.optional(v.string()),
    country: v.optional(v.string()),
    affiliateNetwork: v.optional(v.string()),
    affiliateUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Admin access required.");
    const id = await ctx.db.insert("stores", {
      name: args.name.trim().slice(0, 60),
      website: args.website?.trim() || undefined,
      country: args.country?.trim() || undefined,
      affiliateNetwork: args.affiliateNetwork?.trim() || undefined,
      affiliateUrl: args.affiliateUrl?.trim() || undefined,
      active: true,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: admin._id,
      action: "store.create",
      targetType: "store",
      targetId: id,
      createdAt: Date.now(),
    });
    return id;
  },
});

// ---------- helpers ----------

async function requireAdmin(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (!profile || !profile.isAdmin) return null;
  return profile;
}

function formatEur(cents: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
}
