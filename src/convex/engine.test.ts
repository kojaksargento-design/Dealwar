import { describe, expect, it } from "vitest";
import { XP, BADGE_KEYS } from "./engine";
import { LEVELS } from "./levels";

describe("XP awards match the DEALWAR spec", () => {
  it("awards exactly the specified amounts", () => {
    expect(XP.CREATE_WAR).toBe(10);
    expect(XP.JOIN_WAR).toBe(5);
    expect(XP.VERIFIED_DISCOVERY).toBe(50);
    expect(XP.BEAT_BEST_PRICE).toBe(100);
    expect(XP.SHARE_VICTORY).toBe(2);
  });

  it("mission rewards are positive", () => {
    for (const value of Object.values(XP.MISSIONS)) {
      expect(value).toBeGreaterThan(0);
    }
  });

  it("all 10 spec badges are declared", () => {
    expect(BADGE_KEYS).toHaveLength(10);
    expect(BADGE_KEYS).toContain("first_war");
    expect(BADGE_KEYS).toContain("deal_master");
    expect(BADGE_KEYS).toContain("early_hunter");
  });

  it("Legend (2000 XP) is reachable via beat-price wins", () => {
    // 20 best-price wins (100 XP each) should reach Legend
    expect(20 * XP.BEAT_BEST_PRICE).toBeGreaterThanOrEqual(
      LEVELS[LEVELS.length - 1].minXp,
    );
  });
});
