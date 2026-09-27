// DEALWAR level tiers — Bronze → Legend.
export const LEVELS: Array<{ level: number; name: string; minXp: number }> = [
  { level: 1, name: "Bronze", minXp: 0 },
  { level: 2, name: "Silver", minXp: 150 },
  { level: 3, name: "Gold", minXp: 400 },
  { level: 4, name: "Diamond", minXp: 900 },
  { level: 5, name: "Legend", minXp: 2000 },
];

export function levelInfo(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) current = l;
  const next = LEVELS.find((l) => l.minXp > xp) ?? null;
  const span = next ? next.minXp - current.minXp : 1;
  const into = xp - current.minXp;
  return {
    level: current.level,
    name: current.name,
    nextName: next ? next.name : null,
    nextMinXp: next ? next.minXp : null,
    progress: next ? Math.min(100, Math.round((into / span) * 100)) : 100,
  };
}
