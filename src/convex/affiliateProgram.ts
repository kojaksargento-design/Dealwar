// DEALWAR user-affiliate program — hunters share partner-store links (Temu,
// Amazon, Shein, Worten...) and earn a commission SHARE when someone buys
// through their link. HONESTY RULES APPLY:
//   - Commission amounts are NEVER simulated: they are entered by the owner
//     from the affiliate network's real dashboard and confirmed manually.
//   - Split: 70% to the user who shared the link, 30% to the platform.
//   - Money is paid by the owner via MB Way/bank against payout requests.
// The platform's own network commission flows into existing revenue views.

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireProfile } from "./profileService";
import { ensureReferralCode } from "./referrals";

/** Platform keeps 30% of confirmed commissions; the sharer earns 70%. */
export const USER_SHARE_PCT = 0.7;

/** Minimum payout: €10 (avoids micro-transfer fees eating the user's money). */
export const MIN_PAYOUT_CENTS = 1000;

const PARTNER_STORES = [
  { key: "temu", label: "Temu", url: "https://www.temu.com", network: "Admitad" },
  { key: "amazon", label: "Amazon", url: "https://www.amazon.pt", network: "Amazon Associates" },
  { key: "shein", label: "Shein", url: "https://es.shein.com", network: "Admitad" },
  { key: "awin", label: "Awin (Worten, PcDiálogo...)", url: "https://www.awin.com", network: "Awin" },
  { key: "aliexpress", label: "AliExpress", url: "https://pt.aliexpress.com", network: "Admitad" },
  { key: "ebay", label: "eBay", url: "https://www.ebay.pt", network: "eBay Partner" },
] as const;

/** Partner store catalog (public, static — honest labels, real networks). */
export const listPartners = query({
  args: {},
  handler: async () => PARTNER_STORES,
});

/** Join the user-affiliate program (idempotent). Creates the invite code too. */
export const joinProgram = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    const updates: { affiliatePartner: boolean; referralCode?: string } = {
      affiliatePartner: true,
    };
    if (!profile.referralCode) {
      const code = await ensureReferralCode(ctx, profile._id);
      if (code) updates.referralCode = code;
    }
    await ctx.db.patch(profile._id, updates);
    await ctx.db.insert("notifications", {
      profileId: profile._id,
      type: "affiliate",
      title: "💰 Bem-vindo ao programa de afiliados!",
      body: "Partilha links das tuas lojas favoritas e ganha 70% da comissão quando alguém compra.",
      read: false,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/** My affiliate dashboard data: balance, conversions, clicks. */
export const getMyDashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    const conversions = await ctx.db
      .query("affiliateConversions")
      .withIndex("by_referrer_createdAt", (q) => q.eq("referrerProfileId", profile._id))
      .order("desc")
      .take(20);
    const confirmed = conversions.filter((c) => c.status === "confirmed");
    const pending = conversions.filter((c) => c.status === "pending");
    return {
      partner: profile.affiliatePartner ?? false,
      code: profile.referralCode ?? null,
      balance: profile.affiliateBalance ?? 0, // cents
      totalEarned: confirmed.reduce((a, c) => a + (c.userShare ?? 0), 0),
      pendingCount: pending.length,
      confirmedCount: confirmed.length,
      conversions,
    };
  },
});

/** Owner: register a REAL conversion from a network report and credit the user. */
export const registerConversion = mutation({
  args: {
    referrerCode: v.string(), // the sharer's code (DW-XXXXXX)
    storeLabel: v.string(),
    orderValue: v.optional(v.number()), // cents
    commission: v.number(), // cents — REAL value from the network dashboard
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const owner = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!owner?.isAdmin) throw new Error("Owner access required.");

    const sharer = await ctx.db
      .query("profiles")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referrerCode))
      .first();
    if (!sharer) throw new Error("Código de afiliado não encontrado.");

    const userShare = Math.round(args.commission * USER_SHARE_PCT);
    const id = await ctx.db.insert("affiliateConversions", {
      referrerProfileId: sharer._id,
      storeLabel: args.storeLabel.slice(0, 60),
      orderValue: args.orderValue,
      commission: args.commission,
      userShare,
      status: "confirmed",
      note: args.note?.slice(0, 300),
      createdAt: Date.now(),
      confirmedAt: Date.now(),
    });

    // Credit the user's balance (server-managed).
    await ctx.db.patch(sharer._id, {
      affiliateBalance: (sharer.affiliateBalance ?? 0) + userShare,
    });

    await ctx.db.insert("notifications", {
      profileId: sharer._id,
      type: "affiliate",
      title: "💸 Comissão confirmada!",
      body: `+${(userShare / 100).toFixed(2)}€ pelo teu link ${args.storeLabel}. Saldo: ${((sharer.affiliateBalance ?? 0) + userShare) / 100}€.`,
      read: false,
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      actorProfileId: owner._id,
      action: "affiliate.conversion_register",
      targetType: "affiliateConversion",
      targetId: id,
      meta: `${args.storeLabel} commission=${args.commission} userShare=${userShare}`,
      createdAt: Date.now(),
    });
    await ctx.db.insert("analyticsEvents", {
      name: "affiliate_conversion_confirmed",
      profileId: sharer._id,
      meta: args.storeLabel,
      createdAt: Date.now(),
    });
    return id;
  },
});

