import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ============================================================
    // DEALWAR tables
    // ============================================================

    // Public hunter profile. XP / points / reputation can ONLY be changed by
    // server logic (src/convex/engine.ts) — never directly by clients.
    profiles: defineTable({
      userId: v.optional(v.id("users")), // undefined for DEMO profiles
      username: v.string(),
      country: v.optional(v.string()), // ISO code e.g. "PT"
      bio: v.optional(v.string()),
      avatarEmoji: v.optional(v.string()),

      // gamification (server-managed)
      points: v.number(), // virtual points — NOT money
      xp: v.number(),
      level: v.number(),
      reputation: v.number(),
      streakCount: v.number(),
      lastActiveDate: v.optional(v.string()), // "yyyy-mm-dd" computed on the SERVER

      // counters (server-managed)
      warsCreated: v.number(),
      warsJoined: v.number(),
      wins: v.number(), // times this user held the best price
      discoveries: v.number(), // approved submissions
      shares: v.number(),

      isAdmin: v.optional(v.boolean()),
      suspended: v.optional(v.boolean()),
      demo: v.optional(v.boolean()),
      createdAt: v.number(),
    })
      .index("by_userId", ["userId"])
      .index("by_username", ["username"])
      .index("by_xp", ["xp"])
      .index("by_createdAt", ["createdAt"]),

    categories: defineTable({
      name: v.string(),
      slug: v.string(),
      emoji: v.string(),
    }).index("by_slug", ["slug"]),

    products: defineTable({
      name: v.string(),
      slug: v.string(),
      emoji: v.optional(v.string()),
      description: v.optional(v.string()),
      categoryId: v.optional(v.id("categories")),
      demo: v.optional(v.boolean()),
      createdAt: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_category", ["categoryId"]),

    stores: defineTable({
      name: v.string(),
      website: v.optional(v.string()), // never invent — empty = "Not configured"
      country: v.optional(v.string()),
      affiliateNetwork: v.optional(v.string()),
      affiliateUrl: v.optional(v.string()),
      active: v.boolean(),
      demo: v.optional(v.boolean()),
    }).index("by_active", ["active"]),

    wars: defineTable({
      slug: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.id("products"),
      creatorId: v.optional(v.id("profiles")),
      categoryId: v.optional(v.id("categories")),

      originalPrice: v.number(), // cents — the price to beat
      bestPrice: v.number(), // cents — verified best so far
      currency: v.string(), // "EUR"

      country: v.optional(v.string()),
      status: v.union(v.literal("open"), v.literal("ended")),
      endTime: v.number(),

      sponsored: v.optional(v.boolean()),
      campaignId: v.optional(v.id("campaigns")),
      featured: v.optional(v.boolean()),

      participants: v.number(),
      submissionsCount: v.number(),
      views: v.number(),

      demo: v.optional(v.boolean()),
      createdAt: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_status_endTime", ["status", "endTime"])
      .index("by_status_createdAt", ["status", "createdAt"])
      .index("by_createdAt", ["createdAt"])
      .index("by_product", ["productId"])
      .index("by_participants", ["participants"])
      .index("by_views", ["views"])
      .searchIndex("search_title", {
        searchField: "title",
        filterFields: ["status"],
      }),

    warParticipants: defineTable({
      warId: v.id("wars"),
      profileId: v.id("profiles"),
      createdAt: v.number(),
    })
      .index("by_war_profile", ["warId", "profileId"])
      .index("by_profile", ["profileId"]),

    // Price submissions always start as PENDING — never trusted automatically.
    submissions: defineTable({
      warId: v.id("wars"),
      productId: v.id("products"),
      profileId: v.id("profiles"),
      price: v.number(), // cents
      storeId: v.optional(v.id("stores")),
      storeName: v.optional(v.string()), // free text when store not in DB
      url: v.string(),
      notes: v.optional(v.string()),

      status: v.union(
        v.literal("pending"),
        v.literal("validating"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
      beatsBest: v.boolean(), // computed at submit time; only confirmed on approval

      reviewedAt: v.optional(v.number()),
      demo: v.optional(v.boolean()),
      createdAt: v.number(),
    })
      .index("by_war_createdAt", ["warId", "createdAt"])
      .index("by_profile_createdAt", ["profileId", "createdAt"])
      .index("by_status_createdAt", ["status", "createdAt"]),

    // Historical prices for a war (original → current best).
    priceHistory: defineTable({
      warId: v.id("wars"),
      price: v.number(),
      label: v.optional(v.string()), // e.g. "Starting price", "Verified by @user"
      source: v.union(v.literal("system"), v.literal("submission"), v.literal("demo")),
      createdAt: v.number(),
    }).index("by_war_createdAt", ["warId", "createdAt"]),

    pointsTransactions: defineTable({
      profileId: v.id("profiles"),
      amount: v.number(), // XP delta
      reason: v.string(),
      refType: v.optional(v.string()),
      refId: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_profile_createdAt", ["profileId", "createdAt"])
      .index("by_createdAt", ["createdAt"]),

    badges: defineTable({
      key: v.string(),
      name: v.string(),
      description: v.string(),
      emoji: v.string(),
      sort: v.number(),
    }).index("by_key", ["key"]),

    userBadges: defineTable({
      profileId: v.id("profiles"),
      badgeKey: v.string(),
      earnedAt: v.number(),
    })
      .index("by_profile", ["profileId"])
      .index("by_profile_key", ["profileId", "badgeKey"]),

    missions: defineTable({
      key: v.string(),
      name: v.string(),
      description: v.string(),
      target: v.number(),
      xpReward: v.number(),
      emoji: v.string(),
      sort: v.number(),
    }).index("by_key", ["key"]),

    userMissions: defineTable({
      profileId: v.id("profiles"),
      missionKey: v.string(),
      date: v.string(), // "yyyy-mm-dd" computed on the SERVER
      progress: v.number(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    }).index("by_profile_date", ["profileId", "date"]),

    notifications: defineTable({
      profileId: v.id("profiles"),
      type: v.string(),
      title: v.string(),
      body: v.optional(v.string()),
      warId: v.optional(v.id("wars")),
      read: v.boolean(),
      createdAt: v.number(),
    }).index("by_profile_createdAt", ["profileId", "createdAt"]),

    // Affiliate architecture. No network is configured by default — statuses
    // stay at CLICKED until a real network confirms. Commission is NEVER
    // presented as confirmed without network confirmation.
    affiliateClicks: defineTable({
      profileId: v.optional(v.id("profiles")),
      warId: v.optional(v.id("wars")),
      productId: v.optional(v.id("products")),
      storeId: v.optional(v.id("stores")),
      trackingId: v.string(),
      status: v.union(
        v.literal("clicked"),
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("paid"),
      ),
      createdAt: v.number(),
    })
      .index("by_trackingId", ["trackingId"])
      .index("by_createdAt", ["createdAt"])
      .index("by_store_createdAt", ["storeId", "createdAt"]),

    conversions: defineTable({
      clickId: v.id("affiliateClicks"),
      profileId: v.optional(v.id("profiles")),
      warId: v.optional(v.id("wars")),
      storeId: v.optional(v.id("stores")),
      commission: v.optional(v.number()), // cents — set ONLY by network confirmation
      currency: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("paid"),
      ),
      createdAt: v.number(),
    }).index("by_status", ["status"]),

    // REAL money received directly by the owner (bank transfer, MB Way,
    // invoice). Only the owner can insert rows; never simulated.
    manualPayments: defineTable({
      amount: v.number(), // cents, > 0
      source: v.string(), // e.g. "Acme Lda — sponsored war"
      note: v.optional(v.string()),
      receivedAt: v.number(),
    }).index("by_receivedAt", ["receivedAt"]),

    // Inbound sponsorship requests from the public Business page. Leads are
    // NOT revenue — they only become money when the owner registers a real
    // payment after closing the deal manually.
    sponsorLeads: defineTable({
      name: v.string(),
      email: v.string(),
      message: v.string(),
      status: v.union(v.literal("new"), v.literal("contacted"), v.literal("closed")),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // Stripe Checkout orders for sponsorship packages. An order starts as
    // pending and is ONLY marked paid by the verified Stripe webhook — never
    // by client input. Pending ≠ money; paid = real money received.
    orders: defineTable({
      businessName: v.string(),
      email: v.string(),
      packageKey: v.string(), // "basic" | "pro" | "brand"
      amount: v.number(), // cents
      status: v.union(v.literal("pending"), v.literal("paid"), v.literal("cancelled")),
      stripeSessionId: v.optional(v.string()),
      createdAt: v.number(),
      paidAt: v.optional(v.number()),
    })
      .index("by_sessionId", ["stripeSessionId"])
      .index("by_createdAt", ["createdAt"]),

    businesses: defineTable({
      ownerProfileId: v.id("profiles"),
      name: v.string(),
      website: v.optional(v.string()),
      country: v.optional(v.string()),
      verified: v.boolean(),
      demo: v.optional(v.boolean()),
      createdAt: v.number(),
    }).index("by_owner", ["ownerProfileId"]),

    campaigns: defineTable({
      businessId: v.id("businesses"),
      warId: v.optional(v.id("wars")),
      name: v.string(),
      type: v.union(
        v.literal("sponsored_war"),
        v.literal("product_launch"),
        v.literal("brand_war"),
        v.literal("special_offer"),
      ),
      status: v.union(v.literal("draft"), v.literal("active"), v.literal("paused"), v.literal("ended")),
      budget: v.optional(v.number()), // cents — optional, no real payments in V1
      clicks: v.number(),
      views: v.number(),
      demo: v.optional(v.boolean()),
      createdAt: v.number(),
    }).index("by_business", ["businessId"]),

    reports: defineTable({
      reporterProfileId: v.optional(v.id("profiles")),
      targetType: v.union(
        v.literal("war"),
        v.literal("product"),
        v.literal("user"),
        v.literal("store"),
        v.literal("submission"),
        v.literal("price"),
      ),
      targetId: v.string(),
      reason: v.string(),
      status: v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed")),
      createdAt: v.number(),
    })
      .index("by_status_createdAt", ["status", "createdAt"])
      .index("by_createdAt", ["createdAt"]),

    auditLogs: defineTable({
      actorProfileId: v.optional(v.id("profiles")),
      action: v.string(),
      targetType: v.optional(v.string()),
      targetId: v.optional(v.string()),
      meta: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    analyticsEvents: defineTable({
      name: v.string(),
      profileId: v.optional(v.id("profiles")),
      warId: v.optional(v.id("wars")),
      meta: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_name_createdAt", ["name", "createdAt"]),
  },
  { schemaValidation: false },
);

export default schema;
