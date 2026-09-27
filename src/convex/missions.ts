import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { XP } from "./engine";

/** Mission catalog. */
export const listMissions = query({
  args: {},
  handler: async (ctx) => {
    const missions = await ctx.db.query("missions").collect();
    return missions.sort((a, b) => a.sort - b.sort);
  },
});

/** Today's missions for the signed-in user (server computes the date). */
export const getMyMissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;

    const today = new Date().toISOString().slice(0, 10);
    const missions = (await ctx.db.query("missions").collect()).sort(
      (a, b) => a.sort - b.sort,
    );
    const progresses = await ctx.db
      .query("userMissions")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profile._id).eq("date", today),
      )
      .collect();

    const byKey = new Map(progresses.map((p) => [p.missionKey, p]));
    return missions.map((m) => {
      const prog = byKey.get(m.key);
      return {
        key: m.key,
        name: m.name,
        description: m.description,
        emoji: m.emoji,
        target: m.target,
        xpReward: m.xpReward,
        progress: prog?.progress ?? 0,
        completed: prog?.completed ?? false,
      };
    });
  },
});

// ---- internal progress helpers --------------------------------------

export const bumpMission = internalMutation({
  args: { missionKey: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return;

    const mission = await ctx.db
      .query("missions")
      .withIndex("by_key", (q) => q.eq("key", args.missionKey))
      .first();
    if (!mission) return;

    const today = new Date().toISOString().slice(0, 10);
    let prog = await ctx.db
      .query("userMissions")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profile._id).eq("date", today),
      )
      .filter((q) => q.eq(q.field("missionKey"), args.missionKey))
      .first();

    if (!prog) {
      const id = await ctx.db.insert("userMissions", {
        profileId: profile._id,
        missionKey: args.missionKey,
        date: today,
        progress: Math.max(0, args.amount),
        completed: false,
      });
      prog = await ctx.db.get(id);
    } else if (!prog.completed) {
      await ctx.db.patch(prog._id, {
        progress: Math.min(mission.target, prog.progress + args.amount),
      });
      prog = await ctx.db.get(prog._id);
    }

    if (prog && !prog.completed && prog.progress >= mission.target) {
      await ctx.db.patch(prog._id, { completed: true, completedAt: Date.now() });
      await ctx.runMutation(internal.engine.awardXp, {
        profileId: profile._id,
        amount: mission.xpReward,
        reason: `Mission: ${mission.name}`,
        refType: "mission",
        refId: `${mission.key}:${today}`,
      });
      await ctx.db.insert("notifications", {
        profileId: profile._id,
        type: "mission_complete",
        title: `Mission complete: ${mission.name}`,
        body: `+${mission.xpReward} XP earned.`,
        read: false,
        createdAt: Date.now(),
      });
      await ctx.db.insert("analyticsEvents", {
        name: "mission_complete",
        profileId: profile._id,
        createdAt: Date.now(),
      });
    }
  },
});
