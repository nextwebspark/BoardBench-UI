"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, X, Check, Building2, Users, PlusCircle, ChevronRight, ChevronLeft, Globe } from "lucide-react";
import { useAllCompanies, useAvailableYearsFor, useFactsForYear, useAllAvailableYears } from "@/lib/data-cache/context";
import { useCreateProject, useProjects } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Company } from "@/types/database.types";

const DEFAULT_REGION = "UAE";

function numFromJson(json: unknown): number | null {
  if (json == null) return null;
  if (typeof json === "number" && Number.isFinite(json)) return json;
  if (typeof json === "string") {
    const n = Number(json);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof json === "object" && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    const candidate = obj.value ?? obj.amount ?? obj.raw;
    if (candidate != null) return numFromJson(candidate);
  }
  return null;
}

function scorePeer(peer: Company, focus: Company): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  if (peer.country_value && focus.country_value && peer.country_value === focus.country_value) {
    score += 3;
    reasons.push("same country");
  }
  if (peer.sector_value && focus.sector_value && peer.sector_value === focus.sector_value) {
    score += 3;
    reasons.push("same industry");
  }
  if (peer.exchange_value && focus.exchange_value && peer.exchange_value === focus.exchange_value) {
    score += 1;
    reasons.push("same exchange");
  }
  return { score, reasons };
}

function matchBadge(score: number) {
  if (score >= 6) return { label: "Strong match", tone: "strong" as const };
  if (score >= 3) return { label: "Good match", tone: "good" as const };
  return { label: "Partial match", tone: "partial" as const };
}

function autoName(focus: Company | null): string {
  if (focus) return `${focus.company_name_value} Benchmark`;
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();
  return `${DEFAULT_REGION} Market Benchmark — ${month} ${year}`;
}

