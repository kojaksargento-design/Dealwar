// Pure validation rules for price submissions, extracted so the exact rules
// the server enforces can be unit-tested (and reused) without a Convex context.

export const RATE_LIMIT_PER_HOUR = 5;

export function validateSubmissionPrice(
  priceCents: number,
  currentBestCents: number,
): string | null {
  if (!Number.isFinite(priceCents)) return "Invalid price.";
  if (priceCents <= 0) return "Invalid price.";
  if (priceCents >= currentBestCents) {
    return "Your price must be lower than the current best.";
  }
  return null;
}

export function validateSubmissionUrl(url: string): string | null {
  if (!/^https?:\/\/.+\..+/.test(url.trim())) {
    return "Provide a valid product URL (https://…).";
  }
  return null;
}

/**
 * Rate-limit check against the timestamps of the profile's recent submissions.
 * @param recentTimestamps timestamps inside the current 1-hour window
 */
export function checkRateLimit(recentTimestamps: number[], nowMs: number): string | null {
  const hourAgo = nowMs - 3600_000;
  const inWindow = recentTimestamps.filter((t) => t > hourAgo).length;
  if (inWindow >= RATE_LIMIT_PER_HOUR) {
    return "Rate limit: max 5 submissions per hour. Try again later.";
  }
  return null;
}
