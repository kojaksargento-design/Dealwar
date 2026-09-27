/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as business from "../business.js";
import type * as demoSeed from "../demoSeed.js";
import type * as email from "../email.js";
import type * as engine from "../engine.js";
import type * as gamification from "../gamification.js";
import type * as http from "../http.js";
import type * as levels from "../levels.js";
import type * as minuteSeries from "../minuteSeries.js";
import type * as missions from "../missions.js";
import type * as moderation from "../moderation.js";
import type * as notifications from "../notifications.js";
import type * as owner from "../owner.js";
import type * as packages from "../packages.js";
import type * as profileService from "../profileService.js";
import type * as ranking from "../ranking.js";
import type * as seed from "../seed.js";
import type * as sharing from "../sharing.js";
import type * as sponsorLeads from "../sponsorLeads.js";
import type * as streak from "../streak.js";
import type * as submissionRules from "../submissionRules.js";
import type * as users from "../users.js";
import type * as wars from "../wars.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  analytics: typeof analytics;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  business: typeof business;
  demoSeed: typeof demoSeed;
  email: typeof email;
  engine: typeof engine;
  gamification: typeof gamification;
  http: typeof http;
  levels: typeof levels;
  minuteSeries: typeof minuteSeries;
  missions: typeof missions;
  moderation: typeof moderation;
  notifications: typeof notifications;
  owner: typeof owner;
  packages: typeof packages;
  profileService: typeof profileService;
  ranking: typeof ranking;
  seed: typeof seed;
  sharing: typeof sharing;
  sponsorLeads: typeof sponsorLeads;
  streak: typeof streak;
  submissionRules: typeof submissionRules;
  users: typeof users;
  wars: typeof wars;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
