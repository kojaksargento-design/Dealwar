import { describe, expect, it } from "vitest";
import { minuteSeries, sumSeries, sumLast } from "./minuteSeries";

const MIN = 60_000;

describe("minuteSeries", () => {
  it("returns exactly `buckets` points aligned to minute boundaries", () => {
    const now = 1_700_000_061_234; // mid-minute
    const points = minuteSeries([], now, 60);
    expect(points).toHaveLength(60);
    const last = points[points.length - 1];
    expect(last.t).toBe(Math.floor(now / MIN) * MIN);
    // consecutive buckets are 60s apart
    for (let i = 1; i < points.length; i++) {
      expect(points[i].t - points[i - 1].t).toBe(MIN);
    }
  });

  it("counts events into the correct minute bucket", () => {
    const now = 1_700_000_030_000;
    const bucketStart = Math.floor(now / MIN) * MIN;
    const points = minuteSeries(
      [bucketStart, bucketStart + 1000, bucketStart + 59_999],
      now,
      5,
    );
    expect(points[points.length - 1].count).toBe(3);
  });

  it("ignores future events and events older than the window", () => {
    const now = 1_700_000_030_000;
    // 5-minute window: an event 10 min in the past is outside it
    const points = minuteSeries(
      [now + 10 * MIN, now - 10 * MIN],
      now,
      5,
    );
    expect(sumSeries(points)).toBe(0);
  });

  it("splits events across minute boundaries", () => {
    const now = 1_700_000_030_000;
    const bucketStart = Math.floor(now / MIN) * MIN;
    const points = minuteSeries([bucketStart - 1, bucketStart], now, 2);
    expect(points[0].count).toBe(1); // previous minute
    expect(points[1].count).toBe(1); // current minute
  });

  it("sumSeries sums all buckets", () => {
    const now = 1_700_000_030_000;
    const points = minuteSeries(
      Array.from({ length: 7 }, (_, i) => now - i * 5_000),
      now,
      60,
    );
    expect(sumSeries(points)).toBe(7);
  });

  it("sumLast(n) only counts the trailing n buckets", () => {
    const now = 1_700_000_030_000;
    const points = minuteSeries([now - 90_000, now - 5_000], now, 60);
    expect(sumLast(points, 1)).toBe(1); // only the 5s-old event is in the current minute
    expect(sumLast(points, 60)).toBe(2);
  });
});
