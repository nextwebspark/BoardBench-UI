import { cn } from "@/lib/utils";
import type { Percentile } from "@/lib/benchmark/percentiles";

export function PercentileBadge({
  pct,
  className,
}: {
  pct: Percentile | null;
  className?: string;
}) {
  if (!pct) {
    return (
      <span className={cn("inline-flex h-5 items-center rounded-md bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground", className)}>
        N/A
      </span>
    );
  }
  const tone =
    pct.band === "above"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : pct.band === "below"
      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
      : "bg-sky-500/15 text-sky-700 dark:text-sky-300";
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-bold tabular-nums",
        tone,
        className
      )}
    >
      P{pct.n}
    </span>
  );
}
