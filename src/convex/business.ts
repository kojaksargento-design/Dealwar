import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ------------------------------------------------------------------
// Queries
// ------------------------------------------------------------------

/** My business profile (one per user). */
export const getMyBusiness = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    return await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerProfileId", profile._id))
      .first();
  },
});

/** Campaigns that belong to my business. */
export const listMyCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return [];
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerProfileId", profile._id))
      .first();
    if (!business) return [];
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .order("desc")
      .collect();
    const out = [];
    for (const c of campaigns) {
      const war = c.warId ? await ctx.db.get(c.warId) : null;
      out.push({
        _id: c._id,
        name: c.name,
        type: c.type,
        status: c.status,
        clicks: c.clicks,
        views: c.views,
        warId: c.warId,
        warTitle: war ? war.title : null,
        warSlug: war ? war.slug : null,
      });
    }
    return out;
  },
});

/**
 * Real campaign aggregates for the business dashboard. Zeros are REAL here —
 * they mean no views/clicks have happened yet, never simulated revenue.
 */
export const myBusinessStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerProfileId", profile._id))
      .first();
    if (!business) return null;

    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .collect();
    const warIds = campaigns
      .map((c) => c.warId)
      .filter((id): id is typeof campaigns[number]["warId"] => id !== undefined);

    const clicks = await ctx.db.query("affiliateClicks").collect();
    const mine = clicks.filter(
      (c) => c.warId !== undefined && warIds.some((w) => w === c.warId),
    );
    const conversions = await ctx.db.query("conversions").collect();
    const mineConversions = conversions.filter(
      (c) => c.warId !== undefined && warIds.some((w) => w === c.warId),
    );

    return {
      campaignViews: campaigns.reduce((a, c) => a + c.views, 0),
      campaignClicks: campaigns.reduce((a, c) => a + c.clicks, 0),
      affiliateClicks: mine.length,
      conversions: mineConversions.length,
      // commission is only set by real network confirmation — stays undefined
      // (renders €0.00) until then
      confirmedCommission: mineConversions
        .filter((c) => c.status === "approved" || c.status === "paid")
        .reduce((a, c) => a + (c.commission ?? 0), 0),
    };
  },
});

// ------------------------------------------------------------------
// Mutations
// ------------------------------------------------------------------

/** Register a business profile. */
export const registerBusiness = mutation({
  args: {
    name: v.string(),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found.");

    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerProfileId", profile._id))
      .first();
    if (existing) throw new Error("You already have a business profile.");

    const id = await ctx.db.insert("businesses", {
      ownerProfileId: profile._id,
      name: args.name.trim().slice(0, 60),
      website: args.website ? args.website.trim() : undefined,
      country: profile.country,
      verified: false,
      createdAt: Date.now(),
    });
    return id;
  },
});

/** Create a campaign. Sponsored content is always clearly labelled. */
export const createCampaign = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("sponsored_war"),
      v.literal("product_launch"),
      v.literal("brand_war"),
      v.literal("special_offer"),
    ),
    status: v.optional(v.union(v.literal("draft"), v.literal("active"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found.");

    const business = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerProfileId", profile._id))
      .first();
    if (!business) throw new Error("Register your business first.");

    const name = args.name.trim();
    if (name.length < 3 || name.length > 80) {
      throw new Error("Campaign name must be 3–80 characters.");
    }

    const id = await ctx.db.insert("campaigns", {
      businessId: business._id,
      name,
      type: args.type,
      status: args.status ?? "draft",
      clicks: 0,
      views: 0,
      createdAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: profile._id,
      action: "campaign.create",
      targetType: "campaign",
      targetId: id,
      createdAt: Date.now(),
    });
    return id;
  },
});

/** Create a sponsored war (requires a business). The war is marked sponsored. */
export const createSponsoredWar = mutation({
  args: {
    campaignId: v.id("campaigns"),
    title: v.string(),
    description: v.optional(v.string()),
    productName: v.string(),
    originalPrice: v.number(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found.");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found.");
    const business = await ctx.db.get(campaign.businessId);
    if (!business || business.ownerProfileId !== profile._id) {
      throw new Error("That campaign is not yours.");
    }

    const name = args.title.trim();
    if (name.length < 6 || name.length > 90) {
      throw new Error("Title must be 6–90 characters.");
    }
    const price = args.originalPrice;
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Invalid price.");
    }

    const slugBase = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 55);
    let slug = slugBase || "war";
    let n = 2;
    while (
      await ctx.db
        .query("wars")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
    ) {
      slug = slugBase + "-" + n;
      n = n + 1;
    }

    let product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.productName))
      .first();
    if (!product) {
      const prodId = await ctx.db.insert("products", {
        name: args.productName,
        slug: args.productName,
        createdAt: Date.now(),
      });
      product = await ctx.db.get(prodId);
    }
    if (!product) throw new Error("Could not create product.");

    const now = Date.now();
    const days = Math.min(Math.max(args.days ?? 14, 1), 30);

    const warId = await ctx.db.insert("wars", {
      slug: slug,
      title: name,
      description: args.description ? args.description.slice(0, 400) : undefined,
      productId: product._id,
      creatorId: profile._id,
      categoryId: undefined,
      originalPrice: price,
      bestPrice: price,
      currency: "EUR",
      status: "open",
      endTime: now + days * 24 * 3600 * 1000,
      participants: 1,
      submissionsCount: 0,
      views: 0,
      sponsored: true,
      campaignId: campaign._id,
      createdAt: now,
    });

    await ctx.db.insert("warParticipants", {
      warId: warId,
      profileId: profile._id,
      createdAt: now,
    });
    await ctx.db.insert("priceHistory", {
      warId: warId,
      price: price,
      label: "Starting price",
      source: "system",
      createdAt: now,
    });
    await ctx.db.patch(campaign._id, { warId: warId });

    await ctx.db.insert("analyticsEvents", {
      name: "campaign_view",
      profileId: profile._id,
      warId: warId,
      createdAt: now,
    });
    return warId;
  },
});

/** Update campaign status. */
export const setCampaignStatus = mutation({
  args: {
    campaignId: v.id("campaigns"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("ended"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found.");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found.");
    const business = await ctx.db.get(campaign.businessId);
    if (!business || business.ownerProfileId !== profile._id) {
      throw new Error("That campaign is not yours.");
    }

    await ctx.db.patch(campaign._id, { status: args.status });
    return campaign._id;
  },
});
