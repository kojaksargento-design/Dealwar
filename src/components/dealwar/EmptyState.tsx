import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Swords } from "lucide-react";

export function EmptyState({
  title,
  description,
  cta,
  ctaTo,
}: {
  title: string;
  description?: string;
  cta?: string;
  ctaTo?: string;
}) {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-12 text-center">
      <span
        className="glass-subtle flex size-14 items-center justify-center rounded-2xl text-2xl"
        aria-hidden="true"
      >
        ⚔️
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {cta && ctaTo && (
        <Button asChild className="mt-2 rounded-xl font-bold">
          <Link to={ctaTo}>
            <Swords className="mr-2 size-4" /> {cta}
          </Link>
        </Button>
      )}
    </div>
  );
}
