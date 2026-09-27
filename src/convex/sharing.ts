import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { XP } from "./engine";

/** Share-card payload for a war (ShareCard component + OG metadata). */
export const getShareCard = query({
  args: { warId: v.id("wars") },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war) return null;
    const product = await ctx.db.get(war.productId);
    return {
      warTitle: war.title,
      warSlug: war.slug,
      productName: product ? product.name : "Product",
      originalPrice: war.originalPrice,
      bestPrice: war.bestPrice,
      currency: war.currency,
      saved: war.originalPrice - war.bestPrice,
      participants: war.participants,
      sponsored: !!war.sponsored,
    };
  },
});

/** Record a share of a victory. +2 XP (idempotent per war+channel). */
export const recordShare = mutation({
  args: {
    warId: v.id("wars"),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return;

    await ctx.db.patch(profile._id, { shares: profile.shares + 1 });
    await ctx.runMutation(internal.engine.awardXp, {
      profileId: profile._id,
      amount: XP.SHARE_VICTORY,
      reason: "Shared a victory",
      refType: "share",
      refId: args.warId + ":" + args.channel,
    });
    await ctx.runMutation(internal.missions.bumpMission, {
      missionKey: "share_a_victory",
      amount: 1,
    });
    await ctx.db.insert("analyticsEvents", {
      name: "share",
      profileId: profile._id,
      warId: args.warId,
      meta: args.channel,
      createdAt: Date.now(),
    });
  },
});

/**
 * Affiliate click tracking. Architecture only — no network is configured in
 * V1, so clicks are recorded with status "clicked" and are NEVER presented
 * as confirmed revenue.
 */
export const trackAffiliateClick = mutation({
  args: {
    warId: v.optional(v.id("wars")),
    productId: v.optional(v.id("products")),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let profileId: Id<"profiles"> | undefined = undefined;
    if (userId) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      profileId = profile ? profile._id : undefined;
    }
    const trackingId =
      "dw_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    const id = await ctx.db.insert("affiliateClicks", {
      profileId,
      warId: args.warId,
      productId: args.productId,
      storeId: args.storeId,
      trackingId,
      status: "clicked",
      createdAt: Date.now(),
    });
    await ctx.db.insert("analyticsEvents", {
      name: "affiliate_click",
      profileId,
      warId: args.warId,
      createdAt: Date.now(),
    });
    return { id, trackingId };
  },
});

/**
 * Public offers for a war's product: stores WITH a configured affiliate link.
 * Empty when no affiliate links exist yet — the UI then hides the offers
 * section entirely (no fake links, honesty rule).
 */
export const listOffers = query({
  args: { warId: v.id("wars") },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war) return [];
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return stores
      .filter((s) => !!s.affiliateUrl)
      .map((s) => ({
        storeId: s._id,
        name: s.name,
        country: s.country ?? null,
        affiliateUrl: s.affiliateUrl as string,
      }));
  },
});
