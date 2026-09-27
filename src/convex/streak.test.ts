import { describe, expect, it } from "vitest";
import { nextStreak } from "./streak";

// Fixed "server" times so tests are deterministic.
const DAY = 86400_000;
const T0 = Date.UTC(2026, 8, 20, 12, 0, 0); // Sep 20 2026, 12:00 UTC

describe("nextStreak (server-side streak rules)", () => {
  it("starts a streak at 1 for a first-ever action", () => {
    const r = nextStreak(undefined, 0, T0);
    expect(r.streak).toBe(1);
    expect(r.changed).toBe(true);
    expect(r.today).toBe("2026-09-20");
  });

  it("resets to 1 after a skipped day", () => {
    const r = nextStreak("2026-09-18", 6, T0); // last action 2 days ago
    expect(r.streak).toBe(1);
    expect(r.changed).toBe(true);
  });

  it("continues the streak when the last action was yesterday", () => {
    const r = nextStreak("2026-09-19", 6, T0);
    expect(r.streak).toBe(7);
    expect(r.changed).toBe(true);
  });

  it("is idempotent within the same day (no double counting)", () => {
    const first = nextStreak(undefined, 0, T0);
    const second = nextStreak(first.today, first.streak, T0 + 3 * 3600_000);
    expect(second.streak).toBe(1);
    expect(second.changed).toBe(false);
  });

  it("does not let a same-day action trigger the day-7 badge again", () => {
    // A user on streak 6 acts twice today: the second call must not bump to 7.
    const r = nextStreak("2026-09-20", 6, T0);
    expect(r.changed).toBe(false);
    expect(r.streak).toBe(6);
  });

  it("handles month boundaries", () => {
    // Sep 30 → Oct 1 is consecutive.
    const r = nextStreak("2026-09-30", 4, Date.UTC(2026, 9, 1, 10, 0, 0));
    expect(r.streak).toBe(5);
  });

  it("handles year boundaries", () => {
    const r = nextStreak("2026-12-31", 9, Date.UTC(2027, 0, 1, 8, 0, 0));
    expect(r.streak).toBe(10);
  });

  it("handles leap-day continuation", () => {
    const r = nextStreak("2028-02-28", 2, Date.UTC(2028, 1, 29, 9, 0, 0));
    expect(r.streak).toBe(3);
  });

  it("7 consecutive days reaches the 7-day badge threshold exactly once", () => {
    let state: { streak: number; today: string } | null = null;
    let hit7 = 0;
    for (let i = 0; i < 10; i++) {
      const now = T0 + i * DAY;
      const r = nextStreak(state?.today, state?.streak ?? 0, now);
      if (r.changed) {
        state = { streak: r.streak, today: r.today };
        if (r.streak === 7) hit7 += 1;
      }
    }
    expect(state?.streak).toBe(10);
    expect(hit7).toBe(1); // badge awarded exactly once
  });
});
