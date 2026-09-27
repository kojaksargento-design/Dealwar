import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowDown, Crown } from "lucide-react";

export type PriceHistoryEntry = {
  _id: string;
  price: number;
  label?: string;
  createdAt: number;
};

export function PriceHistory({ entries }: { entries: PriceHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="glass-subtle rounded-2xl p-4 text-sm text-muted-foreground">
        No price history yet. The starting price is the price to beat.
      </p>
    );
  }

  const best = Math.min(...entries.map((e) => e.price));

  return (
    <ol className="flex flex-col gap-0" aria-label="Price history">
      {entries.map((e, i) => {
        const isBest = e.price === best;
        const prev = entries[i - 1];
        return (
          <li key={e._id} className="flex gap-3">
            {/* timeline column */}
            <div className="flex flex-col items-center">
              {i > 0 && <ArrowDown className="size-4 text-muted-foreground/60" />}
              {i === 0 && <span className="size-2 rounded-full bg-muted-foreground/40" />}
            </div>
            <div
              className={cn(
                "mb-2 flex flex-1 items-center justify-between gap-3 rounded-2xl px-4 py-2.5",
                isBest ? "glass-strong border-emerald-300/60" : "glass-subtle",
              )}
            >
              <div>
                <p
                  className={cn(
                    "text-lg font-black tracking-tight",
                    isBest ? "text-emerald-600" : "text-foreground",
                  )}
                >
                  {eur(e.price)}
                </p>
                {e.label && (
                  <p className="text-xs text-muted-foreground">{e.label}</p>
                )}
              </div>
              {isBest && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <Crown className="size-3" /> Best price
                </span>
              )}
              {!isBest && prev && prev.price > e.price && (
                <span className="text-xs font-semibold text-emerald-600/80">
                  -{eur(prev.price - e.price)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