function uniqueName(base: string, existingNames: Set<string>): string {
  if (!existingNames.has(base)) return base;
  let n = 2;
  while (existingNames.has(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}

type Step = 1 | 2 | 3;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ProjectCreationModal({ open, onClose }: Props) {
  const router = useRouter();
  const { companies, loading: isLoading } = useAllCompanies();
  const { mutateAsync } = useCreateProject();
  const { data: existingProjects } = useProjects();
  const existingNames = useMemo(
    () => new Set((existingProjects ?? []).map((p) => p.name)),
    [existingProjects]
  );

  const [step, setStep] = useState<Step>(1);
  const [focus, setFocus] = useState<Company | null>(null);
  const [peers, setPeers] = useState<Company[]>([]);
  const [peersSkipped, setPeersSkipped] = useState(false);
  const [focusQuery, setFocusQuery] = useState("");
  const [peerQuery, setPeerQuery] = useState("");
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [benchmarkYear, setBenchmarkYear] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const focusYears = useAvailableYearsFor(focus ? Number(focus.id) : null);
  const allYears = useAllAvailableYears();
  const years = focus ? focusYears : allYears;
  const effectiveYear = benchmarkYear ?? years[0] ?? null;

  const allFacts = useFactsForYear(effectiveYear);
  const factMap = useMemo(() => {
    const map = new Map<number, { revenue: number | null; employees: number | null }>();
    for (const f of allFacts) {
      map.set(f.company_id, { revenue: numFromJson(f.revenue), employees: numFromJson(f.employees) });
    }
    return map;
  }, [allFacts]);

  const focusRevenue = focus ? (factMap.get(Number(focus.id))?.revenue ?? null) : null;
  const focusEmployees = focus ? (factMap.get(Number(focus.id))?.employees ?? null) : null;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setFocus(null);
      setPeers([]);
      setPeersSkipped(false);
      setFocusQuery("");
      setPeerQuery("");
      setName(uniqueName(autoName(null), existingNames));
      setNameEdited(false);
      setBenchmarkYear(null);
    }
  // existingNames intentionally excluded — snapshot at open time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-update name unless user edited it
  useEffect(() => {
    if (!nameEdited) setName(uniqueName(autoName(focus), existingNames));
  }, [focus, nameEdited, existingNames]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const focusMatches = useMemo(() => {
    const q = focusQuery.toLowerCase().trim();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.company_name_value.toLowerCase().includes(q) ||
        (c.company_code ?? "").toLowerCase().includes(q)
    );
  }, [companies, focusQuery]);

  const peerSuggestions = useMemo(() => {
    const q = peerQuery.toLowerCase().trim();
    const pool = companies.filter(
      (c) =>
        (!focus || Number(c.id) !== Number(focus.id)) &&
        !peers.some((p) => Number(p.id) === Number(c.id))
    );
    const filtered = q
      ? pool.filter(
          (c) =>
            c.company_name_value.toLowerCase().includes(q) ||
            (c.company_code ?? "").toLowerCase().includes(q)
        )
      : pool;

    if (focus) {
      return filtered
        .map((c) => ({ c, ...scorePeer(c, focus) }))
        .sort((a, b) => b.score - a.score);
    }
    return filtered
      .sort((a, b) => a.company_name_value.localeCompare(b.company_name_value))
      .map((c) => ({ c, score: 0, reasons: [] as string[] }));
  }, [companies, focus, peers, peerQuery]);

  const distinctSectors = useMemo(() => {
    const s = new Set(companies.map((c) => c.sector_value).filter(Boolean) as string[]);
    return [...s].sort();
  }, [companies]);

  const distinctExchanges = useMemo(() => {
    const s = new Set(companies.map((c) => c.exchange_value).filter(Boolean) as string[]);
    return [...s].sort();
  }, [companies]);

  const sameSectorCompanies = useMemo(() =>
    !focus ? [] : companies.filter(
      (c) => Number(c.id) !== Number(focus.id) && c.sector_value === focus.sector_value &&
        !peers.some((p) => Number(p.id) === Number(c.id))
    ), [companies, focus, peers]);

  const sameCountryCompanies = useMemo(() =>
    !focus ? [] : companies.filter(
      (c) => Number(c.id) !== Number(focus.id) && c.country_value === focus.country_value &&
        !peers.some((p) => Number(p.id) === Number(c.id))
    ), [companies, focus, peers]);

  const sameExchangeCompanies = useMemo(() =>
    !focus ? [] : companies.filter(
      (c) => Number(c.id) !== Number(focus.id) && c.exchange_value === focus.exchange_value &&
        !peers.some((p) => Number(p.id) === Number(c.id))
    ), [companies, focus, peers]);

  const similarRevenueCompanies = useMemo(() => {
    if (!focus || focusRevenue == null || focusRevenue <= 0) return [];
    const lo = focusRevenue / 3;
    const hi = focusRevenue * 3;
    return companies.filter((c) => {
      if (Number(c.id) === Number(focus.id)) return false;
      if (peers.some((p) => Number(p.id) === Number(c.id))) return false;
      const rev = factMap.get(Number(c.id))?.revenue ?? null;
      return rev != null && rev >= lo && rev <= hi;
    });
  }, [companies, focus, peers, factMap, focusRevenue]);

  const similarEmployeesCompanies = useMemo(() => {
    if (!focus || focusEmployees == null || focusEmployees <= 0) return [];
    const lo = focusEmployees / 3;
    const hi = focusEmployees * 3;
    return companies.filter((c) => {
      if (Number(c.id) === Number(focus.id)) return false;
      if (peers.some((p) => Number(p.id) === Number(c.id))) return false;
      const emp = factMap.get(Number(c.id))?.employees ?? null;
      return emp != null && emp >= lo && emp <= hi;
    });
  }, [companies, focus, peers, factMap, focusEmployees]);

  function addAll(list: Company[]) {
    setPeers((prev) => {
      const existingIds = new Set(prev.map((p) => Number(p.id)));
      return [...prev, ...list.filter((c) => !existingIds.has(Number(c.id)))];
    });
    setPeersSkipped(false);
  }

  function addAllBySector(sector: string) {
    const list = companies.filter(
      (c) => c.sector_value === sector && !peers.some((p) => Number(p.id) === Number(c.id)) &&
        (!focus || Number(c.id) !== Number(focus.id))
    );
    addAll(list);
  }

  function addAllByExchange(exchange: string) {
    const list = companies.filter(
      (c) => c.exchange_value === exchange && !peers.some((p) => Number(p.id) === Number(c.id)) &&
        (!focus || Number(c.id) !== Number(focus.id))
    );
    addAll(list);
  }

  function pickFocus(c: Company) {
    setFocus(c);
    setPeers([]);
    setPeersSkipped(false);
    setFocusQuery("");
  }

  function togglePeer(c: Company) {
    setPeers((prev) => {
      const has = prev.some((p) => Number(p.id) === Number(c.id));
      return has ? prev.filter((p) => Number(p.id) !== Number(c.id)) : [...prev, c];
    });
    setPeersSkipped(false);
  }

  function goBack() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  function goNext() {
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function skipFocus() {
    setFocus(null);
    setPeers([]);
    setPeersSkipped(false);
    goNext();
  }

  function skipPeers() {
    setPeers([]);
    setPeersSkipped(true);
    goNext();
  }

  const canCreate = name.trim().length > 0;

  async function handleCreate() {
    if (!canCreate || submitting) return;
    setSubmitting(true);
    try {
      const project = await mutateAsync({
        name: name.trim(),
        region: DEFAULT_REGION,
        focus_company_id: focus ? Number(focus.id) : null,
        peer_company_ids: peersSkipped ? null : peers.length > 0 ? peers.map((p) => Number(p.id)) : null,
        benchmark_year: effectiveYear,
      });
      toast.success("Dashboard created");
      onClose();
      router.push(`/dashboard/${project.id}`);
    } catch {
      toast.error("Failed to create project. Please try again.");
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-3xl bg-card border rounded-2xl shadow-2xl flex flex-col h-[85vh]">
        {/* Step indicators */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b shrink-0">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step > s
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  step === s ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s === 1 ? "Your company" : s === 2 ? "Peer group" : "Settings"}
              </span>
              {s < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden min-h-0">
          {step === 1 && (
            <Step1
              focus={focus}
              focusQuery={focusQuery}
              setFocusQuery={setFocusQuery}
              focusMatches={focusMatches}
              pickFocus={pickFocus}
              isLoading={isLoading}
            />
          )}
          {step === 2 && (
            <Step2
              focus={focus}
              peers={peers}
              peerQuery={peerQuery}
              setPeerQuery={setPeerQuery}
              peerSuggestions={peerSuggestions}
              togglePeer={togglePeer}
              addAll={addAll}
              sameSectorCompanies={sameSectorCompanies}
              sameCountryCompanies={sameCountryCompanies}
              sameExchangeCompanies={sameExchangeCompanies}
              similarRevenueCompanies={similarRevenueCompanies}
              similarEmployeesCompanies={similarEmployeesCompanies}
              distinctSectors={distinctSectors}
              distinctExchanges={distinctExchanges}
              addAllBySector={addAllBySector}
              addAllByExchange={addAllByExchange}
            />
          )}
          {step === 3 && (
            <Step3
              name={name}
              setName={(v) => { setName(v); setNameEdited(true); }}
              years={years}
              effectiveYear={effectiveYear}
              setBenchmarkYear={setBenchmarkYear}
              focus={focus}
              peers={peers}
              peersSkipped={peersSkipped}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0 gap-3">
          <div>
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={goBack} disabled={submitting}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 1 && (
              <>
                <Button variant="ghost" size="sm" onClick={skipFocus}>
                  Skip
                </Button>
                <Button size="sm" onClick={goNext} disabled={!focus}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <Button variant="ghost" size="sm" onClick={skipPeers}>
                  Skip — use all {DEFAULT_REGION} companies
                </Button>
                <Button size="sm" onClick={goNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
            {step === 3 && (
              <Button size="sm" onClick={handleCreate} disabled={!canCreate || submitting}>
                {submitting ? "Creating…" : "Create Dashboard"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Focus company ────────────────────────────────────────────────────

function Step1({
  focus,
  focusQuery,
  setFocusQuery,
  focusMatches,
  pickFocus,
  isLoading,
}: {
  focus: Company | null;
  focusQuery: string;
  setFocusQuery: (q: string) => void;
  focusMatches: Company[];
  pickFocus: (c: Company) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="shrink-0">
        <h2 className="text-base font-semibold">Select your company</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the company you want to benchmark. Skip if you only want to explore the market.
        </p>
      </div>

      {focus ? (
        <div className="shrink-0 flex items-center gap-3 rounded-xl border bg-primary/5 p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{focus.company_name_value}</div>
            <div className="text-xs text-muted-foreground">
              {[focus.country_value, focus.sector_value, focus.exchange_value].filter(Boolean).join(" · ")}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => pickFocus(focus)}>
            Change
          </Button>
        </div>
      ) : (
        <>
          <div className="shrink-0 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name or ticker…"
              className="pl-9"
              value={focusQuery}
              onChange={(e) => setFocusQuery(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="flex-1 min-h-0 rounded-xl border divide-y bg-background overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading companies…</div>
            ) : focusMatches.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No matches found</div>
            ) : (
              focusMatches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickFocus(c)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.company_name_value}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[c.country_value, c.sector_value, c.exchange_value].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {c.company_code && (
                    <span className="font-mono text-xs text-muted-foreground shrink-0">{c.company_code}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 2: Peer group ───────────────────────────────────────────────────────

function Step2({
  focus,
  peers,
  peerQuery,
  setPeerQuery,
  peerSuggestions,
  togglePeer,
  addAll,
  sameSectorCompanies,
  sameCountryCompanies,
  sameExchangeCompanies,
  similarRevenueCompanies,
  similarEmployeesCompanies,
  distinctSectors,
  distinctExchanges,
  addAllBySector,
  addAllByExchange,
}: {
  focus: Company | null;
  peers: Company[];
  peerQuery: string;
  setPeerQuery: (q: string) => void;
  peerSuggestions: { c: Company; score: number; reasons: string[] }[];
  togglePeer: (c: Company) => void;
  addAll: (list: Company[]) => void;
  sameSectorCompanies: Company[];
  sameCountryCompanies: Company[];
  sameExchangeCompanies: Company[];
  similarRevenueCompanies: Company[];
  similarEmployeesCompanies: Company[];
  distinctSectors: string[];
  distinctExchanges: string[];
  addAllBySector: (sector: string) => void;
  addAllByExchange: (exchange: string) => void;
}) {
  return (
    <div className="flex flex-col h-full p-6 gap-3">
      <div className="shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Build your peer group</h2>
          {peers.length > 0 && (
            <span className="text-xs font-medium text-primary">{peers.length} selected</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {focus
            ? "Add companies to compare against. Or skip to use all UAE companies."
            : "Select companies manually, filter by sector or exchange, or skip to use all UAE companies."}
        </p>
      </div>

      {/* Selected peers */}
      {peers.length > 0 && (
        <div className="shrink-0 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto rounded-lg border border-border/50 p-2">
          {peers.map((p) => (
            <Badge key={p.id} variant="secondary" className="gap-1 pr-1 font-normal">
              {p.company_name_value}
              <button
                type="button"
                onClick={() => togglePeer(p)}
                className="rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Focus-based quick-add buttons */}
      {focus && (
        <div className="shrink-0 flex flex-wrap gap-2">
          {sameSectorCompanies.length > 0 && (
            <QuickAddBtn label={`All same sector (${sameSectorCompanies.length})`} onClick={() => addAll(sameSectorCompanies)} />
          )}
          {sameCountryCompanies.length > 0 && (
            <QuickAddBtn label={`All same country (${sameCountryCompanies.length})`} onClick={() => addAll(sameCountryCompanies)} />
          )}
          {sameExchangeCompanies.length > 0 && (
            <QuickAddBtn label={`All same exchange (${sameExchangeCompanies.length})`} onClick={() => addAll(sameExchangeCompanies)} />
          )}
          {similarRevenueCompanies.length > 0 && (
            <QuickAddBtn label={`Similar revenue (${similarRevenueCompanies.length})`} onClick={() => addAll(similarRevenueCompanies)} />
          )}
          {similarEmployeesCompanies.length > 0 && (
            <QuickAddBtn label={`Similar employees (${similarEmployeesCompanies.length})`} onClick={() => addAll(similarEmployeesCompanies)} />
          )}
        </div>
      )}

      {/* No-focus filter chips */}
      {!focus && (
        <div className="shrink-0 space-y-2">
          {distinctSectors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">By sector</p>
              <div className="flex flex-wrap gap-1.5">
                {distinctSectors.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addAllBySector(s)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent hover:border-primary/40 transition-colors"
                  >
                    <PlusCircle className="h-3 w-3" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {distinctExchanges.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">By exchange</p>
              <div className="flex flex-wrap gap-1.5">
                {distinctExchanges.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => addAllByExchange(e)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent hover:border-primary/40 transition-colors"
                  >
                    <PlusCircle className="h-3 w-3" />
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={focus ? "Search peers or browse suggestions…" : "Search companies…"}
          className="pl-9"
          value={peerQuery}
          onChange={(e) => setPeerQuery(e.target.value)}
        />
      </div>

      {/* Peer list */}
      <div className="flex-1 min-h-0 rounded-xl border divide-y bg-background overflow-y-auto">
        {peerSuggestions.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No more companies available</div>
        ) : (
          peerSuggestions.map(({ c, score, reasons }) => {
            const badge = focus ? matchBadge(score) : null;
            const selected = peers.some((p) => Number(p.id) === Number(c.id));
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => togglePeer(c)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate flex items-center gap-2">
                    {c.company_name_value}
                    {selected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[c.country_value, c.sector_value, c.exchange_value].filter(Boolean).join(" · ")}
                    {focus && reasons.length > 0 && ` · ${reasons.join(", ")}`}
                  </div>
                </div>
                {badge && (
                  <Badge
                    variant={badge.tone === "strong" ? "default" : "secondary"}
                    className="font-normal text-xs shrink-0"
                  >
                    {badge.label}
                  </Badge>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function QuickAddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent hover:border-primary/40 transition-colors"
    >
      <PlusCircle className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

// ─── Step 3: Settings ─────────────────────────────────────────────────────────

function Step3({
  name,
  setName,
  years,
  effectiveYear,
  setBenchmarkYear,
  focus,
  peers,
  peersSkipped,
}: {
  name: string;
  setName: (v: string) => void;
  years: number[];
  effectiveYear: number | null;
  setBenchmarkYear: (y: number) => void;
  focus: Company | null;
  peers: Company[];
  peersSkipped: boolean;
}) {
  return (
    <div className="flex flex-col h-full p-6 gap-5 overflow-y-auto">
      <div className="shrink-0">
        <h2 className="text-base font-semibold">Project settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Name your benchmark and choose the data year.</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border bg-muted/40 p-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>
            {focus ? (
              <><span className="font-medium">{focus.company_name_value}</span> as focus</>
            ) : (
              <span className="text-muted-foreground">No focus company — distribution view</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>
            {peersSkipped || peers.length === 0 ? (
              <span className="text-muted-foreground">All UAE companies as peer pool</span>
            ) : (
              <><span className="font-medium">{peers.length} companies</span> in peer group</>
            )}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="proj-name">Project name</Label>
          <Input
            id="proj-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. UAE Banking Boards 2024"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="proj-year">Benchmark year</Label>
          <select
            id="proj-year"
            value={effectiveYear ?? ""}
            onChange={(e) => setBenchmarkYear(Number(e.target.value))}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {years.length === 0 ? (
              <option value="">No years available</option>
            ) : (
              years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
