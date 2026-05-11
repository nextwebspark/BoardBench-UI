"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { computePool } from "@/lib/benchmark/percentiles";
import type { CompanyMetrics, FilterState, BenchmarkPool, PeerPanelCompany } from "@/lib/benchmark/types";
import { BenchmarkSidebar, type BenchmarkScreenId } from "@/components/benchmark/BenchmarkSidebar";
import { BenchmarkFilterBar } from "@/components/benchmark/BenchmarkFilterBar";
import { PeerManagementPanel } from "@/components/benchmark/PeerManagementPanel";
import { BoardSizeScreen } from "@/components/benchmark/BoardSizeScreen";
import { IndependenceScreen } from "@/components/benchmark/IndependenceScreen";
import { DiversityScreen } from "@/components/benchmark/DiversityScreen";
import { CompositionSnapshotScreen } from "@/components/benchmark/CompositionSnapshotScreen";
import { CompositionScoreScreen } from "@/components/benchmark/CompositionScoreScreen";

interface DashboardClientProps {
  focus?: CompanyMetrics;
  peers: CompanyMetrics[];
  year: number;
  projectId: string;
  allCompanies: PeerPanelCompany[];
  region: string;
}

const INITIAL_FILTERS: FilterState = {
  country: false,
  industry: false,
  capMin: null,
  capMax: null,
  empMin: null,
  empMax: null,
};

export function DashboardClient({ focus, peers, year, projectId, allCompanies, region }: DashboardClientProps) {
  const router = useRouter();
  const [active, setActive] = useState<BenchmarkScreenId>("1.1");
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [peerPanelOpen, setPeerPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handlePeersSaved() {
    setPeerPanelOpen(false);
    router.refresh();
  }

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

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Mobile overlay backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity duration-200 ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />
      <BenchmarkSidebar
        active={active}
        onChange={(id) => { setActive(id); setSidebarOpen(false); }}
        mobileOpen={sidebarOpen}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <BenchmarkFilterBar
          filters={filters}
          onChange={setFilters}
          focusCountry={focus?.country ?? null}
          focusIndustry={focus?.industry ?? null}
          poolCount={pool.filteredPeers.length}
          fallback={pool.fallback}
          year={year}
          onEditPeers={() => setPeerPanelOpen((v) => !v)}
          peerPanelOpen={peerPanelOpen}
          onMenuOpen={() => setSidebarOpen((v) => !v)}
          hasFocus={!!focus}
        />

        {!focus && (
          <div className="flex items-center gap-2.5 border-b bg-amber-50 dark:bg-amber-950/30 px-4 lg:px-6 py-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>
              Viewing {region} market benchmarks — no focus company selected. Distributions show the full peer group.
            </span>
          </div>
        )}

        {peerPanelOpen && (
          <PeerManagementPanel
            projectId={projectId}
            allCompanies={allCompanies}
            currentPeerIds={peers.map((p) => p.companyId)}
            focusSector={focus?.industry ?? null}
            year={year}
            onSaved={handlePeersSaved}
            onClose={() => setPeerPanelOpen(false)}
          />
        )}
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
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
