import { cn } from "@/lib/utils";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.45_0.2_265)] text-white shadow-md shadow-primary/25",
          compact ? "size-8" : "size-9",
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4l7 7" />
          <path d="M20 4l-7 7" />
          <path d="M4 4l2 1 1 2" />
          <path d="M20 4l-2 1-1 2" />
          <path d="M11 11l-4 9" />
          <path d="M13 11l4 9" />
          <path d="M9 17h2" />
          <path d="M13 17h2" />
        </svg>
      </span>
      <span
        className={cn(
          "font-black tracking-tight text-foreground",
          compact ? "text-base" : "text-lg",
        )}
      >
        DEAL<span className="text-primary">WAR</span>
      </span>
    </span>
  );
}
