import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { findCurrentProfile } from "./profileService";

/** Record an analytics event (page_view, war_view, signup, login, …). */
export const track = mutation({
  args: {
    name: v.string(),
    warId: v.optional(v.id("wars")),
    meta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Best-effort attribution: no profile side effects, no PII beyond the id.
    const profile = await findCurrentProfile(ctx);
    const allowed = [
      "page_view",
      "war_view",
      "war_join",
      "war_create",
      "submission_create",
      "submission_approved",
      "share",
      "affiliate_click",
      "conversion",
      "campaign_view",
      "campaign_click",
      "signup",
      "login",
      "streak",
      "mission_complete",
    ];
    if (!allowed.includes(args.name)) return;

    await ctx.db.insert("analyticsEvents", {
      name: args.name,
      profileId: profile?._id,
      warId: args.warId,
      meta: args.meta ? args.meta.slice(0, 120) : undefined,
      createdAt: Date.now(),
    });
  },
});

/** Counts per event for dashboards (public aggregate). */
export const counts = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const since = Date.now() - (args.days ?? 30) * 24 * 3600 * 1000;
    const events = await ctx.db.query("analyticsEvents").collect();
    const counts: Record<string, number> = {};
    for (const e of events) {
      if (e.createdAt >= since) {
        counts[e.name] = (counts[e.name] ?? 0) + 1;
      }
    }
    return counts;
  },
});
