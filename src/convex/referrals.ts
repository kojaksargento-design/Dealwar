// DEALWAR viral referrals — invite codes + XP rewards for growing the app.
// Rewards are VIRTUAL (XP) only, mirroring the honesty rules:
//   - Invitee: +50 XP "welcome boost" when signing up via an invite link
//   - Inviter: +30 XP per confirmed signup (lifetime cap 50 invites — honesty)
//   - Inviter: +75 XP bonus when an invitee creates their first war
//   - Inviter: +75 XP bonus when an invitee wins their first hunt
// The invite link carries ?ref=CODE — the landing page stores it and it is
// consumed server-side at profile bootstrap. All XP flows through engine.ts.

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getOrCreateProfile } from "./profileService";

export const REFERRAL_XP = {
  INVITEE_WELCOME: 50,
  INVITER_SIGNUP: 30,
  INVITER_FIRST_WAR: 75,
  INVITER_FIRST_WIN: 75,
} as const;

export const INVITER_SIGNUP_CAP = 50; // lifetime cap on paid signups per user

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function generateCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return "DW-" + code;
}

/** Ensure a profile has a unique referral code (idempotent). */
export async function ensureReferralCode(ctx: MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile || profile.referralCode) return profile?.referralCode;
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const clash = await ctx.db
      .query("profiles")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", code))
      .first();
    if (!clash) {
      await ctx.db.patch(profileId, { referralCode: code });
      return code;
    }
  }
  return undefined;
}

/** Read my referral code (may be null for pre-referral accounts). */
export const getMyCode = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return profile?.referralCode ?? null;
  },
});

/** Create my referral code if missing (idempotent mutation — queries can't write). */
export const ensureMyCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    if (profile.referralCode) return profile.referralCode;
    return (await ensureReferralCode(ctx, profile._id)) ?? null;
  },
});

/** Consume a stored invite code after signup (client calls once post-auth). */
export const claimInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;
    const profile = await getOrCreateProfile(ctx, userId);
    await consumeInvite(ctx, profile._id, args.code.trim().toUpperCase());
  },
});

/** Public: resolve a code to inviter display info (for the invite banner). */
export const resolveCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.code))
      .first();
    if (!profile) return null;
    return {
      username: profile.username,
      avatarEmoji: profile.avatarEmoji ?? "🎯",
      xp: profile.xp,
      inviteCount: profile.inviteCount ?? 0,
    };
  },
});

/** My referral stats: invites, XP earned from referrals, recent rewards. */
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    const rewards = await ctx.db
      .query("referralRewards")
      .withIndex("by_inviter_createdAt", (q) => q.eq("inviterProfileId", profile._id))
      .order("desc")
      .take(15);
    const totalXp = rewards.reduce((acc, r) => acc + r.xpAwarded, 0);
    return {
      code: profile.referralCode ?? null,
      inviteCount: profile.inviteCount ?? 0,
      totalXp,
      rewards,
    };
  },
});

/**
 * Consume an invite: called by profileService bootstrap when a NEW profile is
 * created with a pending ref code. Idempotent via referralRewards rows.
 */
export async function consumeInvite(
  ctx: MutationCtx,
  inviteeProfileId: Id<"profiles">,
  code: string,
) {
  const inviter = await ctx.db
    .query("profiles")
    .withIndex("by_referralCode", (q) => q.eq("referralCode", code))
    .first();
  if (!inviter || inviter._id === inviteeProfileId) return;

  // Link the invitee to the inviter (only once).
  const invitee = await ctx.db.get(inviteeProfileId);
  if (!invitee || invitee.referredByProfileId) return;
  await ctx.db.patch(inviteeProfileId, { referredByProfileId: inviter._id });

  // Welcome boost for the invitee (+50 XP).
  await ctx.runMutation(internal.engine.awardXp, {
    profileId: inviteeProfileId,
    amount: REFERRAL_XP.INVITEE_WELCOME,
    reason: "Convite aceito: bónus de boas-vindas",
    refType: "referral",
    refId: `signup:${inviteeProfileId}`,
  });

  // Reward the inviter (+30 XP), capped for honesty.
  const paidSignups = await ctx.db
    .query("referralRewards")
    .withIndex("by_inviter_createdAt", (q) => q.eq("inviterProfileId", inviter._id))
    .take(200);
  const signupCount = paidSignups.filter((r) => r.type === "signup").length;
  if (signupCount < INVITER_SIGNUP_CAP) {
    await ctx.runMutation(internal.engine.awardXp, {
      profileId: inviter._id,
      amount: REFERRAL_XP.INVITER_SIGNUP,
      reason: `Convite aceito por @${invitee?.username ?? "?"}`,
      refType: "referral",
      refId: `signup:${inviteeProfileId}:inviter`,
    });
    await ctx.db.insert("referralRewards", {
      inviterProfileId: inviter._id,
      inviteeProfileId,
      code,
      type: "signup",
      xpAwarded: REFERRAL_XP.INVITER_SIGNUP,
      createdAt: Date.now(),
    });
    await ctx.db.patch(inviter._id, { inviteCount: (inviter.inviteCount ?? 0) + 1 });
    await ctx.db.insert("notifications", {
      profileId: inviter._id,
      type: "referral",
      title: "🎯 Novo caçador recrutado!",
      body: `@${invitee?.username ?? "?"} entrou pelo teu convite: +${REFERRAL_XP.INVITER_SIGNUP} XP.`,
      read: false,
      createdAt: Date.now(),
    });
  }

  await ctx.db.insert("analyticsEvents", {
    name: "referral_signup",
    profileId: inviteeProfileId,
    meta: code,
    createdAt: Date.now(),
  });
}

/** Milestone: invitee created their first war → inviter +75 XP. */
export const onInviteeFirstWar = internalMutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    await milestone(ctx, args.profileId, "invitee_first_war", REFERRAL_XP.INVITER_FIRST_WAR, "criou a primeira guerra");
  },
});

/** Milestone: invitee held a best price → inviter +75 XP. */
export const onInviteeFirstWin = internalMutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    await milestone(ctx, args.profileId, "invitee_first_win", REFERRAL_XP.INVITER_FIRST_WIN, "venceu a primeira caça");
  },
});

async function milestone(
  ctx: MutationCtx,
  inviteeProfileId: Id<"profiles">,
  type: "invitee_first_war" | "invitee_first_win",
  xp: number,
  label: string,
) {
  const invitee = await ctx.db.get(inviteeProfileId);
  if (!invitee?.referredByProfileId) return;
  const inviterId = invitee.referredByProfileId;

  // Idempotent: one reward row per (inviter, invitee, type).
  const existing = await ctx.db
    .query("referralRewards")
    .withIndex("by_inviter_createdAt", (q) => q.eq("inviterProfileId", inviterId))
    .take(300);
  if (existing.some((r) => r.type === type && r.inviteeProfileId === inviteeProfileId)) return;

  await ctx.runMutation(internal.engine.awardXp, {
    profileId: inviterId,
    amount: xp,
    reason: `@${invitee.username} ${label}`,
    refType: "referral",
    refId: `${type}:${inviteeProfileId}`,
  });
  await ctx.db.insert("referralRewards", {
    inviterProfileId: inviterId,
    inviteeProfileId,
    code: invitee.referralCode ?? "—",
    type,
    xpAwarded: xp,
    createdAt: Date.now(),
  });
  await ctx.db.insert("notifications", {
    profileId: inviterId,
    type: "referral",
    title: "🔥 O teu recruta está a voar!",
    body: `@${invitee.username} ${label}: +${xp} XP para ti.`,
    read: false,
    createdAt: Date.now(),
  });
}
