"use client";

import { Card, CardContent } from "@/components/ui/card";
import { calcPercentile } from "@/lib/benchmark/percentiles";
import type { Distribution } from "@/lib/benchmark/types";
import { PercentileBadge } from "./PercentileBadge";
import { cn } from "@/lib/utils";

export function DimensionCard({
  label,
  value,
  unit = "",
  dist,
  note,
}: {
  label: string;
  value: number | null;
  unit?: string;
  dist: Distribution;
  note: string;
}) {
  const pct = calcPercentile(value, dist);
  const diff = value != null ? Math.round((value - dist.p50) * 10) / 10 : null;
  const diffClass =
    pct?.band === "above"
      ? "text-emerald-600 dark:text-emerald-400"
      : pct?.band === "below"
      ? "text-rose-600 dark:text-rose-400"
      : "text-sky-600 dark:text-sky-400";

  const maxScale = Math.max(dist.p90 * 1.1, 1);
  const barW = value != null ? Math.min(100, Math.max(2, (value / maxScale) * 100)) : 0;
  const p50W = Math.min(100, Math.max(2, (dist.p50 / maxScale) * 100));

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </span>
          <PercentileBadge pct={pct} />
        </div>
        <div className="text-xl sm:text-2xl font-bold tabular-nums">
          {value != null ? `${value}${unit}` : "—"}
        </div>
        <div className="text-[11px] text-muted-foreground">{note}</div>
        <div className="pt-2">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>You</span>
            <span>Peers P50: {dist.p50}{unit}</span>
          </div>
          <div className="relative h-2 bg-muted rounded border">
            <div
              className="absolute left-0 top-0 h-full bg-primary/70 rounded"
              style={{ width: `${barW}%` }}
            />
            <div
              className="absolute -top-0.5 h-3 w-0.5 bg-foreground/70 rounded"
              style={{ left: `${p50W}%` }}
            />
          </div>
          {diff != null && (
            <div className={cn("text-[11px] font-semibold mt-1", diffClass)}>
              {diff >= 0 ? "+" : ""}{diff}{unit} vs median
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
