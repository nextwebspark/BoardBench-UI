"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calcPercentile } from "@/lib/benchmark/percentiles";
import type { BenchmarkPool, CompanyMetrics, MetricKey } from "@/lib/benchmark/types";
import { PageHeader } from "./PageHeader";
import { cn } from "@/lib/utils";

type ColumnKey = MetricKey | "name" | "country" | "industry";

const METRIC_COLUMNS: { key: MetricKey; label: string; unit?: string }[] = [
  { key: "boardSize", label: "Board size" },
  { key: "indPct", label: "Independent", unit: "%" },
  { key: "womenPct", label: "Women", unit: "%" },
  { key: "localPct", label: "Local", unit: "%" },
  { key: "avgAge", label: "Avg age" },
  { key: "meetings", label: "Meetings" },
];

function bandClass(band: "below" | "at" | "above" | null) {
  if (band === "above") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (band === "below") return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  if (band === "at") return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
  return "text-muted-foreground";
}

export function CompositionSnapshotScreen({ pool }: { pool: BenchmarkPool }) {
  const { focus, filteredPeers, distributions } = pool;
  const allRows = useMemo<CompanyMetrics[]>(
    () => [focus, ...filteredPeers],
    [focus, filteredPeers]
  );

  const [sortKey, setSortKey] = useState<ColumnKey>("boardSize");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const rows = [...allRows];
    rows.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey];
      const bv = (b as unknown as Record<string, unknown>)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av);
      const bs = String(bv);
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return rows;
  }, [allRows, sortKey, sortDir]);

  function handleSort(key: ColumnKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortArrow({ col }: { col: ColumnKey }) {
    if (sortKey !== col) return <span className="opacity-30 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Composition snapshot"
        subtitle={`Screen 1.10 · Full peer matrix · N = ${filteredPeers.length} peers`}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Peer matrix</CardTitle>
          <p className="text-xs text-muted-foreground">
            Cells coloured by percentile band · green = above P60 · blue = P35–P60 · red = below P35
          </p>
        </CardHeader>
        <p className="px-4 pb-2 text-[10px] text-muted-foreground sm:hidden">← Scroll to see all columns</p>
        <CardContent className="overflow-x-auto p-0 sm:p-6">
          <div className="min-w-[700px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="inline-flex items-center text-xs font-semibold"
                  >
                    Company <SortArrow col="name" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("country")}
                    className="inline-flex items-center text-xs font-semibold"
                  >
                    Country <SortArrow col="country" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("industry")}
                    className="inline-flex items-center text-xs font-semibold"
                  >
                    Industry <SortArrow col="industry" />
                  </button>
                </TableHead>
                {METRIC_COLUMNS.map((c) => (
                  <TableHead key={c.key} className="text-right">
                    <button
                      type="button"
                      onClick={() => handleSort(c.key)}
                      className="inline-flex items-center text-xs font-semibold"
                    >
                      {c.label}
                      <SortArrow col={c.key} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => {
                const isYou = r.companyId === focus.companyId;
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
                    <TableCell className="text-xs text-muted-foreground">
                      {r.country ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.industry ?? "—"}
                    </TableCell>
                    {METRIC_COLUMNS.map((c) => {
                      const val = r[c.key];
                      const pct = calcPercentile(val, distributions[c.key]);
                      return (
                        <TableCell key={c.key} className="text-right tabular-nums p-1">
                          <span
                            className={cn(
                              "inline-flex items-center justify-end gap-1 rounded px-2 py-1 min-w-[64px] text-xs",
                              bandClass(pct?.band ?? null)
                            )}
                          >
                            <span className="font-semibold">
                              {val != null ? `${val}${c.unit ?? ""}` : "—"}
                            </span>
                            {pct && (
                              <span className="text-[10px] opacity-70">
                                P{pct.n}
                              </span>
                            )}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-500/40" /> Above P60 — leading
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-sky-500/40" /> P35–P60 — at market
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-rose-500/40" /> Below P35 — trailing
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
