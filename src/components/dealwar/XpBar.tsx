import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type LevelInfo = {
  level: number;
  name: string;
  nextName: string | null;
  nextMinXp: number | null;
  progress: number;
};

const LEVEL_COLORS: Record<number, string> = {
  1: "from-amber-600 to-amber-800", // Bronze
  2: "from-slate-400 to-slate-600", // Silver
  3: "from-yellow-400 to-amber-500", // Gold
  4: "from-sky-300 to-blue-500", // Diamond
  5: "from-fuchsia-500 to-purple-700", // Legend
};

export function XpBar({
  levelInfo,
  xp,
  size = "md",
}: {
  levelInfo: LevelInfo;
  xp: number;
  size?: "sm" | "md";
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "bg-gradient-to-r bg-clip-text font-black uppercase tracking-wider text-transparent",
            LEVEL_COLORS[levelInfo.level] ?? "from-primary to-primary",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          ⚔️ LEVEL {levelInfo.level} · {levelInfo.name}
        </span>
        <span className={cn("font-semibold text-muted-foreground", size === "sm" ? "text-[10px]" : "text-xs")}>
          {xp} XP
        </span>
      </div>
      <Progress value={levelInfo.progress} className={cn("mt-1.5", size === "sm" ? "h-1.5" : "h-2.5")} aria-label={`Level progress ${levelInfo.progress}%`} />
      <p className={cn("mt-1 text-muted-foreground", size === "sm" ? "text-[10px]" : "text-xs")}>
        {levelInfo.nextName
          ? `${levelInfo.nextMinXp! - xp} XP to ${levelInfo.nextName}`
          : "Max level — Legend status"}
      </p>
    </div>
  );
}

export function StreakDays({ count }: { count: number }) {
  if (count <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No streak yet — take an action today to start DAY 1.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label={`${count} day streak`}>
      {Array.from({ length: Math.min(count, 10) }).map((_, i) => (
        <span
          key={i}
          className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400/90 to-red-500/90 text-[10px] font-black text-white shadow-sm"
          title={`DAY ${i + 1}`}
        >
          {i + 1}
        </span>
      ))}
      {count > 10 && (
        <span className="text-xs font-bold text-muted-foreground">
          +{count - 10} more 🔥
        </span>
      )}
      <span className="ml-1 text-sm font-bold">
        DAY {count} <span aria-hidden>🔥</span>
      </span>
    </div>
  );
}
