import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * DEMO CONTENT. Every row created here is marked demo: true and shown with a
 * DEMO badge in the UI. Never mixes with real rows. Idempotent: only seeds
 * when the wars table is completely empty, so it never touches real data.
 */
export const seedDemoIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const anyWar = await ctx.db.query("wars").first();
    if (anyWar !== null) return { seeded: false };

    // catalog bootstrap runs first so missions/badges exist for everyone
    await ctx.runMutation(internal.seed.upsertCatalog, {});

    const now = Date.now();
    const D = 24 * 3600 * 1000;

    const demoHunters = [
      { username: "demo_nova", country: "PT", xp: 620, wins: 4, discoveries: 9, streak: 6, emoji: "🦊" },
      { username: "demo_rafa", country: "ES", xp: 430, wins: 2, discoveries: 6, streak: 3, emoji: "🐯" },
      { username: "demo_elena", country: "DE", xp: 285, wins: 1, discoveries: 4, streak: 2, emoji: "🦉" },
      { username: "demo_luc", country: "FR", xp: 150, wins: 1, discoveries: 2, streak: 1, emoji: "🐺" },
    ];
    const profileIds: Record<string, Id<"profiles">> = {};
    for (const h of demoHunters) {
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_username", (q) => q.eq("username", h.username))
        .first();
      if (existing) {
        profileIds[h.username] = existing._id;
        continue;
      }
      const id = await ctx.db.insert("profiles", {
        username: h.username,
        country: h.country,
        avatarEmoji: h.emoji,
        points: h.xp,
        xp: h.xp,
        level: levelFromXp(h.xp),
        reputation: 50 + h.discoveries * 5,
        streakCount: h.streak,
        warsCreated: 1,
        warsJoined: 3,
        wins: h.wins,
        discoveries: h.discoveries,
        shares: 2,
        demo: true,
        createdAt: now - 30 * D,
      });
      profileIds[h.username] = id;
    }

    // products + categories
    const cats = [
      { name: "Tech", slug: "tech", emoji: "💻" },
      { name: "Home", slug: "home", emoji: "🏠" },
      { name: "Fitness", slug: "fitness", emoji: "🏋️" },
    ];
    const catIds: Record<string, Id<"categories">> = {};
    for (const c of cats) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", c.slug))
        .first();
      catIds[c.slug] = existing
        ? existing._id
        : await ctx.db.insert("categories", c);
    }

    const prods = [
      { name: "Wireless Headphones X200 (DEMO)", slug: "wireless-headphones-x200-demo", emoji: "🎧", cat: "tech" },
      { name: "Smart Watch Fit 5 (DEMO)", slug: "smart-watch-fit-5-demo", emoji: "⌚", cat: "tech" },
      { name: "Robot Vacuum R8 (DEMO)", slug: "robot-vacuum-r8-demo", emoji: "🤖", cat: "home" },
      { name: "Adjustable Dumbbell 24kg (DEMO)", slug: "adjustable-dumbbell-24kg-demo", emoji: "🏋️", cat: "fitness" },
    ];
    const prodIds: Record<string, Id<"products">> = {};
    for (const p of prods) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", p.slug))
        .first();
      prodIds[p.slug] = existing
        ? existing._id
        : await ctx.db.insert("products", {
            name: p.name,
            slug: p.slug,
            emoji: p.emoji,
            categoryId: catIds[p.cat],
            demo: true,
            createdAt: now,
          });
    }

    // demo stores — names only, NO invented URLs
    const demoStores = [
      { name: "DemoStore PT", country: "PT" },
      { name: "DemoShop ES", country: "ES" },
    ];
    const storeIds: Id<"stores">[] = [];
    for (const s of demoStores) {
      const id = await ctx.db.insert("stores", {
        name: s.name,
        country: s.country,
        active: true,
        demo: true,
      });
      storeIds.push(id);
    }

    const warsSeed = [
      {
        slug: "wireless-headphones-x200-demo",
        title: "Wireless Headphones X200 — Beat €149 (DEMO)",
        description: "DEMO war. Find the X200 cheaper than €149 and win the war.",
        prod: "wireless-headphones-x200-demo",
        original: 14900,
        best: 9900,
        days: 5,
        creator: "demo_nova",
        participants: 3,
        cat: "tech",
        history: [14900, 12900, 11900, 10900, 9900],
      },
      {
        slug: "smart-watch-fit-5-demo",
        title: "Smart Watch Fit 5 — Beat €199 (DEMO)",
        description: "DEMO war. The Fit 5 starts at €199 — beat it.",
        prod: "smart-watch-fit-5-demo",
        original: 19900,
        best: 17900,
        days: 3,
        creator: "demo_rafa",
        participants: 2,
        cat: "tech",
        history: [19900, 18900, 17900],
      },
      {
        slug: "robot-vacuum-r8-demo",
        title: "Robot Vacuum R8 — Beat €329 (DEMO)",
        description: "DEMO war. R8 at €329 — find it lower.",
        prod: "robot-vacuum-r8-demo",
        original: 32900,
        best: 32900,
        days: 8,
        creator: "demo_elena",
        participants: 1,
        cat: "home",
        history: [32900],
      },
    ];

    for (const w of warsSeed) {
      const existing = await ctx.db
        .query("wars")
        .withIndex("by_slug", (q) => q.eq("slug", w.slug))
        .first();
      if (existing) continue;

      const warId = await ctx.db.insert("wars", {
        slug: w.slug,
        title: w.title,
        description: w.description,
        productId: prodIds[w.prod],
        creatorId: profileIds[w.creator],
        categoryId: catIds[w.cat],
        originalPrice: w.original,
        bestPrice: w.best,
        currency: "EUR",
        country: "PT",
        status: "open",
        endTime: now + w.days * D,
        participants: w.participants,
        submissionsCount: Math.max(0, w.history.length - 1),
        views: 0,
        demo: true,
        createdAt: now - 2 * D,
      });

      let t = now - 2 * D;
      for (let i = 0; i < w.history.length; i++) {
        await ctx.db.insert("priceHistory", {
          warId,
          price: w.history[i],
          label: i === 0 ? "Starting price (DEMO)" : `Verified discovery (DEMO)`,
          source: "demo",
          createdAt: t + i * 6 * 3600 * 1000,
        });
      }

      // one approved demo submission by the last hunter in history
      if (w.history.length > 1) {
        await ctx.db.insert("submissions", {
          warId,
          productId: prodIds[w.prod],
          profileId: profileIds["demo_luc"],
          price: w.history[w.history.length - 1],
          storeId: storeIds[0],
          url: "https://example.com/demo-offer",
          notes: "DEMO submission for illustration.",
          status: "approved",
          beatsBest: true,
          demo: true,
          createdAt: now - D,
        });
      }

      await ctx.db.insert("warParticipants", {
        warId,
        profileId: profileIds[w.creator],
        createdAt: now - 2 * D,
      });
    }

    return { seeded: true };
  },
});

function levelFromXp(xp: number): number {
  if (xp >= 2000) return 5;
  if (xp >= 900) return 4;
  if (xp >= 400) return 3;
  if (xp >= 150) return 2;
  return 1;
}

/** Admin/dev trigger to run the catalog bootstrap any time. */
export const runCatalogBootstrap = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.upsertCatalog, {});
    return { ok: true };
  },
});

