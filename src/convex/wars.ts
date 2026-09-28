import { getAuthUserId } from "@convex-dev/auth/server";
import {
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { requireProfile } from "./profileService";
import {
  RATE_LIMIT_PER_HOUR,
  validateSubmissionPrice,
  validateSubmissionUrl,
  checkRateLimit,
} from "./submissionRules";

// ---------- Queries ----------

/** Feed of open wars, newest first. Sponsored/featured badges render in the UI. */
export const listOpen = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 24, 60);
    const wars = await ctx.db
      .query("wars")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "open"))
      .order("desc")
      .take(limit);
    return enrichWars(ctx, wars);
  },
});

/** Wars ranked by participants (TRENDING). */
export const listTrending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 60);
    const wars = await ctx.db
      .query("wars")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "open"))
      .order("desc")
      .filter((q) => q.gt(q.field("participants"), 0))
      .take(limit);
    const sorted = [...wars].sort((a, b) => b.participants - a.participants);
    return enrichWars(ctx, sorted.slice(0, limit));
  },
});

/** The DAILY WAR: most participants among wars ending soonest. */
export const getDailyWar = query({
  args: {},
  handler: async (ctx) => {
    const wars = await ctx.db
      .query("wars")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "open"))
      .order("desc")
      .take(30);
    if (wars.length === 0) return null;
    const daily = [...wars].sort(
      (a, b) => a.endTime - b.endTime || b.participants - a.participants,
    )[0];
    const [enriched] = await enrichWars(ctx, [daily]);
    return enriched ?? null;
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const wars = await ctx.db
      .query("wars")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "open"))
      .order("desc")
      .filter((q) => q.eq(q.field("featured"), true))
      .take(args.limit ?? 6);
    return enrichWars(ctx, wars);
  },
});

export const get = query({
  args: { id: v.id("wars") },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.id);
    if (!war) return null;
    const [enriched] = await enrichWars(ctx, [war]);
    return enriched ?? null;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const war = await ctx.db
      .query("wars")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!war) return null;
    const [enriched] = await enrichWars(ctx, [war]);
    return enriched ?? null;
  },
});

/** Wars by the same product (product page). */
export const listByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const wars = await ctx.db
      .query("wars")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(20);
    return enrichWars(ctx, wars);
  },
});

