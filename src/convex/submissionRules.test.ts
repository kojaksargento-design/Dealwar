import { describe, expect, it } from "vitest";
import {
  validateSubmissionPrice,
  validateSubmissionUrl,
  checkRateLimit,
  RATE_LIMIT_PER_HOUR,
} from "./submissionRules";

describe("validateSubmissionPrice", () => {
  const BEST = 9900; // €99.00

  it("accepts a valid lower price", () => {
    expect(validateSubmissionPrice(9800, BEST)).toBeNull();
    expect(validateSubmissionPrice(1, BEST)).toBeNull();
  });

  it("rejects a price equal to the current best", () => {
    expect(validateSubmissionPrice(BEST, BEST)).toMatch(/lower than the current best/);
  });

  it("rejects a price above the current best", () => {
    expect(validateSubmissionPrice(10000, BEST)).toMatch(/lower than the current best/);
  });

  it("rejects zero and negative prices", () => {
    expect(validateSubmissionPrice(0, BEST)).toBe("Invalid price.");
    expect(validateSubmissionPrice(-100, BEST)).toBe("Invalid price.");
  });

  it("rejects NaN and infinity", () => {
    expect(validateSubmissionPrice(NaN, BEST)).toBe("Invalid price.");
    expect(validateSubmissionPrice(Infinity, BEST)).toBe("Invalid price.");
  });
});

describe("validateSubmissionUrl", () => {
  it("accepts http and https URLs", () => {
    expect(validateSubmissionUrl("https://store.example.com/p/1")).toBeNull();
    expect(validateSubmissionUrl("http://shop.pt/item")).toBeNull();
  });

  it("trims whitespace before validating", () => {
    expect(validateSubmissionUrl("  https://store.example.com/x  ")).toBeNull();
  });

  it("rejects URLs without a scheme", () => {
    expect(validateSubmissionUrl("store.example.com/p/1")).toMatch(/valid product URL/);
  });

  it("rejects scheme-only or empty strings", () => {
    expect(validateSubmissionUrl("https://")).toMatch(/valid product URL/);
    expect(validateSubmissionUrl("")).toMatch(/valid product URL/);
    expect(validateSubmissionUrl("   ")).toMatch(/valid product URL/);
  });

  it("rejects javascript: URLs (no http/https scheme)", () => {
    expect(validateSubmissionUrl("javascript:alert(1)")).toMatch(/valid product URL/);
  });
});

describe("checkRateLimit", () => {
  const NOW = 1_000_000_000_000;
  const HOUR = 3600_000;

  // Semantics: the argument is the user's EXISTING in-window history. With 4
  // present, the next submit is the 5th (allowed). With 5 present, it would
  // be the 6th (blocked) — matching the server's original `>= 5` rule.
  it("allows the 5th submission (4 already in window)", () => {
    const stamps = [1, 2, 3, 4].map((n) => NOW - n * 60_000);
    expect(checkRateLimit(stamps, NOW)).toBeNull();
    expect(RATE_LIMIT_PER_HOUR).toBe(5);
  });

  it("blocks the 6th submission (5 already in window)", () => {
    const stamps = [1, 2, 3, 4, 5].map((n) => NOW - n * 60_000);
    expect(checkRateLimit(stamps, NOW)).toMatch(/Rate limit/);
  });

  it("ignores submissions older than one hour", () => {
    const stamps = [1, 2, 3, 4, 5, 6].map((n) => NOW - n * HOUR - 60_000);
    expect(checkRateLimit(stamps, NOW)).toBeNull();
  });

  it("boundary: a submission exactly one hour old does not count", () => {
    // 4 fresh + 1 exactly hour-old = 4 in window → 5th submit allowed.
    const stamps = [1, 2, 3, 4].map((n) => NOW - n * 60_000).concat([NOW - HOUR]);
    expect(checkRateLimit(stamps, NOW)).toBeNull();
  });

  it("boundary: 5 fresh submissions block even with old ones present", () => {
    const stamps = [1, 2, 3, 4, 5].map((n) => NOW - n * 60_000).concat([NOW - HOUR]);
    expect(checkRateLimit(stamps, NOW)).toMatch(/Rate limit/);
  });

  it("allows an empty history", () => {
    expect(checkRateLimit([], NOW)).toBeNull();
  });
});
