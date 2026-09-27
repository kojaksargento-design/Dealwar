import { describe, expect, it } from "vitest";
import { LEVELS, levelInfo } from "./levels";

describe("levelInfo", () => {
  it("starts at Bronze level 1 with 0 XP", () => {
    const info = levelInfo(0);
    expect(info.level).toBe(1);
    expect(info.name).toBe("Bronze");
  });

  it("crosses each tier threshold exactly at its minXp", () => {
    expect(levelInfo(149).level).toBe(1);
    expect(levelInfo(150).level).toBe(2);
    expect(levelInfo(150).name).toBe("Silver");
    expect(levelInfo(399).level).toBe(2);
    expect(levelInfo(400).level).toBe(3);
    expect(levelInfo(899).level).toBe(3);
    expect(levelInfo(900).level).toBe(4);
    expect(levelInfo(1999).level).toBe(4);
    expect(levelInfo(2000).level).toBe(5);
  });

  it("Legend is the max level with no next level", () => atMaxLevel());

  function atMaxLevel() {
    const info = levelInfo(50000);
    expect(info.level).toBe(5);
    expect(info.name).toBe("Legend");
    expect(info.nextName).toBeNull();
    expect(info.nextMinXp).toBeNull();
  }

  it("progress is 100% at max level", () => {
    expect(levelInfo(2000).progress).toBe(100);
  });

  it("progress sits between 0 and 100 within a tier", () => {
    const silverStart = levelInfo(150);
    expect(silverStart.progress).toBe(0);
    const midGold = levelInfo(650); // 250 into a 500 XP span
    expect(midGold.progress).toBe(50);
  });

  it("clamps progress to 100 and never exceeds it", () => {
    const info = levelInfo(2000);
    expect(info.progress).toBeLessThanOrEqual(100);
  });

  it("reports remaining XP to the next tier", () => {
    expect(levelInfo(0).nextMinXp).toBe(150);
    expect(levelInfo(100).nextMinXp).toBe(150);
    expect(levelInfo(1000).nextName).toBe("Legend");
  });

  it("handles negative XP defensively without crashing", () => {
    const info = levelInfo(-10);
    expect(info.level).toBe(1);
    expect(info.name).toBe("Bronze");
  });

  it("level tiers are ordered and non-overlapping", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXp).toBeGreaterThan(LEVELS[i - 1].minXp);
      expect(LEVELS[i].level).toBe(LEVELS[i - 1].level + 1);
    }
  });
});
