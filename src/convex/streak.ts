// Pure daily-streak math, extracted from engine.ts so it can be unit-tested
// without a Convex context. The SERVER decides "today" — clients never pass
// dates in, which is what blocks the date-manipulation cheat from the spec.

/**
 * Compute the next streak state.
 * @param lastActiveDate "yyyy-mm-dd" (UTC) of the last valid action, if any
 * @param currentStreak the stored streak count
 * @param nowMs current server time (injectable for tests)
 */
export function nextStreak(
  lastActiveDate: string | undefined,
  currentStreak: number,
  nowMs: number,
): { streak: number; today: string; changed: boolean } {
  const today = new Date(nowMs).toISOString().slice(0, 10);
  if (lastActiveDate === today) {
    return { streak: currentStreak, today, changed: false };
  }
  const yesterday = new Date(nowMs - 86400_000).toISOString().slice(0, 10);
  const streak = lastActiveDate === yesterday ? currentStreak + 1 : 1;
  return { streak, today, changed: true };
}