/** User: request a payout of their full balance (min €10). */
export const requestPayout = mutation({
  args: {
    method: v.union(v.literal("mbway"), v.literal("bank")),
    contact: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const balance = profile.affiliateBalance ?? 0;
    if (balance < MIN_PAYOUT_CENTS) {
      throw new Error(`Saldo mínimo para saque: ${(MIN_PAYOUT_CENTS / 100).toFixed(0)}€.`);
    }
    const contact = args.contact.trim();
    if (contact.length < 6) throw new Error("Contacto inválido.");
    const open = await ctx.db
      .query("payoutRequests")
      .withIndex("by_profile_createdAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(10);
    if (open.some((p) => p.status === "requested")) {
      throw new Error("Já tens um saque pendente.");
    }
    const id = await ctx.db.insert("payoutRequests", {
      profileId: profile._id,
      amount: balance,
      method: args.method,
      contact,
      status: "requested",
      createdAt: Date.now(),
    });
    await ctx.db.insert("notifications", {
      profileId: profile._id,
      type: "affiliate",
      title: "📤 Saque solicitado",
      body: `${(balance / 100).toFixed(2)}€ via ${args.method === "mbway" ? "MB Way" : "transferência"}. Pagamento em até 48h.`,
      read: false,
      createdAt: Date.now(),
    });
    return id;
  },
});

/** Owner: payout queues + totals for the revenue views. */
export const listPayoutsAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const owner = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!owner?.isAdmin) throw new Error("Owner access required.");
    const rows = await ctx.db
      .query("payoutRequests")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "requested"))
      .order("desc")
      .take(50);
    const out = [];
    for (const p of rows) {
      const profile = await ctx.db.get(p.profileId);
      out.push({
        _id: p._id,
        username: profile?.username ?? "?",
        amount: p.amount,
        method: p.method,
        contact: p.contact,
        createdAt: p.createdAt,
      });
    }
    return out;
  },
});

/** Owner: mark a payout as paid (after the real MB Way/bank transfer). */
export const markPayoutPaid = mutation({
  args: { payoutId: v.id("payoutRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const owner = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!owner?.isAdmin) throw new Error("Owner access required.");
    const payout = await ctx.db.get(args.payoutId);
    if (!payout || payout.status !== "requested") throw new Error("Saque inválido.");

    // Deduct from the user's balance at PAYMENT time (not request time) so a
    // cancelled request never loses money.
    const profile = await ctx.db.get(payout.profileId);
    if (profile) {
      await ctx.db.patch(profile._id, {
        affiliateBalance: Math.max(0, (profile.affiliateBalance ?? 0) - payout.amount),
      });
    }
    await ctx.db.patch(args.payoutId, { status: "paid", paidAt: Date.now() });
    await ctx.db.insert("auditLogs", {
      actorProfileId: owner._id,
      action: "affiliate.payout_paid",
      targetType: "payoutRequest",
      targetId: args.payoutId,
      meta: `${payout.amount}c via ${payout.method}`,
      createdAt: Date.now(),
    });
    await ctx.db.insert("notifications", {
      profileId: payout.profileId,
      type: "affiliate",
      title: "✅ Saque pago!",
      body: `${(payout.amount / 100).toFixed(2)}€ enviados via ${payout.method === "mbway" ? "MB Way" : "transferência"}.`,
      read: false,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Internal: attribute an affiliate click to the user-affiliate (by share token). */
export const attributeClick = internalMutation({
  args: { trackingId: v.string(), referrerProfileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const click = await ctx.db
      .query("affiliateClicks")
      .withIndex("by_trackingId", (q) => q.eq("trackingId", args.trackingId))
      .first();
    if (!click) return;
    await ctx.db.patch(click._id, { referrerProfileId: args.referrerProfileId });
  },
});
