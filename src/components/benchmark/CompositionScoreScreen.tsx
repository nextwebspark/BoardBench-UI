"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcPercentile, type Percentile } from "@/lib/benchmark/percentiles";
import type { BenchmarkPool, CompanyMetrics, MetricKey } from "@/lib/benchmark/types";
import { PageHeader } from "./PageHeader";
import { InsightList, type Insight } from "./primitives/InsightList";
import { cn } from "@/lib/utils";

interface DimensionDef {
  key: MetricKey;
  label: string;
  weight: number;
  unit?: string;
}

const DIMENSIONS: DimensionDef[] = [
  { key: "indPct", label: "Independence", weight: 0.3, unit: "%" },
  { key: "womenPct", label: "Gender diversity", weight: 0.2, unit: "%" },
  { key: "boardSize", label: "Board size fit", weight: 0.15 },
  { key: "localPct", label: "Nationality mix", weight: 0.15, unit: "%" },
  { key: "avgAge", label: "Age balance", weight: 0.1 },
  { key: "meetings", label: "Meeting cadence", weight: 0.1 },
];

function computeCompositeForCompany(
  row: CompanyMetrics,
  distributions: BenchmarkPool["distributions"]
): { score: number | null; parts: { dim: DimensionDef; pct: Percentile | null }[] } {
  let weighted = 0;
  let weightSum = 0;
  const parts: { dim: DimensionDef; pct: Percentile | null }[] = [];
  for (const dim of DIMENSIONS) {
    const pct = calcPercentile(row[dim.key], distributions[dim.key]);
    parts.push({ dim, pct });
    if (pct) {
      weighted += pct.n * dim.weight;
      weightSum += dim.weight;
    }
  }
  const score = weightSum > 0 ? Math.round(weighted / weightSum) : null;
  return { score, parts };
}

function verdictFor(score: number): { label: string; tone: string; blurb: string } {
  if (score >= 75)
    return {
      label: "Leading",
      tone: "bg-emerald-500 text-white",
      blurb: "Board composition is above peer market — a defensible governance story for investors and regulators.",
    };
  if (score >= 50)
    return {
      label: "At market",
      tone: "bg-sky-500 text-white",
      blurb: "Board composition sits within peer range. Targeted upgrades on one or two dimensions would move you ahead.",
    };
  if (score >= 30)
    return {
      label: "Below market",
      tone: "bg-amber-500 text-white",
      blurb: "Board composition trails the peer group on multiple dimensions. Consider a phased refresh plan.",
    };
  return {
    label: "Trailing",
    tone: "bg-rose-600 text-white",
    blurb: "Composition scores well below peers. This is likely to surface in ESG and governance reviews.",
  };
}

export function CompositionScoreScreen({ pool }: { pool: BenchmarkPool }) {
  const { focus, filteredPeers, distributions } = pool;

  const { score: focusScore, parts: focusParts } = useMemo(
    () => computeCompositeForCompany(focus, distributions),
    [focus, distributions]
  );

  const ranked = useMemo(() => {
    const rows = [focus, ...filteredPeers].map((r) => ({
      row: r,
      composite: computeCompositeForCompany(r, distributions),
    }));
    rows.sort((a, b) => (b.composite.score ?? -1) - (a.composite.score ?? -1));
    return rows;
  }, [focus, filteredPeers, distributions]);

  const focusRank = ranked.findIndex((r) => r.row.companyId === focus.companyId) + 1;
  const totalRanked = ranked.filter((r) => r.composite.score != null).length;

  const verdict = focusScore != null ? verdictFor(focusScore) : null;

  const priorityActions: Insight[] = focusParts
    .filter((p) => p.pct && p.pct.band === "below")
    .sort((a, b) => (a.pct?.n ?? 0) - (b.pct?.n ?? 0))
    .slice(0, 3)
    .map((p) => ({
      tone: "negative" as const,
      text: (
        <>
          <strong>{p.dim.label}</strong> at P{p.pct?.n ?? "—"} — weighted{" "}
          {(p.dim.weight * 100).toFixed(0)}% of the composite. Moving this to peer median yields
          the largest score uplift.
        </>
      ),
    }));

  if (priorityActions.length === 0) {
    priorityActions.push({
      tone: "positive",
      text: (
        <>
          No dimension is currently below P35. Focus on sustaining the composition and watch peer
          refresh cycles for changes in market medians.
        </>
      ),
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Composition score"
        subtitle={`Screen 1.11 · Weighted composite percentile score · N = ${filteredPeers.length} peers`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Your composite score</CardTitle>
            <p className="text-xs text-muted-foreground">
              Weighted average of percentile ranks across six dimensions
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative h-32 w-32 rounded-full border-8 border-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold tabular-nums">{focusScore ?? "—"}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    P-score
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {verdict && (
                  <span
                    className={cn(
                      "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                      verdict.tone
                    )}
                  >
                    {verdict.label}
                  </span>
                )}
                <p className="text-sm text-muted-foreground">{verdict?.blurb ?? "Insufficient data."}</p>
                {totalRanked > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Rank <strong className="text-foreground">{focusRank}</strong> of {totalRanked}{" "}
                    companies in filtered pool.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Dimension breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {focusParts.map(({ dim, pct }) => {
              const barW = pct ? pct.n : 0;
              const tone =
                pct?.band === "above"
                  ? "bg-emerald-500"
                  : pct?.band === "below"
                  ? "bg-rose-500"
                  : "bg-sky-500";
              return (
                <div key={dim.key} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">
                      {dim.label}{" "}
                      <span className="text-muted-foreground">({(dim.weight * 100).toFixed(0)}%)</span>
                    </span>
                    <span className="tabular-nums">
                      {focus[dim.key] != null ? `${focus[dim.key]}${dim.unit ?? ""}` : "—"}
                      {pct && <span className="ml-1 text-muted-foreground">· P{pct.n}</span>}
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-muted rounded">
                    <div
                      className={cn("absolute left-0 top-0 h-full rounded", tone)}
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Peer ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-1.5">
            {ranked.map((r, idx) => {
              const isYou = r.row.companyId === focus.companyId;
              const score = r.composite.score;
              const scoreTone =
                score == null
                  ? "text-muted-foreground"
                  : score >= 75
                  ? "text-emerald-600 dark:text-emerald-400"
                  : score >= 50
                  ? "text-sky-600 dark:text-sky-400"
                  : score >= 30
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400";
              return (
                <li
                  key={r.row.companyId}
                  className={cn(
                    "flex items-center justify-between rounded border px-3 py-2 text-sm",
                    isYou && "bg-primary/10 border-primary font-semibold"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span>{r.row.name}</span>
                    {isYou && (
                      <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground">
                        You
                      </span>
                    )}
                  </span>
                  <span className={cn("tabular-nums font-semibold", scoreTone)}>
                    {score != null ? score : "—"}
                  </span>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Priority actions</CardTitle>
          <p className="text-xs text-muted-foreground">
            Dimensions below P35 — ordered by largest gap
          </p>
        </CardHeader>
        <CardContent>
          <InsightList items={priorityActions} />
        </CardContent>
      </Card>
    </div>
  );
}