/** Recent submissions for a war, including pending ones (marked as such). */
export const listSubmissions = query({
  args: { warId: v.id("wars"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("submissions")
      .withIndex("by_war_createdAt", (q) => q.eq("warId", args.warId))
      .order("desc")
      .take(args.limit ?? 30);
    const out = [];
    for (const s of subs) {
      const profile = s.profileId ? await ctx.db.get(s.profileId) : null;
      const store = s.storeId ? await ctx.db.get(s.storeId) : null;
      out.push({
        ...s,
        username: profile?.username ?? "unknown",
        avatarEmoji: profile?.avatarEmoji ?? "🎯",
        storeLabel: store?.name ?? s.storeName ?? "—",
      });
    }
    return out;
  },
});

/** War-specific ranking from APPROVED submissions only. */
export const warRanking = query({
  args: { warId: v.id("wars") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("submissions")
      .withIndex("by_war_createdAt", (q) => q.eq("warId", args.warId))
      .collect()
      .then((all) => all.filter((s) => s.status === "approved"));
    const byProfile = new Map<Doc<"profiles">["_id"], { price: number; count: number }>();
    for (const s of subs) {
      const cur = byProfile.get(s.profileId);
      if (!cur || s.price < cur.price) {
        byProfile.set(s.profileId, { price: s.price, count: (cur?.count ?? 0) + 1 });
      } else {
        cur.count += 1;
      }
    }
    const entries = [...byProfile.entries()];
    const rows = [];
    for (const [profileId, agg] of entries) {
      const p = await ctx.db.get(profileId);
      rows.push({
        profileId,
        username: p?.username ?? "unknown",
        avatarEmoji: p?.avatarEmoji ?? "🎯",
        country: p?.country ?? null,
        bestPrice: agg.price,
        submissions: agg.count,
      });
    }
    rows.sort((a, b) => a.bestPrice - b.bestPrice);
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  },
});

/** Price history timeline for a war (original → best). */
export const getPriceHistory = query({
  args: { warId: v.id("wars") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("priceHistory")
      .withIndex("by_war_createdAt", (q) => q.eq("warId", args.warId))
      .order("asc")
      .collect();
  },
});

/** Search wars by title. */
export const search = query({
  args: { q: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const query = args.q.trim();
    if (query.length < 2) return [];
    return await ctx.db
      .query("wars")
      .withSearchIndex("search_title", (q) =>
        q.search("title", query).eq("status", "open"),
      )
      .take(args.limit ?? 10);
  },
});

// ---------- Mutations ----------

/** Create a war. +10 XP. Server validates all prices. */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    productName: v.string(),
    categoryName: v.optional(v.string()),
    originalPrice: v.number(), // cents
    currency: v.string(),
    country: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx, "Sign in to create a war.");

    // -- validation ------------------------------------------------------
    const title = args.title.trim();
    if (title.length < 6 || title.length > 90) {
      throw new Error("Title must be 6–90 characters.");
    }
    const productName = args.productName.trim();
    if (productName.length < 2 || productName.length > 80) {
      throw new Error("Product name must be 2–80 characters.");
    }
    if (!Number.isFinite(args.originalPrice) || args.originalPrice <= 0) {
      throw new Error("Invalid original price.");
    }
    if (args.originalPrice > 50_000_00) {
      throw new Error("Price too high for a Price War.");
    }
    if (args.currency !== "EUR") throw new Error("Only EUR is supported in V1.");

    const slugBase = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
    let slug = slugBase || "war";
    let n = 2;
    while (
      await ctx.db.query("wars").withIndex("by_slug", (q) => q.eq("slug", slug)).first()
    ) {
      slug = `${slugBase}-${n++}`;
    }

    // product + category
    const catName = (args.categoryName ?? "Other").trim() || "Other";
    let category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slugify(catName)))
      .first();
    if (!category) {
      const catId = await ctx.db.insert("categories", {
        name: catName,
        slug: slugify(catName),
        emoji: "📦",
      });
      category = await ctx.db.get(catId);
    }

    let product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slugify(productName)))
      .first();
    if (!product) {
      const prodId = await ctx.db.insert("products", {
        name: productName,
        slug: slugify(productName),
        categoryId: category?._id,
        createdAt: Date.now(),
      });
      product = await ctx.db.get(prodId);
    }
    if (!product) throw new Error("Could not create product.");

    const days = Math.min(Math.max(args.days ?? 7, 1), 30);
    const now = Date.now();

    const warId = await ctx.db.insert("wars", {
      slug,
      title,
      description: args.description?.slice(0, 400),
      productId: product._id,
      creatorId: profile._id,
      categoryId: category?._id,
      originalPrice: args.originalPrice,
      bestPrice: args.originalPrice,
      currency: args.currency,
      country: args.country,
      status: "open",
      endTime: now + days * 24 * 3600 * 1000,
      participants: 1,
      submissionsCount: 0,
      views: 0,
      createdAt: now,
    });

    await ctx.db.insert("warParticipants", {
      warId,
      profileId: profile._id,
      createdAt: now,
    });

    await ctx.db.insert("priceHistory", {
      warId,
      price: args.originalPrice,
      label: "Starting price",
      source: "system",
      createdAt: now,
    });

    await ctx.db.patch(profile._id, { warsCreated: profile.warsCreated + 1 });

    await ctx.runMutation(internal.engine.awardXp, {
      profileId: profile._id,
      amount: 10,
      reason: "Created a War",
      refType: "war",
      refId: warId,
    });
    await ctx.runMutation(internal.engine.awardBadge, {
      profileId: profile._id,
      badgeKey: "first_war",
    });
    if (profile.warsCreated + 1 >= 3) {
      await ctx.runMutation(internal.engine.awardBadge, {
        profileId: profile._id,
        badgeKey: "war_creator",
      });
    }
    await ctx.runMutation(internal.engine.touchStreak, { profileId: profile._id });
    await ctx.runMutation(internal.missions.bumpMission, {
      missionKey: "create_a_war",
      amount: 1,
    });
    // Viral loop: reward the inviter when a referred hunter creates their first war.
    await ctx.runMutation(internal.referrals.onInviteeFirstWar, { profileId: profile._id });

    await ctx.db.insert("analyticsEvents", {
      name: "war_create",
      profileId: profile._id,
      warId,
      createdAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: profile._id,
      action: "war.create",
      targetType: "war",
      targetId: warId,
      createdAt: now,
    });

    return warId;
  },
});

/** Join a war (participant). +5 XP. */
export const join = mutation({
  args: { warId: v.id("wars") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx, "Sign in to join wars.");

    const war = await ctx.db.get(args.warId);
    if (!war) throw new Error("War not found.");
    if (war.status !== "open") throw new Error("This war has ended.");

    const already = await ctx.db
      .query("warParticipants")
      .withIndex("by_war_profile", (q) =>
        q.eq("warId", args.warId).eq("profileId", profile._id),
      )
      .first();
    if (already) return { joined: true, alreadyJoined: true };

    await ctx.db.insert("warParticipants", {
      warId: args.warId,
      profileId: profile._id,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.warId, {
      participants: war.participants + 1,
    });
    await ctx.db.patch(profile._id, { warsJoined: profile.warsJoined + 1 });

    await ctx.runMutation(internal.engine.awardXp, {
      profileId: profile._id,
      amount: 5,
      reason: "Joined a War",
      refType: "war",
      refId: args.warId,
    });
    await ctx.runMutation(internal.engine.touchStreak, { profileId: profile._id });
    await ctx.runMutation(internal.missions.bumpMission, {
      missionKey: "join_3_wars",
      amount: 1,
    });

    // notify war creator
    if (war.creatorId && war.creatorId !== profile._id) {
      await ctx.db.insert("notifications", {
        profileId: war.creatorId,
        type: "war_join",
        title: "Someone joined your war",
        body: `@${profile.username} joined “${war.title}”.`,
        warId: args.warId,
        read: false,
        createdAt: Date.now(),
      });
    }

    await ctx.db.insert("analyticsEvents", {
      name: "war_join",
      profileId: profile._id,
      warId: args.warId,
      createdAt: Date.now(),
    });
    return { joined: true, alreadyJoined: false };
  },
});

