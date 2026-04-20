import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { CompanyMetrics } from "./types";

function numFromJson(json: Json | null | undefined): number | null {
  if (json == null) return null;
  if (typeof json === "number" && Number.isFinite(json)) return json;
  if (typeof json === "string") {
    const n = Number(json);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof json === "object" && !Array.isArray(json)) {
    const candidate =
      (json as Record<string, Json | undefined>).value ??
      (json as Record<string, Json | undefined>).amount ??
      (json as Record<string, Json | undefined>).raw;
    if (candidate != null) return numFromJson(candidate);
  }
  return null;
}

interface DirectorAggRow {
  gender: string | null;
  director_type: string | null;
  local_expat: string | null;
  age: number | null;
  board_meetings_attended: number | null;
}

function computeMetricsFromDirectors(directors: DirectorAggRow[]) {
  const n = directors.length;
  if (n === 0) {
    return {
      boardSize: null,
      indPct: null,
      womenPct: null,
      localPct: null,
      avgAge: null,
      meetings: null,
    };
  }
  const indepCount = directors.filter(
    (d) => d.director_type && /independent/i.test(d.director_type)
  ).length;
  const womenCount = directors.filter(
    (d) => d.gender && /^f/i.test(d.gender.trim())
  ).length;
  const localCount = directors.filter(
    (d) => d.local_expat && /^local/i.test(d.local_expat.trim())
  ).length;
  const ages = directors
    .map((d) => d.age)
    .filter((a): a is number => typeof a === "number" && Number.isFinite(a));
  const meetings = directors
    .map((d) => d.board_meetings_attended)
    .filter((m): m is number => typeof m === "number" && Number.isFinite(m));

  return {
    boardSize: n,
    indPct: Math.round((indepCount / n) * 100),
    womenPct: Math.round((womenCount / n) * 100),
    localPct: Math.round((localCount / n) * 100),
    avgAge: ages.length ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : null,
    meetings: meetings.length ? Math.max(...meetings) : null,
  };
}

export interface CompanyListItem {
  id: number;
  name: string;
  code: string | null;
  country: string | null;
  industry: string | null;
  exchange: string | null;
}

export async function listCompanies(
  supabase: SupabaseClient<Database>
): Promise<CompanyListItem[]> {
  const { data } = await supabase
    .from("companies")
    .select("id, company_name_value, company_code, country_value, sector_value, exchange_value")
    .order("company_name_value");

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.company_name_value,
    code: c.company_code,
    country: c.country_value,
    industry: c.sector_value,
    exchange: c.exchange_value,
  }));
}

export async function listCompaniesWithSubSector(
  supabase: SupabaseClient<Database>
): Promise<import("./types").PeerPanelCompany[]> {
  const { data } = await supabase
    .from("companies")
    .select("id, company_name_value, company_code, country_value, sector_value, sub_sector_value, exchange_value")
    .order("company_name_value");
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.company_name_value,
    code: c.company_code,
    country: c.country_value,
    exchange: c.exchange_value,
    sector: c.sector_value,
    subSector: c.sub_sector_value,
  }));
}

export async function availableYearsFor(
  supabase: SupabaseClient<Database>,
  companyIds: number[]
): Promise<number[]> {
  if (!companyIds.length) return [];
  const { data } = await supabase
    .from("company_facts")
    .select("year")
    .in("company_id", companyIds);
  const years = Array.from(new Set((data ?? []).map((r) => r.year))).sort((a, b) => b - a);
  return years;
}

export async function fetchBoardMetrics(
  supabase: SupabaseClient<Database>,
  companyIds: number[],
  year: number
): Promise<CompanyMetrics[]> {
  if (!companyIds.length) return [];

  const [{ data: companies }, { data: facts }] = await Promise.all([
    supabase
      .from("companies")
      .select("id, company_name_value, company_code, country_value, sector_value, exchange_value")
      .in("id", companyIds),
    supabase
      .from("company_facts")
      .select("id, company_id, year, revenue, market_capitalisation, employees")
      .in("company_id", companyIds)
      .eq("year", year),
  ]);

  type FactRow = NonNullable<typeof facts>[number];
  const factByCompany = new Map<number, FactRow>();
  (facts ?? []).forEach((f) => factByCompany.set(f.company_id, f));

  const factIds = (facts ?? []).map((f) => f.id);
  const { data: directors } = factIds.length
    ? await supabase
        .from("board_directors")
        .select("fact_id, gender, director_type, local_expat, age, board_meetings_attended")
        .in("fact_id", factIds)
    : { data: [] as { fact_id: number; gender: string | null; director_type: string | null; local_expat: string | null; age: number | null; board_meetings_attended: number | null }[] };

  const dirByFact = new Map<number, DirectorAggRow[]>();
  (directors ?? []).forEach((d) => {
    const arr = dirByFact.get(d.fact_id) ?? [];
    arr.push({
      gender: d.gender,
      director_type: d.director_type,
      local_expat: d.local_expat,
      age: d.age,
      board_meetings_attended: d.board_meetings_attended,
    });
    dirByFact.set(d.fact_id, arr);
  });

  return (companies ?? []).map<CompanyMetrics>((c) => {
    const fact = factByCompany.get(c.id) ?? null;
    const directorRows = fact ? dirByFact.get(fact.id) ?? [] : [];
    const agg = computeMetricsFromDirectors(directorRows);
    return {
      companyId: c.id,
      factId: fact?.id ?? null,
      name: c.company_name_value,
      code: c.company_code,
      country: c.country_value,
      industry: c.sector_value,
      exchange: c.exchange_value,
      year: fact?.year ?? null,
      marketCap: fact ? numFromJson(fact.market_capitalisation) : null,
      revenue: fact ? numFromJson(fact.revenue) : null,
      employees: fact ? numFromJson(fact.employees) : null,
      ...agg,
    };
  });
}
