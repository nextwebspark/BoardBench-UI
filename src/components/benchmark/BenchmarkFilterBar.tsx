"use client";

import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterState } from "@/lib/benchmark/types";

interface BenchmarkFilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  focusCountry: string | null;
  focusIndustry: string | null;
  poolCount: number;
  fallback: boolean;
  year: number;
  onEditPeers: () => void;
  peerPanelOpen: boolean;
}

export function BenchmarkFilterBar({
  poolCount,
  fallback,
  year,
  onEditPeers,
  peerPanelOpen,
}: BenchmarkFilterBarProps) {
  return (
    <div className="flex items-center gap-2 border-b bg-card px-6 py-2 text-xs overflow-x-auto">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Benchmark
      </span>
      <StaticChip label={String(year)} />
      <button
        type="button"
        onClick={onEditPeers}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
          peerPanelOpen
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-muted text-foreground hover:bg-accent hover:border-primary/40"
        )}
      >
        <Users className="h-3 w-3" />
        {peerPanelOpen ? "Close peers" : "Edit peers"}
      </button>
      <div className="ml-auto shrink-0 text-[11px] font-medium">
        {fallback ? (
          <span className="text-amber-600 dark:text-amber-400">
            ⚠ {poolCount} peers match — using full-universe benchmark
          </span>
        ) : poolCount === 0 ? (
          <span className="text-rose-600 dark:text-rose-400">
            ⚠ No peers match — remove a filter
          </span>
        ) : (
          <span className="text-primary">
            {poolCount} peer{poolCount === 1 ? "" : "s"} in benchmark
          </span>
        )}
      </div>
    </div>
  );
}

function StaticChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
  );
}
