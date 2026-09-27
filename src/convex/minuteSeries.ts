// Pure per-minute time-series math, extracted so it can be unit-tested
// without a Convex context. Events are bucketed into fixed 60-second windows
// ending at the bucket that contains `nowMs` (the SERVER decides "now" —
// clients never pass dates in).

export type MinutePoint = { t: number; count: number }; // t = bucket start (ms)

/**
 * Build `buckets` one-minute buckets ending with the bucket containing
 * `nowMs`. `timestamps` are event times in ms; anything older than the
 * window is ignored, anything in the future is ignored.
 */
export function minuteSeries(
  timestamps: number[],
  nowMs: number,
  buckets = 60,
): MinutePoint[] {
  const lastBucketStart = Math.floor(nowMs / 60_000) * 60_000;
  const out: MinutePoint[] = [];
  for (let i = buckets - 1; i >= 0; i--) {
    const start = lastBucketStart - i * 60_000;
    const end = start + 60_000;
    let count = 0;
    for (const ts of timestamps) {
      if (ts >= start && ts < end) count++;
    }
    out.push({ t: start, count });
  }
  return out;
}

/** Sum of all bucket counts (e.g. events in the last hour). */
export function sumSeries(points: MinutePoint[]): number {
  return points.reduce((acc, p) => acc + p.count, 0);
}

/** Sum of the last N buckets (e.g. the last minute = last 1 bucket). */
export function sumLast(points: MinutePoint[], n: number): number {
  return sumSeries(points.slice(-n));
}
