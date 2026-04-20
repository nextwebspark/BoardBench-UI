import { cn } from "@/lib/utils";
import type { CompanyMetrics } from "@/lib/benchmark/types";

interface GapToMedianBarsProps {
  rows: CompanyMetrics[];
  focusId: number;
  filteredPeerIds: Set<number>;
  valueKey: keyof Pick<
    CompanyMetrics,
    "boardSize" | "indPct" | "womenPct" | "localPct" | "avgAge" | "meetings"
  >;
  median: number;
  unit?: string;
}

export function GapToMedianBars({
  rows,
  focusId,
  filteredPeerIds,
  valueKey,
  median,
  unit = "",
}: GapToMedianBarsProps) {
  const sorted = [...rows]
    .filter((r) => r[valueKey] != null)
    .sort((a, b) => (b[valueKey] as number) - (a[valueKey] as number));

  const maxGap = Math.max(
    3,
    sorted.reduce((m, r) => Math.max(m, Math.abs((r[valueKey] as number) - median)), 0)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-40 shrink-0" />
        <div className="flex-1 flex justify-between text-[10px] text-muted-foreground">
          <span>← below median</span>
          <span className="font-medium text-foreground/70">
            median = {median}
            {unit}
          </span>
          <span>above median →</span>
        </div>
        <div className="w-16 shrink-0" />
      </div>
      {sorted.map((r) => {
        const isYou = r.companyId === focusId;
        const val = r[valueKey] as number;
        const gap = val - median;
        const inPool = filteredPeerIds.has(r.companyId) || isYou;
        const barPct = (Math.abs(gap) / maxGap) * 46;
        const dimmed = !inPool ? "opacity-40" : "";
        return (
          <div key={r.companyId} className={cn("flex items-center gap-2.5", dimmed)}>
            <div
              className={cn(
                "w-40 shrink-0 text-xs truncate",
                isYou ? "font-bold text-primary" : "text-foreground/80"
              )}
            >
              {r.name}
              {isYou && (
                <span className="ml-1.5 rounded-sm bg-primary px-1 py-0.5 text-[9px] font-semibold text-primary-foreground align-middle">
                  You
                </span>
              )}
            </div>
            <div className="flex-1 h-6 relative bg-muted rounded border">
              {gap === 0 ? (
                <div className="absolute left-1/2 top-0.5 h-[calc(100%-4px)] w-px bg-muted-foreground/40 -translate-x-1/2" />
              ) : gap > 0 ? (
                <div
                  className={cn(
                    "absolute left-1/2 top-0 h-full rounded-r",
                    isYou ? "bg-primary/25 border-2 border-primary" : "bg-sky-500/15 border border-sky-500/40"
                  )}
                  style={{ width: `${barPct}%` }}
                />
              ) : (
                <div
                  className={cn(
                    "absolute right-1/2 top-0 h-full rounded-l",
                    isYou ? "bg-primary/25 border-2 border-primary" : "bg-rose-500/10 border border-rose-500/40"
                  )}
                  style={{ width: `${barPct}%` }}
                />
              )}
              <div className="absolute left-1/2 top-0 h-full w-px bg-muted-foreground/50 z-10" />
            </div>
            <div className="w-8 text-center text-xs font-semibold tabular-nums shrink-0">
              {val}
              {unit}
            </div>
            <div className="w-16 text-right shrink-0">
              {gap === 0 ? (
                <span className="text-xs text-muted-foreground">= median</span>
              ) : gap > 0 ? (
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">+{gap}</span>
              ) : (
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{gap}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
