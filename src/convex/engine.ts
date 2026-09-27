// DEALWAR gamification + security engine.
// ALL XP / points / reputation / streak changes flow through here so clients
// can never modify their own scores. Idempotent per (profileId, refId).

import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { levelInfo, LEVELS } from "./levels";
import { nextStreak } from "./streak";

export const XP = {
  CREATE_WAR: 10,
  JOIN_WAR: 5,
  VERIFIED_DISCOVERY: 50,
  BEAT_BEST_PRICE: 100,
  SHARE_VICTORY: 2,
  MISSIONS: {
    find_a_deal: 20,
    join_3_wars: 15,
    beat_a_price: 25,
    share_a_victory: 10,
    create_a_war: 15,
  },
} as const;

export const BADGE_KEYS = [
  "first_war",
  "first_win",
  "price_hunter",
  "streak_7",
  "streak_30",
  "global_hunter",
  "deal_master",
  "top_100",
  "war_creator",
  "early_hunter",
] as const;

/** Award XP, update level, record the transaction. Idempotent per refId. */
export const awardXp = internalMutation({
  args: {
    profileId: v.id("profiles"),
    amount: v.number(),
    reason: v.string(),
    refType: v.optional(v.string()),
    refId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return;

    if (args.refId) {
      const existing = await ctx.db
        .query("pointsTransactions")
        .withIndex("by_profile_createdAt", (q) =>
          q.eq("profileId", args.profileId),
        )
        .filter((q) => q.eq(q.field("refId"), args.refId))
        .first();
      if (existing) return; // already awarded — idempotent
    }

    const newXp = Math.max(0, profile.xp + args.amount);
    await ctx.db.patch(args.profileId, {
      xp: newXp,
      points: newXp,
      level: levelInfo(newXp).level,
    });
    await ctx.db.insert("pointsTransactions", {
      profileId: args.profileId,
      amount: args.amount,
      reason: args.reason,
      refType: args.refType,
      refId: args.refId,
      createdAt: Date.now(),
    });
  },
});

/** Award a badge if not already owned; returns true when newly earned. */
export const awardBadge = internalMutation({
  args: { profileId: v.id("profiles"), badgeKey: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userBadges")
      .withIndex("by_profile_key", (q) =>
        q.eq("profileId", args.profileId).eq("badgeKey", args.badgeKey),
      )
      .first();
    if (existing) return false;
    await ctx.db.insert("userBadges", {
      profileId: args.profileId,
      badgeKey: args.badgeKey,
      earnedAt: Date.now(),
    });
    return true;
  },
});

/**
 * Daily streak, computed ENTIRELY on the server. The client can never set
 * lastActiveDate or the streak count. Returns the updated streak.
 */
export const touchStreak = internalMutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const { streak, today, changed } = nextStreak(
      profile.lastActiveDate,
      profile.streakCount,
      Date.now(),
    );
    if (!changed) return streak;

    await ctx.db.patch(args.profileId, {
      streakCount: streak,
      lastActiveDate: today,
    });

    if (streak === 7) {
      await ctx.runMutation(internal.engine.awardBadge, {
        profileId: args.profileId,
        badgeKey: "streak_7",
      });
    }
    if (streak === 30) {
      await ctx.runMutation(internal.engine.awardBadge, {
        profileId: args.profileId,
        badgeKey: "streak_30",
      });
    }
    return streak;
  },
});

/** Recompute reputation from real moderation outcomes only. */
export const recomputeReputation = internalMutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("submissions")
      .withIndex("by_profile_createdAt", (q) =>
        q.eq("profileId", args.profileId),
      )
      .collect();
    const approved = subs.filter((s) => s.status === "approved").length;
    const rejected = subs.filter((s) => s.status === "rejected").length;
    const reputation = Math.max(0, 50 + approved * 5 - rejected * 10);
    await ctx.db.patch(args.profileId, { reputation });
  },
});

export const levelFromXp = internalQuery({
  args: { xp: v.number() },
  handler: async (_ctx, args) => levelInfo(args.xp),
});

export const allLevels = internalQuery({
  args: {},
  handler: async () => LEVELS,
});
