import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { levelInfo } from "./levels";

/** Get a public profile with derived level info. */
export const getProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;
    return { ...profile, levelInfo: levelInfo(profile.xp) };
  },
});

/** Current viewer's profile with derived level info (null when signed out). */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    return { ...profile, levelInfo: levelInfo(profile.xp) };
  },
});

/**
 * Cheap client-safe admin check. Returns false for signed-out users and
 * non-admins — never throws — so pages can gate rendering before subscribing
 * to admin-only queries (which throw for unauthorized callers).
 */
export const isMyAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return profile?.isAdmin === true;
  },
});

/** Badge catalog (all 10 badges). */
export const listBadges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("badges").withIndex("by_key").collect();
  },
});

/** Badges earned by a profile. */
export const listMyBadges = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userBadges")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();
  },
});

/** XP transaction history for a profile (latest first). */
export const listXpHistory = query({
  args: { profileId: v.id("profiles"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pointsTransactions")
      .withIndex("by_profile_createdAt", (q) =>
        q.eq("profileId", args.profileId),
      )
      .order("desc")
      .take(args.limit ?? 20);
  },
});
