"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, X, Check, Building2, Users, PlusCircle } from "lucide-react";
import { useAllCompanies, useAvailableYearsFor, useFactsForYear } from "@/lib/data-cache/context";
import { useCreateProject } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Company } from "@/types/database.types";

const MIN_PEERS = 3;

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

export function BenchmarkWizard() {
  const router = useRouter();
  const { companies, loading: isLoading } = useAllCompanies();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [focus, setFocus] = useState<Company | null>(null);
  const [peers, setPeers] = useState<Company[]>([]);
  const [focusQuery, setFocusQuery] = useState("");
  const [peerQuery, setPeerQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const years = useAvailableYearsFor(focus ? Number(focus.id) : null);
  const [benchmarkYear, setBenchmarkYear] = useState<number | null>(null);
  const effectiveYear = benchmarkYear ?? years[0] ?? null;

  const { mutateAsync } = useCreateProject();

  const allFacts = useFactsForYear(effectiveYear);

  const factMap = useMemo(() => {
    const map = new Map<number, { revenue: number | null; employees: number | null }>();
    for (const f of allFacts) {
      map.set(f.company_id, {
        revenue: numFromJson(f.revenue),
        employees: numFromJson(f.employees),
      });
    }
    return map;
  }, [allFacts]);

  const focusRevenue = focus ? (factMap.get(Number(focus.id))?.revenue ?? null) : null;
  const focusEmployees = focus ? (factMap.get(Number(focus.id))?.employees ?? null) : null;

  const focusMatches = useMemo(() => {
    const q = focusQuery.toLowerCase().trim();
    if (!q) return companies.slice(0, 8);
    return companies
      .filter(
        (c) =>
          c.company_name_value.toLowerCase().includes(q) ||
          (c.company_code ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [companies, focusQuery]);

  const peerSuggestions = useMemo(() => {
    if (!focus) return [];
    const q = peerQuery.toLowerCase().trim();
    const pool = companies.filter(
      (c) => Number(c.id) !== Number(focus.id) && !peers.some((p) => Number(p.id) === Number(c.id))
    );
    const filtered = q
      ? pool.filter(
          (c) =>
            c.company_name_value.toLowerCase().includes(q) ||
            (c.company_code ?? "").toLowerCase().includes(q)
        )
      : pool;
    return filtered
      .map((c) => ({ c, ...scorePeer(c, focus) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }, [companies, focus, peers, peerQuery]);

  const sameSectorCompanies = useMemo(() =>
    !focus ? [] : companies.filter(
      (c) =>
        Number(c.id) !== Number(focus.id) &&
        c.sector_value && c.sector_value === focus.sector_value &&
        !peers.some((p) => Number(p.id) === Number(c.id))
    ), [companies, focus, peers]);

  const sameCountryCompanies = useMemo(() =>
    !focus ? [] : companies.filter(
      (c) =>
        Number(c.id) !== Number(focus.id) &&
        c.country_value && c.country_value === focus.country_value &&
        !peers.some((p) => Number(p.id) === Number(c.id))
    ), [companies, focus, peers]);

  const sameExchangeCompanies = useMemo(() =>
    !focus ? [] : companies.filter(
      (c) =>
        Number(c.id) !== Number(focus.id) &&
        c.exchange_value && c.exchange_value === focus.exchange_value &&
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
  }

  function pickFocus(c: Company) {
    setFocus(c);
    setPeers([]);
    setFocusQuery("");
    if (!name) setName(`${c.company_name_value} benchmark`);
  }

  function togglePeer(c: Company) {
    if (peers.some((p) => Number(p.id) === Number(c.id))) {
      setPeers((prev) => prev.filter((p) => Number(p.id) !== Number(c.id)));
    } else {
      setPeers((prev) => [...prev, c]);
    }
  }

  const canSubmit =
    !!focus && peers.length >= MIN_PEERS && !!effectiveYear && name.trim().length > 0;

  async function handleSubmit() {
    if (!focus || !effectiveYear || submitting) return;
    setSubmitting(true);
    try {
      const project = await mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        focus_company_id: focus.id,
        peer_company_ids: peers.map((p) => p.id),
        benchmark_year: effectiveYear,
      });
      toast.success("Benchmark created");
      router.push(`/dashboard/${project.id}`);
      // intentionally keep submitting=true — component unmounts on navigation
    } catch {
      toast.error("Failed to create benchmark. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* STEP 1 */}
      <section className="space-y-3">
        <StepHeader num={1} done={!!focus} title="Select the focus company" />
        {!focus ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies by name or code…"
                className="pl-9"
                value={focusQuery}
                onChange={(e) => setFocusQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="rounded-lg border divide-y bg-card">
              {focusMatches.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No matches</div>
              ) : (
                focusMatches.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickFocus(c)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.company_name_value}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[c.country_value, c.sector_value, c.exchange_value].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {c.company_code && (
                      <span className="font-mono text-xs text-muted-foreground">{c.company_code}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border bg-primary/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{focus.company_name_value}</div>
              <div className="text-xs text-muted-foreground">
                {[focus.country_value, focus.sector_value, focus.exchange_value].filter(Boolean).join(" · ")}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFocus(null);
                setPeers([]);
              }}
            >
              Change
            </Button>
          </div>
        )}
      </section>

      {/* STEP 2 */}
      <section className={cn("space-y-3", !focus && "opacity-50 pointer-events-none")}>
        <StepHeader
          num={2}
          done={peers.length >= MIN_PEERS}
          title="Build your peer group"
          trailing={
            <span
              className={cn(
                "text-xs",
                peers.length >= MIN_PEERS ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              {peers.length} selected · min {MIN_PEERS}
            </span>
          }
        />

        {peers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {peers.map((p) => (
              <Badge
                key={p.id}
                variant="secondary"
                className="gap-1 pr-1 font-normal"
              >
                {p.company_name_value}
                <button
                  type="button"
                  onClick={() => togglePeer(p)}
                  className="rounded-full hover:bg-muted p-0.5"
                  aria-label={`Remove ${p.company_name_value}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Quick-select buttons */}
        {focus && (
          sameSectorCompanies.length > 0 ||
          sameCountryCompanies.length > 0 ||
          sameExchangeCompanies.length > 0 ||
          similarRevenueCompanies.length > 0 ||
          similarEmployeesCompanies.length > 0
        ) && (
          <div className="flex flex-wrap gap-2">
            {sameSectorCompanies.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => addAll(sameSectorCompanies)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                All same sector ({sameSectorCompanies.length})
              </Button>
            )}
            {sameCountryCompanies.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => addAll(sameCountryCompanies)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                All same country ({sameCountryCompanies.length})
              </Button>
            )}
            {sameExchangeCompanies.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => addAll(sameExchangeCompanies)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                All same exchange ({sameExchangeCompanies.length})
              </Button>
            )}
            {similarRevenueCompanies.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => addAll(similarRevenueCompanies)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Similar revenue band ({similarRevenueCompanies.length})
              </Button>
            )}
            {similarEmployeesCompanies.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => addAll(similarEmployeesCompanies)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Similar employee band ({similarEmployeesCompanies.length})
              </Button>
            )}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search peers or browse suggestions…"
            className="pl-9"
            value={peerQuery}
            onChange={(e) => setPeerQuery(e.target.value)}
            disabled={!focus}
          />
        </div>

        <div className="rounded-lg border divide-y bg-card max-h-80 overflow-y-auto">
          {peerSuggestions.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              {focus ? "No more peers available" : "Select a focus company first"}
            </div>
          ) : (
            peerSuggestions.map(({ c, score, reasons }) => {
              const badge = matchBadge(score);
              const selected = peers.some((p) => Number(p.id) === Number(c.id));
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => togglePeer(c)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      {c.company_name_value}
                      {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[c.country_value, c.sector_value, c.exchange_value].filter(Boolean).join(" · ")}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {reasons.length ? reasons.join(" · ") : "no overlap"}
                    </div>
                  </div>
                  <Badge
                    variant={badge.tone === "strong" ? "default" : "secondary"}
                    className="font-normal text-xs shrink-0"
                  >
                    {badge.label}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* STEP 3 — metadata */}
      <section className={cn("space-y-4", (!focus || peers.length < MIN_PEERS) && "opacity-50 pointer-events-none")}>
        <StepHeader num={3} done={canSubmit} title="Name your benchmark" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. APAC Banking Boards 2024"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Benchmark year *</Label>
            <select
              id="year"
              value={effectiveYear ?? ""}
              onChange={(e) => setBenchmarkYear(Number(e.target.value))}
              className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
            >
              {years.length === 0 && <option value="">No years available</option>}
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2 border-t">
        <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "Creating…" : "Open benchmark dashboard"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/projects")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function StepHeader({
  num,
  done,
  title,
  trailing,
}: {
  num: number;
  done: boolean;
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
          done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : num}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {trailing && <span className="ml-auto">{trailing}</span>}
    </div>
  );
}
