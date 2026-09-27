import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { XP } from "./engine";

type BadgeSeed = {
  key: string;
  name: string;
  description: string;
  emoji: string;
  sort: number;
};

type MissionSeed = {
  key: string;
  name: string;
  description: string;
  target: number;
  xpReward: number;
  emoji: string;
  sort: number;
};

const BADGES: BadgeSeed[] = [
  { key: "victory_buyer", name: "Victory", description: "Bought a product discovered on DEALWAR — Verified Buyer.", emoji: "🥇", sort: 0 },
  { key: "first_war", name: "First War", description: "Created your first Price War.", emoji: "⚔️", sort: 1 },
  { key: "first_win", name: "First Win", description: "Held the best price in a war.", emoji: "🏆", sort: 2 },
  { key: "price_hunter", name: "Price Hunter", description: "First verified discovery.", emoji: "🎯", sort: 3 },
  { key: "streak_7", name: "7 Day Streak", description: "Active 7 days in a row.", emoji: "🔥", sort: 4 },
  { key: "streak_30", name: "30 Day Streak", description: "Active 30 days in a row.", emoji: "🌋", sort: 5 },
  { key: "global_hunter", name: "Global Hunter", description: "Discovered deals in several countries.", emoji: "🌍", sort: 6 },
  { key: "deal_master", name: "Deal Master", description: "50 verified discoveries.", emoji: "💎", sort: 7 },
  { key: "top_100", name: "Top 100", description: "Reached the global Top 100.", emoji: "📈", sort: 8 },
  { key: "war_creator", name: "War Creator", description: "Created 3 or more wars.", emoji: "🛡️", sort: 9 },
  { key: "early_hunter", name: "Early Hunter", description: "Joined in the first season.", emoji: "🌱", sort: 10 },
];

const MISSIONS: MissionSeed[] = [
  { key: "find_a_deal", name: "Find a Deal", description: "Submit a price for any open war.", target: 1, xpReward: XP.MISSIONS.find_a_deal, emoji: "🔍", sort: 1 },
  { key: "join_3_wars", name: "Join 3 Wars", description: "Join 3 different wars today.", target: 3, xpReward: XP.MISSIONS.join_3_wars, emoji: "⚔️", sort: 2 },
  { key: "beat_a_price", name: "Beat a Price", description: "Get a submission approved below the previous best.", target: 1, xpReward: XP.MISSIONS.beat_a_price, emoji: "📉", sort: 3 },
  { key: "share_a_victory", name: "Share a Victory", description: "Share your win card.", target: 1, xpReward: XP.MISSIONS.share_a_victory, emoji: "📣", sort: 4 },
  { key: "create_a_war", name: "Create a War", description: "Start a new Price War today.", target: 1, xpReward: XP.MISSIONS.create_a_war, emoji: "🛡️", sort: 5 },
];

/** Idempotent catalog bootstrap for badges and missions. */
export const upsertCatalog = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const badge of BADGES) {
      const existing = await ctx.db
        .query("badges")
        .withIndex("by_key", (q) => q.eq("key", badge.key))
        .first();
      if (!existing) {
        await ctx.db.insert("badges", badge);
      }
    }
    for (const mission of MISSIONS) {
      const existing = await ctx.db
        .query("missions")
        .withIndex("by_key", (q) => q.eq("key", mission.key))
        .first();
      if (!existing) {
        await ctx.db.insert("missions", mission);
      }
    }
  },
});
