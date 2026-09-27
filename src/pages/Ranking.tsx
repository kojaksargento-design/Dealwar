import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

type Scope = "global" | "country" | "weekly" | "monthly";

const COUNTRY_LABELS: Record<string, string> = {
  PT: "Portugal",
  ES: "Spain",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  UK: "United Kingdom",
  US: "USA",
};

export default function Ranking() {
  const [scope, setScope] = useState<Scope>("global");
  const [country, setCountry] = useState<string>("PT");

  const ranking = useQuery(
    api.ranking.ranking,
    scope === "country"
      ? { scope, country, limit: 50 }
      : { scope, limit: 50 },
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <Trophy className="size-7 text-amber-500" /> Global Ranking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The best deal hunters, ranked by real activity only.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <TabsList className="glass justify-start overflow-x-auto rounded-2xl">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="country">Country</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        {scope === "country" && (
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-44 rounded-2xl" aria-label="Choose country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                <SelectItem key={code} value={code}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="glass overflow-hidden rounded-3xl">
        <div className="grid grid-cols-[3rem_1fr_auto] gap-3 border-b border-white/50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground sm:grid-cols-[3rem_1fr_6rem_6rem_6rem]">
          <span>#</span>
          <span>Hunter</span>
          <span className="hidden text-right sm:block">Country</span>
          <span className="hidden text-right sm:block">Wins</span>
          <span className="text-right">XP</span>
        </div>

        {ranking === undefined && (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        )}

        {ranking?.rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No hunters ranked yet in this scope. Take actions to appear here.
          </p>
        )}

        {ranking?.rows.map((r) => (
          <div
            key={r.profileId}
            className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-white/40 px-5 py-3 last:border-0 sm:grid-cols-[3rem_1fr_6rem_6rem_6rem]"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-xl text-sm font-black",
                r.rank === 1 && "bg-amber-400/90 text-amber-950",
                r.rank === 2 && "bg-slate-300/90 text-slate-700",
                r.rank === 3 && "bg-amber-600/80 text-white",
                r.rank > 3 && "bg-primary/10 text-primary",
              )}
            >
              {r.rank === 1 ? <Crown className="size-4" /> : r.rank}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-lg" aria-hidden>{r.avatarEmoji}</span>
              <span className="truncate font-bold">{r.username}</span>
              {r.isDemo && (
                <span className="rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                  DEMO
                </span>
              )}
              {r.rank <= 3 && <Medal className="size-3.5 shrink-0 text-amber-500" />}
            </span>
            <span className="hidden text-right text-xs font-semibold text-muted-foreground sm:block">
              {r.country
                ? (COUNTRY_LABELS[r.country] ?? r.country)
                : "—"}
            </span>
            <span className="hidden text-right text-sm font-semibold sm:block">
              {r.wins}
            </span>
            <span className="text-right font-black text-primary">{r.xp}</span>
          </div>
        ))}
      </div>

      {ranking?.myRank && (
        <p className="text-center text-sm text-muted-foreground">
          Your position: <span className="font-black text-foreground">#{ranking.myRank}</span>
        </p>
      )}
    </div>
  );
}