/** Submit a lower price. ALWAYS lands as pending — never auto-verified. */
export const submitPrice = mutation({
  args: {
    warId: v.id("wars"),
    price: v.number(), // cents
    storeId: v.optional(v.id("stores")),
    storeName: v.optional(v.string()),
    url: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx, "Sign in to submit prices.");
    if (profile.suspended) throw new Error("Account suspended.");

    const war = await ctx.db.get(args.warId);
    if (!war) throw new Error("War not found.");
    if (war.status !== "open") throw new Error("This war has ended.");

    // -- anti-fraud validation (pure rules, unit-tested) -----------------
    const priceError = validateSubmissionPrice(args.price, war.bestPrice);
    if (priceError) throw new Error(priceError);
    const urlError = validateSubmissionUrl(args.url);
    if (urlError) throw new Error(urlError);

    // rate limit: max 5 submissions per profile per hour
    const hourAgo = Date.now() - 3600_000;
    const recent = await ctx.db
      .query("submissions")
      .withIndex("by_profile_createdAt", (q) => q.eq("profileId", profile._id))
      .filter((q) => q.gt(q.field("createdAt"), hourAgo))
      .collect();
    const rateError = checkRateLimit(
      recent.map((s) => s.createdAt),
      Date.now(),
    );
    if (rateError) throw new Error(rateError);
    // duplicate submission guard: same war+price+url
    const duplicate = await ctx.db
      .query("submissions")
      .withIndex("by_war_createdAt", (q) => q.eq("warId", args.warId))
      .filter((q) =>
        q.and(
          q.eq(q.field("price"), args.price),
          q.eq(q.field("url"), args.url.trim()),
        ),
      )
      .first();
    if (duplicate) throw new Error("You already submitted this exact price/URL.");

    // ensure participant
    const participant = await ctx.db
      .query("warParticipants")
      .withIndex("by_war_profile", (q) =>
        q.eq("warId", args.warId).eq("profileId", profile._id),
      )
      .first();
    if (!participant) {
      await ctx.db.insert("warParticipants", {
        warId: args.warId,
        profileId: profile._id,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.warId, { participants: war.participants + 1 });
      await ctx.db.patch(profile._id, { warsJoined: profile.warsJoined + 1 });
    }

    const now = Date.now();
    const submissionId = await ctx.db.insert("submissions", {
      warId: args.warId,
      productId: war.productId,
      profileId: profile._id,
      price: args.price,
      storeId: args.storeId,
      storeName: args.storeName?.slice(0, 60),
      url: args.url.trim(),
      notes: args.notes?.slice(0, 400),
      status: "pending",
      beatsBest: true,
      createdAt: now,
    });

    await ctx.db.patch(args.warId, {
      submissionsCount: war.submissionsCount + 1,
    });

    await ctx.db.insert("analyticsEvents", {
      name: "submission_create",
      profileId: profile._id,
      warId: args.warId,
      createdAt: now,
    });
    await ctx.runMutation(internal.engine.touchStreak, { profileId: profile._id });
    await ctx.runMutation(internal.missions.bumpMission, {
      missionKey: "find_a_deal",
      amount: 1,
    });

    return { submissionId, status: "pending" as const };
  },
});

// ---------- helpers ----------

async function enrichWars(
  ctx: QueryCtx,
  wars: Array<Doc<"wars">>,
) {
  const out = [];
  for (const war of wars) {
    const product = war.productId ? await ctx.db.get(war.productId) : null;
    const category = war.categoryId ? await ctx.db.get(war.categoryId) : null;
    const creator = war.creatorId ? await ctx.db.get(war.creatorId) : null;
    const campaign = war.campaignId ? await ctx.db.get(war.campaignId) : null;
    const business = campaign ? await ctx.db.get(campaign.businessId) : null;
    out.push({
      ...war,
      productName: product?.name ?? "Unknown product",
      productEmoji: product?.emoji ?? "📦",
      categoryLabel: category?.name ?? "Other",
      categoryEmoji: category?.emoji ?? "📦",
      creatorUsername: creator?.username ?? "anonymous",
      businessName: business?.name ?? null,
    });
  }
  return out;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
