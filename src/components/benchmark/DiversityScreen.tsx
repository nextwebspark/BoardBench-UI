"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calcPercentile } from "@/lib/benchmark/percentiles";
import type { BenchmarkPool, Distribution } from "@/lib/benchmark/types";
import { GaugeBar } from "./primitives/GaugeBar";
import { InsightList, type Insight } from "./primitives/InsightList";
import { PercentileBadge } from "./primitives/PercentileBadge";
import { DimensionCard } from "./primitives/DimensionCard";
import { PageHeader } from "./PageHeader";
import { cn } from "@/lib/utils";

export function DiversityScreen({ pool }: { pool: BenchmarkPool }) {
  const { focus, filteredPeers, distributions } = pool;
  const allRows = [focus, ...filteredPeers];

  const intlDist: Distribution = {
    p10: Math.max(0, 100 - distributions.localPct.p90),
    p25: Math.max(0, 100 - distributions.localPct.p75),
    p50: Math.max(0, 100 - distributions.localPct.p50),
    p75: Math.max(0, 100 - distributions.localPct.p25),
    p90: Math.max(0, 100 - distributions.localPct.p10),
  };

  const pGen = calcPercentile(focus.womenPct, distributions.womenPct);
  const pLoc = calcPercentile(focus.localPct, distributions.localPct);

  const insights: Insight[] = [
    {
      tone: pGen?.band === "below" ? "negative" : "positive",
      text: (
        <>
          <strong>{focus.womenPct ?? "—"}% women at P{pGen?.n ?? "—"}.</strong>{" "}
          {focus.womenPct != null && focus.womenPct < distributions.womenPct.p50
            ? `Below median of ${distributions.womenPct.p50}%. One additional female director moves you to approximately P50.`
            : "At or above median — performing well for this peer group."}
        </>
      ),
    },
    {
      tone: "warning",
      text: (
        <>
          <strong>Regional context:</strong> peer-median women on board is{" "}
          {distributions.womenPct.p50}%. Global benchmark (FTSE 100 / S&P 500) is 34–36%.
        </>
      ),
    },
    {
      tone: pLoc?.band === "below" ? "negative" : "neutral",
      text: (
        <>
          <strong>Nationality mix:</strong> {focus.localPct ?? "—"}% local nationals. Peer median {distributions.localPct.p50}%.
        </>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Diversity"
        subtitle={`Screen 1.6 · Gender · Nationality · Age profile · N = ${filteredPeers.length} peers`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <DimensionCard
          label="Gender — women"
          value={focus.womenPct}
          unit="%"
          dist={distributions.womenPct}
          note={
            focus.womenPct != null
              ? `${focus.boardSize != null ? Math.round((focus.boardSize * focus.womenPct) / 100) : "—"} of ${focus.boardSize ?? "—"} directors`
              : "—"
          }
        />
        <DimensionCard
          label="Local directors"
          value={focus.localPct}
          unit="%"
          dist={distributions.localPct}
          note="Nationals on board"
        />
        <DimensionCard
          label="International"
          value={focus.localPct != null ? 100 - focus.localPct : null}
          unit="%"
          dist={intlDist}
          note="Expat / foreign directors"
        />
        <DimensionCard
          label="Average age"
          value={focus.avgAge}
          unit=""
          dist={distributions.avgAge}
          note="Years"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Peer group — gender ranking</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Women %</TableHead>
                <TableHead className="text-right">Women / total</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right">vs You</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRows.map((r) => {
                const isYou = r.companyId === focus.companyId;
                const rowPct = calcPercentile(r.womenPct, distributions.womenPct);
                const diff =
                  r.womenPct != null && focus.womenPct != null ? r.womenPct - focus.womenPct : null;
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
                    <TableCell className="text-right tabular-nums">
                      {r.womenPct != null ? `${r.womenPct}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.womenPct != null && r.boardSize != null
                        ? `${Math.round((r.boardSize * r.womenPct) / 100)} of ${r.boardSize}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <PercentileBadge pct={rowPct} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {isYou
                        ? "—"
                        : diff != null
                        ? `${diff > 0 ? "+" : ""}${diff}pts`
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Distribution — all dimensions</CardTitle>
          <p className="text-xs text-muted-foreground">
            Teal dot = you · shaded = P25–P75 · delta annotated vs median
          </p>
        </CardHeader>
        <CardContent>
          <GaugeBar label="Women (%)" value={focus.womenPct} distribution={distributions.womenPct} unit="%" />
          <GaugeBar label="Local nationals (%)" value={focus.localPct} distribution={distributions.localPct} unit="%" />
          <GaugeBar label="Average director age" value={focus.avgAge} distribution={distributions.avgAge} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Insights & context</CardTitle>
        </CardHeader>
        <CardContent>
          <InsightList items={insights} />
        </CardContent>
      </Card>
    </div>
  );
}
