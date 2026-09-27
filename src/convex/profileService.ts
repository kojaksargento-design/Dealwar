import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Server-side profile bootstrap. Every mutation that needs a hunter profile
 * calls this, so a freshly signed-in user can act immediately without a
 * separate "create profile" round trip. Clients can never forge this — the
 * XP/points/reputation fields are initialized here and only changed by
 * internal engine mutations afterwards.
 */
export async function getOrCreateProfile(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"profiles">> {
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (existing) return existing;

  const user = await ctx.db.get(userId);
  const base =
    (user?.name ?? user?.email?.split("@")[0] ?? "hunter")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 18) || "hunter";

  // Guarantee a unique username.
  let username = base;
  let n = 1;
  while (
    await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()
  ) {
    n += 1;
    username = `${base}${n}`;
  }

  const id = await ctx.db.insert("profiles", {
    userId,
    username,
    points: 0,
    xp: 0,
    level: 1,
    reputation: 50,
    streakCount: 0,
    warsCreated: 0,
    warsJoined: 0,
    wins: 0,
    discoveries: 0,
    shares: 0,
    createdAt: Date.now(),
  });

  // Guarantee the badge/mission catalogs exist for every real user. Idempotent,
  // cheap, and removes the dependency on the demo seeder ever having run.
  await ctx.runMutation(internal.seed.upsertCatalog, {});

  const created = await ctx.db.get(id);
  if (!created) throw new Error("Profile bootstrap failed.");
  return created;
}

/** Resolve the current identity's profile (auto-created), or null when signed out. */
export async function getCurrentProfile(
  ctx: MutationCtx,
): Promise<Doc<"profiles"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await getOrCreateProfile(ctx, userId);
}

/**
 * Look up the current identity's profile WITHOUT creating one. Use for
 * read/track paths (e.g. analytics) where attribution is best-effort and
 * profile creation would be a wasteful side effect.
 */
export async function findCurrentProfile(
  ctx: MutationCtx,
): Promise<Doc<"profiles"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
}

/**
 * Resolve the current identity's profile (auto-created) or throw.
 * Use inside mutations where signing in is mandatory — the returned profile
 * is non-null so callers don't need redundant checks.
 */
export async function requireProfile(
  ctx: MutationCtx,
  message = "Sign in required.",
): Promise<Doc<"profiles">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error(message);
  return await getOrCreateProfile(ctx, userId);
}
