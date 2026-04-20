"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { calcPercentile } from "@/lib/benchmark/percentiles";
import type { BenchmarkPool } from "@/lib/benchmark/types";
import { GaugeBar } from "./primitives/GaugeBar";
import { DimensionCard } from "./primitives/DimensionCard";
import { InsightList, type Insight } from "./primitives/InsightList";
import { PercentileBadge } from "./primitives/PercentileBadge";
import { PageHeader } from "./PageHeader";
import { cn } from "@/lib/utils";

export function IndependenceScreen({ pool }: { pool: BenchmarkPool }) {
  const { focus, filteredPeers, distributions } = pool;
  const dist = distributions.indPct;
  const boardSizeDist = distributions.boardSize;
  const pct = calcPercentile(focus.indPct, dist);

  const indValue = focus.indPct ?? 0;
  const donutData = [
    { name: "Independent", value: indValue },
    { name: "Non-independent", value: Math.max(0, 100 - indValue) },
  ];

  const allRows = [focus, ...filteredPeers];

  // Derive a "percentile rank" distribution from peer indPct values for the cohort card
  const highIndepCount = filteredPeers.filter((p) => (p.indPct ?? 0) >= 70).length;
  const highIndepPct = filteredPeers.length > 0
    ? Math.round((highIndepCount / filteredPeers.length) * 100)
    : null;

  // Build a synthetic distribution for the cohort % card
  const cohortDist = {
    p10: 20, p25: 35, p50: 50, p75: 65, p90: 80,
  };

  const insights: Insight[] = [
    {
      tone: pct?.band === "below" ? "negative" : "positive",
      text: (
        <>
          <strong>{focus.indPct ?? "—"}% independence at P{pct?.n ?? "—"}.</strong>{" "}
          {focus.indPct != null && focus.indPct < dist.p50
            ? `Below market median of ${dist.p50}%. One additional independent director would materially improve your position.`
            : "At or above market — strong governance signal for investors."}
        </>
      ),
    },
    {
      tone: "neutral",
      text: (
        <>
          <strong>High-independence cohort:</strong>{" "}
          {Math.round(
            (filteredPeers.filter((p) => (p.indPct ?? 0) >= 70).length /
              Math.max(1, filteredPeers.length)) *
              100
          )}
          % of your peer group has ≥70% independent directors.
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Independence ratio"
        subtitle={`Screen 1.2 · Benchmarking & governance compliance · ${focus.year ?? "—"}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DimensionCard
          label="Independence"
          value={focus.indPct}
          unit="%"
          dist={dist}
          note={
            focus.boardSize != null && focus.indPct != null
              ? `${Math.round((focus.boardSize * focus.indPct) / 100)} of ${focus.boardSize} directors`
              : "Independent directors"
          }
        />
        <DimensionCard
          label="Board size"
          value={focus.boardSize}
          unit=""
          dist={boardSizeDist}
          note={`Peer range: ${boardSizeDist.p10}–${boardSizeDist.p90} directors`}
        />
        <DimensionCard
          label="Peer median"
          value={dist.p50}
          unit="%"
          dist={dist}
          note={`P25: ${dist.p25}% · P75: ${dist.p75}%`}
        />
        <DimensionCard
          label="High-indep cohort"
          value={highIndepPct}
          unit="%"
          dist={cohortDist}
          note="% of peers with ≥70% independence"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Board composition</CardTitle>
            <p className="text-xs text-muted-foreground">
              Independent vs non-independent directors
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="var(--primary)" />
                    <Cell fill="var(--muted)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 justify-center text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Independent ({focus.indPct ?? "—"}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-muted border" /> Non-independent
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Peer group comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Board size</TableHead>
                  <TableHead className="text-right">Indep %</TableHead>
                  <TableHead className="text-right">Indep dirs</TableHead>
                  <TableHead>Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRows.map((r) => {
                  const isYou = r.companyId === focus.companyId;
                  const rowPct = calcPercentile(r.indPct, dist);
                  return (
                    <TableRow
                      key={r.companyId}
                      className={cn(isYou && "bg-primary/10 font-semibold")}
                    >
                      <TableCell>
                        {r.name}
                        {isYou && (
                          <span className="ml-1.5 rounded-sm bg-primary px-1 py-0.5 text-[9px] text-primary-foreground align-middle">
                            You
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.boardSize ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.indPct != null ? `${r.indPct}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.indPct != null && r.boardSize != null ? Math.round((r.boardSize * r.indPct) / 100) : "—"}
                      </TableCell>
                      <TableCell>
                        <PercentileBadge pct={rowPct} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Distribution — independence ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <GaugeBar label="Independence (%)" value={focus.indPct} distribution={dist} unit="%" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <InsightList items={insights} />
        </CardContent>
      </Card>
    </div>
  );
}
