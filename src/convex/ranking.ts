import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { levelInfo } from "./levels";

type ProfileRow = {
  rank: number;
  profileId: string;
  username: string;
  avatarEmoji: string;
  country: string | null;
  xp: number;
  wins: number;
  reputation: number;
  isDemo: boolean;
  level: number;
  levelName: string;
};

/**
 * Global ranking. Data comes ONLY from real profiles — no invented rows.
 * Weekly/monthly scopes rank by XP gained inside the period, computed from
 * pointsTransactions.
 */
export const ranking = query({
  args: {
    scope: v.union(
      v.literal("global"),
      v.literal("country"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    country: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const myProfile = userId
      ? await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first()
      : null;

    const take = Math.min(args.limit ?? 50, 100);
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_xp")
      .order("desc")
      .take(200);

    let rows: ProfileRow[] = profiles.map((p, i) => ({
      rank: i + 1,
      profileId: p._id,
      username: p.username,
      avatarEmoji: p.avatarEmoji ?? "🎯",
      country: p.country ?? null,
      xp: p.xp,
      wins: p.wins,
      reputation: p.reputation,
      isDemo: !!p.demo,
      level: levelInfo(p.xp).level,
      levelName: levelInfo(p.xp).name,
    }));

    if (args.scope === "country") {
      if (!args.country) return { rows: [], myRank: null, total: 0 };
      rows = rows.filter((r) => r.country === args.country);
    } else if (args.scope === "weekly" || args.scope === "monthly") {
      const since = Date.now() - (args.scope === "weekly" ? 7 : 30) * 86400000;
      const txs = await ctx.db.query("pointsTransactions").collect();
      const gains = new Map<string, number>();
      for (const t of txs) {
        if (t.createdAt >= since && t.amount > 0) {
          gains.set(t.profileId, (gains.get(t.profileId) ?? 0) + t.amount);
        }
      }
      rows = rows
        .map((r) => ({ ...r, xp: gains.get(r.profileId) ?? 0 }))
        .filter((r) => r.xp > 0)
        .sort((a, b) => b.xp - a.xp);
      rows = rows.map((r, i) => ({ ...r, rank: i + 1 }));
    }

    let myRank: number | null = null;
    if (myProfile) {
      const found = rows.find((r) => r.profileId === myProfile._id);
      myRank = found ? found.rank : null;
    }

    return { rows: rows.slice(0, take), myRank, total: rows.length };
  },
});
