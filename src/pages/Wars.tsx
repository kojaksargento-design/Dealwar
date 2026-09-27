import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { WarCard } from "@/components/dealwar/WarCard";
import { EmptyState } from "@/components/dealwar/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router";
import { Search } from "lucide-react";

export default function Wars() {
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const openWars = useQuery(api.wars.listOpen, { limit: 60 });

  const filtered = openWars?.filter((w) =>
    q.trim().length >= 2
      ? w.title.toLowerCase().includes(q.trim().toLowerCase()) ||
        w.productName.toLowerCase().includes(q.trim().toLowerCase())
      : true,
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Explore Wars</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every open Price War. Find one you can beat.
        </p>
      </header>

      <form
        className="glass flex items-center gap-2 rounded-2xl p-2"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <Search className="ml-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search wars by product or title..."
          aria-label="Search wars"
          className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </form>

      {openWars === undefined && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      )}

      {openWars !== undefined && filtered?.length === 0 && (
        <EmptyState
          title={q ? "No wars match your search." : "No wars yet."}
          description={
            q
              ? "Try a different product name."
              : "Create the first Price War and start the battle."
          }
          cta={q ? undefined : "Create the first Price War"}
          ctaTo={q ? undefined : "/create"}
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((w) => <WarCard key={w._id} war={w} compact />)}
      </div>
    </div>
  );
}
