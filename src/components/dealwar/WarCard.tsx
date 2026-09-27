import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { eur, pct, timeLeft } from "@/lib/format";
import { Users, Clock, TrendingDown } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

export type WarCardData = {
  _id: string;
  slug: string;
  title: string;
  productName: string;
  productEmoji?: string;
  categoryLabel?: string;
  categoryEmoji?: string;
  originalPrice: number;
  bestPrice: number;
  currency: string;
  participants: number;
  endTime: number;
  status: string;
  sponsored?: boolean;
  featured?: boolean;
  demo?: boolean;
  creatorUsername?: string;
};

export function WarCard({ war, compact = false }: { war: WarCardData; compact?: boolean }) {
  const navigate = useNavigate();
  const saved = Math.max(0, war.originalPrice - war.bestPrice);
  const hasDeal = saved > 0;
  const ended = war.status !== "open";

  return (
    <article
      className={cn(
        "glass glass-hover group relative flex flex-col gap-3 rounded-3xl p-5",
        war.demo && "border-dashed",
      )}
    >
      {/* top row: badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {war.sponsored && (
          <Badge className="rounded-full bg-amber-400/90 text-amber-950 hover:bg-amber-400/90">
            SPONSORED
          </Badge>
        )}
        {war.demo && (
          <Badge variant="outline" className="rounded-full border-dashed text-muted-foreground">
            DEMO
          </Badge>
        )}
        {war.featured && !war.sponsored && (
          <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/15">
            ⚡ FEATURED
          </Badge>
        )}
        {ended && (
          <Badge variant="secondary" className="rounded-full">
            ENDED
          </Badge>
        )}
        <Badge variant="secondary" className="ml-auto rounded-full font-semibold">
          {war.categoryEmoji} {war.categoryLabel}
        </Badge>
      </div>

      <div className="flex items-start gap-3">
        <div
          className="glass-subtle flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
          aria-hidden="true"
        >
          {war.productEmoji ?? "📦"}
        </div>
        <div className="min-w-0">
          <Link
            to={`/war/${war.slug}`}
            className="line-clamp-2 font-bold leading-snug hover:text-primary"
          >
            {war.title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            by @{war.creatorUsername ?? "anonymous"}
          </p>
        </div>
      </div>

      {/* price block */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Original</p>
          <p
            className={cn(
              "text-sm font-semibold",
              hasDeal && "text-muted-foreground line-through",
            )}
          >
            {eur(war.originalPrice)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Best verified</p>
          <p className="text-xl font-black tracking-tight text-primary">
            {eur(war.bestPrice)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Saved</p>
          <p
            className={cn(
              "flex items-center justify-end gap-0.5 text-sm font-bold",
              hasDeal ? "text-emerald-600" : "text-muted-foreground",
            )}
          >
            {hasDeal && <TrendingDown className="size-3.5" />}
            {hasDeal ? `${eur(saved)} (${pct(war.originalPrice, war.bestPrice)})` : "—"}
          </p>
        </div>
      </div>

      {/* progress: how far the price has fallen */}
      <Progress
        value={war.originalPrice > 0 ? (saved / war.originalPrice) * 100 : 0}
        className="h-1.5"
        aria-label={`Price drop progress ${pct(war.originalPrice, war.bestPrice)}`}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="size-3.5" /> {war.participants}{" "}
          {war.participants === 1 ? "hunter" : "hunters"}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {ended ? "Ended" : timeLeft(war.endTime)}
        </span>
      </div>

      {!compact && (
        <Button
          className="w-full rounded-xl font-bold tracking-wide"
          disabled={ended}
          onClick={() => navigate(`/war/${war.slug}`)}
        >
          {ended ? "WAR ENDED" : "JOIN WAR"}
        </Button>
      )}
    </article>
  );
}
