import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WarCard } from "@/components/dealwar/WarCard";
import { EmptyState } from "@/components/dealwar/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";

export default function Trending() {
  const trending = useQuery(api.wars.listTrending, { limit: 24 });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <Flame className="size-7 text-orange-500" /> Trending Wars
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wars with the most hunters right now.
        </p>
      </header>

      {trending === undefined && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      )}

      {trending !== undefined && trending.length === 0 && (
        <EmptyState
          title="Nothing trending yet."
          description="Wars appear here as hunters join. Create a war to get things started."
          cta="Create the first Price War"
          ctaTo="/create"
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {trending?.map((w) => <WarCard key={w._id} war={w} compact />)}
      </div>
    </div>
  );
}
