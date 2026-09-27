import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

/** Ensure the signed-in user has a hunter profile; create it on first use. */
export const ensureMyProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) return existing._id;

    const user = await ctx.db.get(userId);
    const base = (user?.name ?? user?.email?.split("@")[0] ?? "hunter")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 18) || "hunter";

    // Guarantee a unique username.
    let username = base;
    let n = 1;
    while (
      await ctx.db
        .query("profiles")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first()
    ) {
      n += 1;
      username = `${base}${n}`;
    }

    return await ctx.db.insert("profiles", {
      userId,
      username,
      points: 0,
      xp: 0,
      level: 1,
      reputation: 50,
      streakCount: 0,
      warsCreated: 0,
      warsJoined: 0,
      wins: 0,
      discoveries: 0,
      shares: 0,
      createdAt: Date.now(),
    });
  },
});

const COUNTRIES = [
  "PT", "ES", "FR", "DE", "IT", "UK", "US", "BR", "NL", "BE", "OTHER",
] as const;

/** Edit only your own profile fields. XP/points/reputation are NOT editable. */
export const updateMyProfile = mutation({
  args: {
    username: v.optional(v.string()),
    country: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found.");

    const patch: Record<string, unknown> = {};

    if (args.username !== undefined) {
      const username = args.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (username.length < 3 || username.length > 18) {
        throw new Error("Username must be 3–18 characters (a–z, 0–9, _).");
      }
      const taken = await ctx.db
        .query("profiles")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first();
      if (taken && taken._id !== profile._id) {
        throw new Error("That username is already taken.");
      }
      patch.username = username;
    }
    if (args.country !== undefined) {
      if (!(COUNTRIES as readonly string[]).includes(args.country)) {
        throw new Error("Unsupported country.");
      }
      patch.country = args.country;
    }
    if (args.bio !== undefined) {
      if (args.bio.length > 280) throw new Error("Bio is too long (max 280).");
      patch.bio = args.bio;
    }
    if (args.avatarEmoji !== undefined) {
      patch.avatarEmoji = args.avatarEmoji.slice(0, 4);
    }

    await ctx.db.patch(profile._id, patch);
    await ctx.db.insert("auditLogs", {
      actorProfileId: profile._id,
      action: "profile.update",
      targetType: "profile",
      targetId: profile._id,
      createdAt: Date.now(),
    });
    return profile._id;
  },
});

/** Record a valid daily action (streak is computed server-side). */
export const touchStreak = mutation({
  args: {},
  handler: async (ctx): Promise<number | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    return await ctx.runMutation(internal.engine.touchStreak, {
      profileId: profile._id,
    });
  },
});
