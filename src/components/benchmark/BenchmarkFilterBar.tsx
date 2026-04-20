"use client";

import { cn } from "@/lib/utils";
import type { FilterState } from "@/lib/benchmark/types";

interface BenchmarkFilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  focusCountry: string | null;
  focusIndustry: string | null;
  capRange: { min: number; max: number } | null;
  empRange: { min: number; max: number } | null;
  poolCount: number;
  fallback: boolean;
  year: number;
}

function fmtCap(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}T`;
  return `${Math.round(v)}B`;
}

function fmtEmp(v: number) {
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return `${v}`;
}

export function BenchmarkFilterBar({
  filters,
  onChange,
  focusCountry,
  focusIndustry,
  capRange,
  empRange,
  poolCount,
  fallback,
  year,
}: BenchmarkFilterBarProps) {
  function toggle<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex items-center gap-2 border-b bg-card px-6 py-2 text-xs overflow-x-auto">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Benchmark
      </span>
      <StaticChip label={String(year)} />
      {focusCountry && (
        <ToggleChip
          label={focusCountry}
          on={filters.country}
          onClick={() => toggle("country", !filters.country)}
        />
      )}
      {focusIndustry && (
        <ToggleChip
          label={focusIndustry}
          on={filters.industry}
          onClick={() => toggle("industry", !filters.industry)}
        />
      )}
      {capRange && (
        <ToggleChip
          label={`Mkt cap: ${fmtCap(capRange.min)}–${fmtCap(capRange.max)}`}
          on={filters.capMin !== null}
          onClick={() =>
            onChange({
              ...filters,
              capMin: filters.capMin === null ? capRange.min : null,
              capMax: filters.capMin === null ? capRange.max : null,
            })
          }
        />
      )}
      {empRange && (
        <ToggleChip
          label={`Employees: ${fmtEmp(empRange.min)}–${fmtEmp(empRange.max)}`}
          on={filters.empMin !== null}
          onClick={() =>
            onChange({
              ...filters,
              empMin: filters.empMin === null ? empRange.min : null,
              empMax: filters.empMin === null ? empRange.max : null,
            })
          }
        />
      )}
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

function ToggleChip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
        on
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}
