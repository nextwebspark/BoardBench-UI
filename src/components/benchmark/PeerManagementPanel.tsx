"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFactsForYear } from "@/lib/data-cache/context";
import type { PeerPanelCompany, PeerPanelFilterState } from "@/lib/benchmark/types";

interface PeerManagementPanelProps {
  projectId: string;
  allCompanies: PeerPanelCompany[];
  currentPeerIds: number[];
  focusSector: string | null;
  year: number;
  onSaved: () => void;
  onClose: () => void;
}

const REVENUE_BANDS = ["Small", "Mid-Market", "Large", "Major", "Enterprise", "Mega"] as const;
const EMPLOYEE_BANDS = ["Small", "Mid-Market", "Large", "Major", "Enterprise"] as const;

function initFilters(focusSector: string | null): PeerPanelFilterState {
  return {
    sectors: focusSector ? new Set([focusSector]) : new Set(),
    subSectors: new Set(),
    countries: new Set(),
    exchanges: new Set(),
    revenueBands: new Set(),
    employeeBands: new Set(),
  };
}

export function PeerManagementPanel({
  projectId,
  allCompanies,
  currentPeerIds,
  focusSector,
  year,
  onSaved,
  onClose,
}: PeerManagementPanelProps) {
  const [draftIds, setDraftIds] = useState<Set<number>>(() => new Set(currentPeerIds));
  const [panelFilters, setPanelFilters] = useState<PeerPanelFilterState>(() => initFilters(focusSector));
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(
    () => (focusSector ? new Set([focusSector]) : new Set())
  );
  const [saving, setSaving] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const factsForYear = useFactsForYear(year);

  const factsBandMap = useMemo(() => {
    const map = new Map<number, { revBand: string | null; empBand: string | null }>();
    for (const f of factsForYear) {
      map.set(f.company_id, {
        revBand: f.revenue_band_label,
        empBand: f.employee_band_label,
      });
    }
    return map;
  }, [factsForYear]);

  const sectorTree = useMemo(() => {
    const tree = new Map<string, Set<string>>();
    for (const c of allCompanies) {
      if (!c.sector) continue;
      if (!tree.has(c.sector)) tree.set(c.sector, new Set());
      if (c.subSector) tree.get(c.sector)!.add(c.subSector);
    }
    return tree;
  }, [allCompanies]);

  const uniqueCountries = useMemo(
    () => [...new Set(allCompanies.map((c) => c.country).filter(Boolean) as string[])].sort(),
    [allCompanies]
  );

  const uniqueExchanges = useMemo(
    () => [...new Set(allCompanies.map((c) => c.exchange).filter(Boolean) as string[])].sort(),
    [allCompanies]
  );

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allCompanies.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.code ?? "").toLowerCase().includes(q))
        return false;

      const hasSectorFilter = panelFilters.sectors.size > 0 || panelFilters.subSectors.size > 0;
      if (hasSectorFilter) {
        const sectorMatch = c.sector && panelFilters.sectors.has(c.sector);
        const subMatch = c.subSector && panelFilters.subSectors.has(c.subSector);
        if (!sectorMatch && !subMatch) return false;
      }

      if (panelFilters.countries.size > 0 && (!c.country || !panelFilters.countries.has(c.country)))
        return false;

      if (panelFilters.exchanges.size > 0 && (!c.exchange || !panelFilters.exchanges.has(c.exchange)))
        return false;

      if (panelFilters.revenueBands.size > 0) {
        const bands = factsBandMap.get(c.id);
        if (bands && bands.revBand && !panelFilters.revenueBands.has(bands.revBand)) return false;
      }

      if (panelFilters.employeeBands.size > 0) {
        const bands = factsBandMap.get(c.id);
        if (bands && bands.empBand && !panelFilters.employeeBands.has(bands.empBand)) return false;
      }

      return true;
    });
  }, [allCompanies, searchQuery, panelFilters, factsBandMap]);

  function toggleDraft(id: number) {
    setDraftIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSector(sector: string) {
    const subSectors = sectorTree.get(sector) ?? new Set<string>();
    setPanelFilters((prev) => {
      const sectors = new Set(prev.sectors);
      const subs = new Set(prev.subSectors);
      if (sectors.has(sector)) {
        sectors.delete(sector);
        subSectors.forEach((s) => subs.delete(s));
      } else {
        sectors.add(sector);
        subSectors.forEach((s) => subs.add(s));
        setExpandedSectors((e) => new Set([...e, sector]));
      }
      return { ...prev, sectors, subSectors: subs };
    });
  }

  function toggleSubSector(sub: string) {
    setPanelFilters((prev) => {
      const subs = new Set(prev.subSectors);
      subs.has(sub) ? subs.delete(sub) : subs.add(sub);
      return { ...prev, subSectors: subs };
    });
  }

  function toggleSetItem(
    key: keyof Pick<PeerPanelFilterState, "countries" | "exchanges" | "revenueBands" | "employeeBands">,
    value: string
  ) {
    setPanelFilters((prev) => {
      const next = new Set(prev[key]);
      next.has(value) ? next.delete(value) : next.add(value);
      return { ...prev, [key]: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peer_company_ids: Array.from(draftIds) }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch {
      toast.error("Failed to save peers. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-b bg-card shadow-sm animate-in slide-in-from-top-1 duration-200">
      {/* Mobile filter toggle — hidden on lg+ */}
      <div className="flex items-center justify-between border-b px-4 py-2 lg:hidden">
        <p className="text-xs font-medium text-muted-foreground">Peer filters</p>
        <button
          type="button"
          onClick={() => setFiltersVisible((v) => !v)}
          className="text-xs text-primary font-medium"
        >
          {filtersVisible ? "Hide filters" : "Show filters"}
        </button>
      </div>
      <div className="flex flex-col lg:flex-row lg:h-[480px] lg:divide-x divide-border max-h-[70vh] lg:max-h-none overflow-hidden">
        {/* LEFT: filters */}
        <div className={cn(
          "flex flex-col lg:w-64 lg:shrink-0",
          filtersVisible ? "max-h-[40vh] overflow-y-auto border-b" : "hidden",
          "lg:flex lg:max-h-none lg:overflow-visible lg:border-b-0"
        )}>
          {/* sticky header */}
          <div className="flex items-center justify-between border-b px-4 py-2.5 bg-card shrink-0">
            <p className="text-[11px] text-muted-foreground">
              {draftIds.size} selected · {filteredCompanies.length} shown
            </p>
            <button
              type="button"
              onClick={() => {
                const allShown = filteredCompanies.every((c) => draftIds.has(c.id));
                setDraftIds((prev) => {
                  const next = new Set(prev);
                  if (allShown) {
                    filteredCompanies.forEach((c) => next.delete(c.id));
                  } else {
                    filteredCompanies.forEach((c) => next.add(c.id));
                  }
                  return next;
                });
              }}
              className="text-[11px] text-primary hover:underline shrink-0"
            >
              {filteredCompanies.every((c) => draftIds.has(c.id)) ? "Deselect all" : "Select all"}
            </button>
          </div>
          {/* scrollable filters */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          <FilterSection title="Sector">
            {[...sectorTree.keys()].sort().map((sector) => {
              const subs = [...(sectorTree.get(sector) ?? [])].sort();
              const isExpanded = expandedSectors.has(sector);
              return (
                <div key={sector}>
                  <div className="flex items-center gap-1.5">
                    {subs.length > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSectors((prev) => {
                            const next = new Set(prev);
                            next.has(sector) ? next.delete(sector) : next.add(sector);
                            return next;
                          })
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>
                    ) : (
                      <span className="w-3" />
                    )}
                    <CheckItem
                      label={sector}
                      checked={panelFilters.sectors.has(sector)}
                      onChange={() => toggleSector(sector)}
                    />
                  </div>
                  {isExpanded &&
                    subs.map((sub) => (
                      <div key={sub} className="ml-6 mt-1">
                        <CheckItem
                          label={sub}
                          checked={panelFilters.subSectors.has(sub)}
                          onChange={() => toggleSubSector(sub)}
                        />
                      </div>
                    ))}
                </div>
              );
            })}
          </FilterSection>

          <FilterSection title="Country">
            {uniqueCountries.map((c) => (
              <CheckItem
                key={c}
                label={c}
                checked={panelFilters.countries.has(c)}
                onChange={() => toggleSetItem("countries", c)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Exchange">
            {uniqueExchanges.map((e) => (
              <CheckItem
                key={e}
                label={e}
                checked={panelFilters.exchanges.has(e)}
                onChange={() => toggleSetItem("exchanges", e)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Revenue band">
            {REVENUE_BANDS.map((b) => (
              <CheckItem
                key={b}
                label={b}
                checked={panelFilters.revenueBands.has(b)}
                onChange={() => toggleSetItem("revenueBands", b)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Employee band">
            {EMPLOYEE_BANDS.map((b) => (
              <CheckItem
                key={b}
                label={b}
                checked={panelFilters.employeeBands.has(b)}
                onChange={() => toggleSetItem("employeeBands", b)}
              />
            ))}
          </FilterSection>
          </div>{/* end scrollable filters */}
        </div>

        {/* RIGHT: company list */}
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          <div className="border-b p-3 space-y-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="Search companies…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredCompanies.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">No companies match the current filters.</p>
            ) : (
              filteredCompanies.map((c) => {
                const checked = draftIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleDraft(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                      checked && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background"
                      )}
                    >
                      {checked && (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
                          <path
                            d="M1.5 5L4 7.5L8.5 2.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{c.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {[c.country, c.exchange, c.sector].filter(Boolean).join(" · ")}
                        {factsBandMap.get(c.id)?.revBand && (
                          <span className="ml-1">· {factsBandMap.get(c.id)!.revBand}</span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t p-3 shrink-0">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || draftIds.size < 3}>
              {saving ? "Saving…" : `Save peers (${draftIds.size})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-border accent-primary"
      />
      <span className={cn("truncate", checked ? "text-foreground font-medium" : "text-muted-foreground")}>
        {label}
      </span>
    </label>
  );
}
