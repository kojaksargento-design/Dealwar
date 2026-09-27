// DEALWAR purchase prize — virtual "Victory" reward for real purchases.
// A hunter who actually bought a product they discovered through DEALWAR can
// submit proof. After admin verification they earn:
//   - the exclusive "victory_buyer" badge (catalog-seeded)
//   - +250 XP (via the idempotent engine, refId = claim id)
//   - a notification
// The prize is VIRTUAL ONLY (badge + XP) — never money — per the honesty rules.
// Approval is admin-only and recorded in the audit log.

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { XP } from "./engine";

export const PURCHASE_PRIZE_XP = 250;
export const VICTORY_BADGE_KEY = "victory_buyer";

/** Admin check identical to moderation.requireAdmin (kept local: not exported there). */
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

/** Submit a purchase-prize claim (authenticated hunters only). */
export const submitClaim = mutation({
  args: {
    warId: v.optional(v.id("wars")),
    storeName: v.string(),
    amountPaid: v.optional(v.number()),
    proofUrl: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found.");
    if (profile.suspended) throw new Error("Account suspended.");

    const storeName = args.storeName.trim();
    const proofUrl = args.proofUrl.trim();
    if (storeName.length < 2) throw new Error("Store name is required.");
    if (!/^https?:\/\/.+/i.test(proofUrl)) throw new Error("A valid proof link is required.");

    // Honesty guard: the claim must be tied to a war the hunter participates in
    // (they discovered/joined this hunt on DEALWAR).
    if (args.warId) {
      const membership = await ctx.db
        .query("warParticipants")
        .withIndex("by_war_profile", (q) =>
          q.eq("warId", args.warId!).eq("profileId", profile._id),
        )
        .first();
      if (!membership) throw new Error("Join the war before claiming the purchase prize.");
    }

    // Rate limit: max 3 open claims per hunter
    const open = await ctx.db
      .query("purchaseClaims")
      .withIndex("by_profile_createdAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(30);
    if (open.filter((c) => c.status === "pending").length >= 3) {
      throw new Error("You already have 3 claims under review.");
    }

    const id = await ctx.db.insert("purchaseClaims", {
      profileId: profile._id,
      warId: args.warId,
      storeName,
      amountPaid: args.amountPaid,
      proofUrl,
      note: args.note?.slice(0, 500),
      status: "pending",
      createdAt: Date.now(),
    });

    // Notify admins for review
    const admins = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("isAdmin"), true))
      .collect();
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        profileId: admin._id,
        type: "purchase_claim",
        title: "Novo pedido de prémio de compra",
        body: `@${profile.username} enviou comprovativo (${storeName}).`,
        read: false,
        createdAt: Date.now(),
      });
    }

    return id;
  },
});

/** Wars the current hunter participates in (for the claim form dropdown). */
export const listMyWars = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return [];
    const parts = await ctx.db
      .query("warParticipants")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
    const out = [];
    for (const p of parts.slice(-20).reverse()) {
      const war = await ctx.db.get(p.warId);
      if (war) out.push({ warId: war._id, title: war.title });
    }
    return out;
  },
});

/** My claims, latest first. */
export const listMyClaims = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return [];
    return await ctx.db
      .query("purchaseClaims")
      .withIndex("by_profile_createdAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(20);
  },
});

/** How many claims each user has had approved (badge criteria + Profile card). */
export const countApprovedByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("purchaseClaims")
      .withIndex("by_profile_createdAt", (q) => q.eq("profileId", args.profileId))
      .collect();
    return rows.filter((r) => r.status === "approved").length;
  },
});

/** Admin: pending claims, newest first. */
export const listPendingAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("purchaseClaims")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(50);
  },
});

/** Admin: approve a claim → badge + XP + notification (all idempotent). */
export const approveClaim = mutation({
  args: { claimId: v.id("purchaseClaims") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Admin access required.");
    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Claim not found.");
    if (claim.status !== "pending") throw new Error("Claim already reviewed.");

    await ctx.db.patch(args.claimId, {
      status: "approved",
      reviewedAt: Date.now(),
    });

    // +250 XP — idempotent via refId
    await ctx.runMutation(internal.engine.awardXp, {
      profileId: claim.profileId,
      amount: PURCHASE_PRIZE_XP,
      reason: "Purchase prize: verified buyer",
      refType: "purchase_claim",
      refId: args.claimId,
    });

    // Exclusive "Victory" badge (idempotent)
    await ctx.runMutation(internal.engine.awardBadge, {
      profileId: claim.profileId,
      badgeKey: VICTORY_BADGE_KEY,
    });

    await ctx.db.insert("notifications", {
      profileId: claim.profileId,
      type: "purchase_prize",
      title: "🏆 Prémio «Vitória» desbloqueado!",
      body: `A tua compra foi verificada: +${PURCHASE_PRIZE_XP} XP e o emblema de Comprador Verificado estão no teu perfil.`,
      read: false,
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorProfileId: admin._id,
      action: "purchase_claim_approve",
      targetType: "purchaseClaim",
      targetId: args.claimId,
      meta: claim.storeName,
      createdAt: Date.now(),
    });

    await ctx.db.insert("analyticsEvents", {
      name: "purchase_claim_approved",
      profileId: claim.profileId,
      warId: claim.warId,
      createdAt: Date.now(),
    });
  },
});

/** Admin: reject a claim (recorded in the audit log). */
export const rejectClaim = mutation({
  args: { claimId: v.id("purchaseClaims") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!admin) throw new Error("Admin access required.");
    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Claim not found.");
    if (claim.status !== "pending") throw new Error("Claim already reviewed.");

    await ctx.db.patch(args.claimId, {
      status: "rejected",
      reviewedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorProfileId: admin._id,
      action: "purchase_claim_reject",
      targetType: "purchaseClaim",
      targetId: args.claimId,
      meta: claim.storeName,
      createdAt: Date.now(),
    });
  },
});

/** Public catalog of verified buyers (most recent approvals first). */
export const listVerifiedBuyers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("purchaseClaims")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(args.limit ?? 10);
    const out = [];
    for (const r of rows) {
      const profile = await ctx.db.get(r.profileId);
      out.push({
        claimId: r._id,
        username: profile?.username ?? "?",
        avatarEmoji: profile?.avatarEmoji ?? "🛒",
        storeName: r.storeName,
        approvedAt: r.reviewedAt ?? r.createdAt,
      });
    }
    return out;
  },
});
