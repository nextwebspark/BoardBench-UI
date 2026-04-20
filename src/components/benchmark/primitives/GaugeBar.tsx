import { calcPercentile } from "@/lib/benchmark/percentiles";
import type { Distribution } from "@/lib/benchmark/types";
import { PercentileBadge } from "./PercentileBadge";

interface GaugeBarProps {
  label: string;
  value: number | null;
  distribution: Distribution;
  unit?: string;
}

export function GaugeBar({ label, value, distribution, unit = "" }: GaugeBarProps) {
  const minV = distribution.p10;
  const maxV = distribution.p90;
  const scale = Math.max(maxV * 1.2, minV + 1);

  function pct(v: number) {
    return Math.min(98, Math.max(1, (v / scale) * 100));
  }

  const valueMissing = value == null || !Number.isFinite(value);
  const percentile = calcPercentile(value, distribution);

  if (valueMissing) {
    return (
      <div className="flex flex-col gap-1 py-2 border-b last:border-b-0 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
        <div className="sm:w-40 sm:shrink-0 text-foreground font-medium text-xs">{label}</div>
        <div className="flex items-center justify-between sm:flex-1 sm:justify-start gap-2">
          <span className="italic">No data</span>
          <PercentileBadge pct={null} />
        </div>
      </div>
    );
  }

  const youPct = pct(value);
  const p25Pct = pct(distribution.p25);
  const p75Pct = pct(distribution.p75);
  const p50Pct = pct(distribution.p50);
  const p10Pct = pct(distribution.p10);
  const p90Pct = pct(distribution.p90);
  const delta = Math.round((value - distribution.p50) * 10) / 10;
  const deltaStr = (delta >= 0 ? "+" : "") + delta + unit;

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b last:border-b-0 sm:flex-row sm:items-center sm:gap-3">
      <div className="sm:w-40 sm:shrink-0 text-xs font-medium text-foreground/80 leading-tight">
        {label}
      </div>
      <div className="flex-1 relative pt-6 pb-1 sm:pb-5">
        <div
          className="absolute top-0 text-[10px] font-bold whitespace-nowrap rounded px-1 py-px bg-primary/10 text-primary border border-primary/20"
          style={{ left: `${youPct}%`, transform: "translateX(-50%)" }}
        >
          {deltaStr}
        </div>
        <div className="relative h-2 bg-muted rounded border">
          <div
            className="absolute top-0 h-full bg-primary/25 rounded-sm"
            style={{ left: `${p25Pct}%`, width: `${p75Pct - p25Pct}%` }}
          />
          <div
            className="absolute -top-1.5 w-px h-5 bg-muted-foreground/40"
            style={{ left: `${p10Pct}%` }}
          />
          <div
            className="absolute -top-2 w-0.5 h-6 bg-muted-foreground/70 rounded"
            style={{ left: `${p50Pct}%` }}
          />
          <div
            className="absolute -top-1.5 w-px h-5 bg-muted-foreground/40"
            style={{ left: `${p90Pct}%` }}
          />
          <div
            className="absolute top-1/2 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background shadow-[0_0_0_2px_var(--primary)] z-10"
            style={{ left: `${youPct}%`, transform: "translate(-50%, -50%)" }}
          />
        </div>
        <div className="hidden sm:block absolute bottom-0 left-0 right-0 text-[9px] text-muted-foreground">
          <span className="absolute" style={{ left: `${p10Pct}%`, transform: "translateX(-50%)" }}>
            P10
          </span>
          <span
            className="absolute whitespace-nowrap"
            style={{ left: `${p50Pct}%`, transform: "translateX(-50%)" }}
          >
            Median {distribution.p50}
            {unit}
          </span>
          <span className="absolute" style={{ left: `${p90Pct}%`, transform: "translateX(-50%)" }}>
            P90
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end sm:w-28 sm:shrink-0 gap-1.5">
        <span className="text-sm font-semibold tabular-nums">
          {value}
          {unit}
        </span>
        <PercentileBadge pct={percentile} />
      </div>
    </div>
  );
}
