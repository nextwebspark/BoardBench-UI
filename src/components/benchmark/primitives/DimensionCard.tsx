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
  const isMarket = value == null;
  const displayValue = value ?? dist.p50;

  const pct = !isMarket ? calcPercentile(value, dist) : null;
  const diff = !isMarket && value != null ? Math.round((value - dist.p50) * 10) / 10 : null;
  const diffClass =
    pct?.band === "above"
      ? "text-emerald-600 dark:text-emerald-400"
      : pct?.band === "below"
      ? "text-rose-600 dark:text-rose-400"
      : "text-sky-600 dark:text-sky-400";

  const maxScale = Math.max(dist.p90 * 1.1, 1);
  const barW = !isMarket && value != null ? Math.min(100, Math.max(2, (value / maxScale) * 100)) : 0;
  const p50W = Math.min(100, Math.max(2, (dist.p50 / maxScale) * 100));

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </span>
          {isMarket ? (
            <span className="text-[10px] font-medium text-muted-foreground rounded-full border border-border px-2 py-0.5">
              market
            </span>
          ) : (
            <PercentileBadge pct={pct} />
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold tabular-nums">
            {displayValue != null ? `${displayValue}${unit}` : "—"}
          </span>
          {isMarket && displayValue != null && (
            <span className="text-[11px] font-normal text-muted-foreground">median</span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">{note}</div>
        <div className="pt-2">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{isMarket ? "Peer median" : "You"}</span>
            {!isMarket && <span>Peers P50: {dist.p50}{unit}</span>}
          </div>
          <div className="relative h-2 bg-muted rounded border">
            {!isMarket && (
              <div
                className="absolute left-0 top-0 h-full bg-primary/70 rounded"
                style={{ width: `${barW}%` }}
              />
            )}
            <div
              className={cn(
                "absolute -top-0.5 h-3 w-0.5 rounded",
                isMarket ? "bg-primary/70" : "bg-foreground/70"
              )}
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
