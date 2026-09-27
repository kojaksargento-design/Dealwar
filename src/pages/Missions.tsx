import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { StreakDays } from "@/components/dealwar/XpBar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, CheckCircle2, Zap } from "lucide-react";
import { Link } from "react-router";

export default function Missions() {
  const { isAuthenticated } = useAuth();
  const myMissions = useQuery(
    api.missions.getMyMissions,
    isAuthenticated ? {} : "skip",
  );
  const myProfile = useQuery(
    api.gamification.getMyProfile,
    isAuthenticated ? {} : "skip",
  );

  if (!isAuthenticated) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <Flame className="mx-auto size-10 text-orange-500" />
        <h1 className="mt-3 text-xl font-black tracking-tight">Daily missions</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Sign in to complete daily missions and earn bonus XP every day.
        </p>
        <Button className="mt-6 rounded-xl font-black" asChild>
          <Link to="/auth?returnTo=%2Fmissions">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <Flame className="size-7 text-orange-500" /> Daily Missions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fresh missions every day. Each one grants virtual XP.
        </p>
      </header>

      {myProfile && (
        <div className="glass rounded-3xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Your streak
          </p>
          <div className="mt-3">
            <StreakDays count={myProfile.streakCount} />
          </div>
        </div>
      )}

      {myMissions === undefined && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
      )}

      {myMissions && (
        <div className="flex flex-col gap-3">
          {myMissions.map((m) => {
            const progressPct = Math.min(100, (m.progress / m.target) * 100);
            return (
              <article
                key={m.key}
                className="glass flex items-center gap-4 rounded-3xl p-5"
              >
                <span className="glass-subtle flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl" aria-hidden>
                  {m.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold">{m.name}</h2>
                    {m.completed && (
                      <CheckCircle2 className="size-4 text-emerald-500" aria-label="Completed" />
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{m.description}</p>
                  <Progress value={progressPct} className="mt-2 h-2" aria-label={`${m.name} progress`} />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge
                    className={
                      m.completed
                        ? "rounded-full bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15"
                        : "rounded-full bg-primary/10 text-primary hover:bg-primary/10"
                    }
                  >
                    <Zap className="mr-1 size-3" /> +{m.xpReward} XP
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {Math.min(m.progress, m.target)}/{m.target}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        XP is virtual and has no monetary value.
      </p>
    </div>
  );
}
