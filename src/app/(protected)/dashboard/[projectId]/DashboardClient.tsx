"use client";

import { useMemo, useState } from "react";
import { computePool } from "@/lib/benchmark/percentiles";
import type { CompanyMetrics, FilterState, BenchmarkPool } from "@/lib/benchmark/types";
import { BenchmarkSidebar, type BenchmarkScreenId } from "@/components/benchmark/BenchmarkSidebar";
import { BenchmarkFilterBar } from "@/components/benchmark/BenchmarkFilterBar";
import { BoardSizeScreen } from "@/components/benchmark/BoardSizeScreen";
import { IndependenceScreen } from "@/components/benchmark/IndependenceScreen";
import { DiversityScreen } from "@/components/benchmark/DiversityScreen";
import { CompositionSnapshotScreen } from "@/components/benchmark/CompositionSnapshotScreen";
import { CompositionScoreScreen } from "@/components/benchmark/CompositionScoreScreen";

interface DashboardClientProps {
  focus: CompanyMetrics;
  peers: CompanyMetrics[];
  year: number;
}

const INITIAL_FILTERS: FilterState = {
  country: false,
  industry: false,
  capMin: null,
  capMax: null,
  empMin: null,
  empMax: null,
};

export function DashboardClient({ focus, peers, year }: DashboardClientProps) {
  const [active, setActive] = useState<BenchmarkScreenId>("1.1");
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const pool: BenchmarkPool = useMemo(() => {
    const computed = computePool(focus, peers, filters);
    return {
      focus,
      allPeers: peers,
      filteredPeers: computed.filteredPeers,
      distributions: computed.distributions,
      fallback: computed.fallback,
    };
  }, [focus, peers, filters]);

  const capRange = useMemo(() => {
    if (focus.marketCap == null) return null;
    const lo = focus.marketCap * 0.3;
    const hi = focus.marketCap * 3;
    return { min: Math.round(lo), max: Math.round(hi) };
  }, [focus]);

  const empRange = useMemo(() => {
    if (focus.employees == null) return null;
    const lo = focus.employees * 0.3;
    const hi = focus.employees * 3;
    return { min: Math.round(lo), max: Math.round(hi) };
  }, [focus]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <BenchmarkSidebar active={active} onChange={setActive} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <BenchmarkFilterBar
          filters={filters}
          onChange={setFilters}
          focusCountry={focus.country}
          focusIndustry={focus.industry}
          capRange={capRange}
          empRange={empRange}
          poolCount={pool.filteredPeers.length}
          fallback={pool.fallback}
          year={year}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {active === "1.1" && <BoardSizeScreen pool={pool} />}
          {active === "1.2" && <IndependenceScreen pool={pool} />}
          {active === "1.6" && <DiversityScreen pool={pool} />}
          {active === "1.10" && <CompositionSnapshotScreen pool={pool} />}
          {active === "1.11" && <CompositionScoreScreen pool={pool} />}
        </main>
      </div>
    </div>
  );
}
