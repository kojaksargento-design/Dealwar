# ⚔️ DEALWAR — The Price Battle

**Find it. Beat it. Win the War.**

A social price-comparison platform where users create **Price Wars** on products,
the community hunts lower prices, and verified discoveries climb a global
ranking of deal hunters.

> **Transparency rules baked into the product**
> - XP and points are **virtual** — they never represent money.
> - Revenue metrics start at **€0.00** and only reflect real, confirmed conversions.
> - No price is ever auto-verified: every submission goes through
>   `SUBMITTED → PENDING → VALIDATING → APPROVED / REJECTED`.
> - DEMO content is clearly labelled and never mixed with real data.
> - Unconfigured integrations always show **"Not configured"** — never simulated.

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19 + TypeScript + Vite + Tailwind CSS 4 (light Glassmorphism theme) |
| Backend    | Convex (database + server functions + auth) |
| Auth       | Convex Auth — email OTP + guest, Google OAuth ready |
| PWA        | Manifest + installable, mobile bottom navigation |

> The original specification mentioned Supabase/Next.js. This deployment uses
> **Convex**, which fills the same architectural role (PostgreSQL ↔ Convex
> tables, RLS ↔ server-enforced authorization, Edge functions ↔ Convex
> mutations). All security guarantees from the spec are preserved: clients can
> never write XP, points, reputation, conversions or revenue directly — every
> mutation is validated server-side.

## Pages

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Landing: hero, search, how-it-works, live wars, daily war, top hunters | Public |
| `/wars` | Explore all open wars with search | Public |
| `/war/:slug` | War detail: prices, history, submissions, war ranking, BEAT THIS PRICE form | Public (actions need auth) |
| `/create` | Create a Price War (+10 XP) | Auth |
| `/ranking` | Global ranking: Global / Country / Weekly / Monthly | Public |
| `/profile` | Your hunter profile, XP bar, streak, badges, stats | Auth |
| `/missions` | Daily missions with progress and XP rewards | Auth |
| `/trending` | Wars ranked by hunter activity | Public |
| `/business` | Business area: company profile, campaigns, sponsored wars | Auth |
| `/admin` | Moderation queue, reports, stores, revenue, analytics | Admin only (server-checked) |
| `/settings` | Integrations status, PWA install, data transparency | Auth |

## Gamification (server-authoritative)

| Action | XP |
|--------|-----|
| Create War | +10 |
| Join War | +5 |
| Verified Discovery | +50 |
| Beat Best Price | +100 |
| Share Victory | +2 |
| Daily missions | +10 to +25 |

Levels: **Bronze → Silver (150 XP) → Gold (400) → Diamond (900) → Legend (2000)**.

10 badges: First War, First Win, Price Hunter, 7/30 Day Streak, Global Hunter,
Deal Master, Top 100, War Creator, Early Hunter.

All XP/badge/streak logic lives in `src/convex/engine.ts` as **internal
mutations** — unreachable from the client. The daily streak date is computed
on the server (`lastActiveDate`), so changing the device date does nothing.

## Anti-fraud & moderation

- Rate limit: max 5 submissions per profile per hour (server-enforced)
- Duplicate submission guard (same war + price + URL)
- URL format validation, price sanity checks
- Reputation score derived from approved/rejected submissions (server-only)
- `audit_logs` record every admin action (approve, reject, feature, suspend, verify)
- Reports: war / product / user / store / price / submission

## Affiliate architecture

Tables `stores`, `affiliate_clicks`, `conversions` implement the tracking
pipeline (`CLICKED → PENDING → APPROVED → REJECTED → PAID`). **No network is
connected in V1** — clicks are recorded with status `clicked` and revenue
stays €0.00 until a real network confirms conversions.

## AI architecture

`src/convex/ai.ts` defines interfaces and contracts for 8 agents (Deal Hunter,
Trend Hunter, War Creator, Price Validator, Viral Agent, Affiliate Optimizer,
Fraud Detector, CEO Agent). **All agents are DISABLED** and no AI call is made
without `AI_API_KEY` being configured.

## Local development

```bash
bun install
bun convex dev --once   # generate backend types (non-interactive)
bun run dev             # start the Vite dev server
```

Typecheck: `bun tsc -b --noEmit`
Tests: `bunx vitest run` (53 tests)

### Test coverage

| Suite | What it locks down |
|-------|--------------------|
| `levels.test.ts` | Bronze→Legend thresholds, XP progress math, tier ordering |
| `format.test.ts` | Currency/percent/countdown formatting incl. edge cases |
| `engine.test.ts` | XP constants match the spec exactly, 10 badges declared |
| `streak.test.ts` | Streak continuation/reset, month/year/leap boundaries, same-day idempotency (anti-cheat) |
| `submissionRules.test.ts` | Price/URL validation, hourly rate-limit boundaries, `javascript:` URL rejection |

Server rule logic is extracted into pure modules (`streak.ts`,
`submissionRules.ts`) so the exact rules the mutations enforce are directly
unit-testable without a Convex context.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_CONVEX_URL` | Convex deployment URL (provided by the platform) |
| `AI_API_KEY` | (future) enables AI agents — not required in V1 |
| `AFFILIATE_API_KEY` | (future) affiliate network credentials — not required in V1 |

No secrets are ever placed in frontend code. Backend-only integrations read
keys via `process.env` inside Convex actions.

## Demo data

A fresh deployment self-seeds a small set of **clearly-labelled DEMO wars,
hunters and price histories** (idempotent — skipped as soon as one real war
exists). Every demo row carries `demo: true` and renders with a DEMO badge.

## Admin access

Admin is a server-side flag (`profiles.isAdmin`). There is no public route to
become admin; grant it directly in the data console:

```
PATCH profiles <id>  { isAdmin: true }
```

## Roadmap after V1

1. Connect a real affiliate network (affiliate links, conversion webhooks)
2. Enable AI agents behind `AI_API_KEY`
3. Google OAuth provider
4. Country-scoped war offers (PT/ES/FR/DE/IT/UK/US)
5. Product pages at `/product/[slug]` with full SEO metadata
