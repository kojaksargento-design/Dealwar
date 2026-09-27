// DEALWAR AI ARCHITECTURE — all agents DISABLED by default.
// No AI calls are ever made without an explicitly configured API key.
// The Vly/AI integration key (process.env.VLY_INTEGRATION_KEY) enables them
// later; until then every agent reports "not_configured".

export type AgentName =
  | "deal_hunter"
  | "trend_hunter"
  | "war_creator"
  | "price_validator"
  | "viral_agent"
  | "affiliate_optimizer"
  | "fraud_detector"
  | "ceo_agent";

export type AgentStatus =
  | "disabled"
  | "not_configured"
  | "enabled";

export interface AgentConfig {
  name: AgentName;
  status: AgentStatus;
  description: string;
}

export const AGENTS: AgentConfig[] = [
  {
    name: "deal_hunter",
    status: "disabled",
    description:
      "Scores deal opportunities (opportunity_score, reason, suggested_war) from real inputs — never invents prices.",
  },
  {
    name: "trend_hunter",
    status: "disabled",
    description:
      "Detects rising products/categories from real engagement data only.",
  },
  {
    name: "war_creator",
    status: "disabled",
    description:
      "Drafts title, description, share text, SEO title/description, CTA from app-provided data.",
  },
  {
    name: "price_validator",
    status: "disabled",
    description: "Assists moderation by validating submitted prices/URLs.",
  },
  {
    name: "viral_agent",
    status: "disabled",
    description:
      "Drafts social captions and scripts. Never publishes automatically.",
  },
  {
    name: "affiliate_optimizer",
    status: "disabled",
    description: "Suggests link placements from real click/conversion data.",
  },
  {
    name: "fraud_detector",
    status: "disabled",
    description:
      "Flags abnormal activity patterns for human moderation review.",
  },
  {
    name: "ceo_agent",
    status: "disabled",
    description:
      "Summarizes real dashboard data and recommends next actions. No invented metrics.",
  },
];

/** Contract every agent must implement when enabled later. */
export interface Agent<TInput, TOutput> {
  readonly name: AgentName;
  run(input: TInput): Promise<TOutput>;
}

/** Example future input/output contracts (kept as types for activation). */
export interface DealHunterInput {
  product: string;
  category: string;
  price: number; // cents, real input only
  market: string;
}
export interface DealHunterOutput {
  opportunity_score: number; // 0–100, derived from provided data
  reason: string;
  suggested_war: { title: string; description: string } | null;
}

export interface TrendHunterOutput {
  risingProducts: string[];
  risingCategories: string[];
  note: string;
}

/**
 * Runtime guard: an agent can only run when explicitly configured.
 * Replace the body with real API calls when AI_API_KEY is set.
 */
export function assertAgentEnabled(agent: AgentConfig): void {
  if (agent.status !== "enabled") {
    throw new Error(
      `Agent ${agent.name} is ${agent.status}. Configure AI_API_KEY to enable.`,
    );
  }
}
