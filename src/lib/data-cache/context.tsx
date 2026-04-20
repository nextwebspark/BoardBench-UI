"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Company, Json } from "@/types/database.types";

export interface CompanyFactSlim {
  id: number;
  company_id: number;
  year: number;
  revenue: Json;
  employees: Json | null;
  revenue_band_label: string | null;
  employee_band_label: string | null;
}

interface DataCache {
  companies: Company[];
  facts: CompanyFactSlim[];
  loading: boolean;
}

const DataCacheContext = createContext<DataCache>({
  companies: [],
  facts: [],
  loading: true,
});

export function DataCacheProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [facts, setFacts] = useState<CompanyFactSlim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const [companiesRes, factsRes] = await Promise.all([
        supabase.from("companies").select("*").order("company_name_value"),
        supabase.from("company_facts").select("id, company_id, year, revenue, employees, revenue_band_label, employee_band_label"),
      ]);
      if (cancelled) return;
      if (!companiesRes.error) setCompanies(companiesRes.data ?? []);
      if (!factsRes.error) setFacts(factsRes.data ?? []);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({ companies, facts, loading }), [companies, facts, loading]);
  return <DataCacheContext.Provider value={value}>{children}</DataCacheContext.Provider>;
}

export function useAllCompanies() {
  return useContext(DataCacheContext);
}

export function useAvailableYearsFor(companyId: number | null): number[] {
  const { facts } = useContext(DataCacheContext);
  return useMemo(() => {
    if (!companyId) return [];
    const years = facts
      .filter((f) => f.company_id === companyId)
      .map((f) => f.year);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [facts, companyId]);
}

export function useFactsForYear(year: number | null): CompanyFactSlim[] {
  const { facts } = useContext(DataCacheContext);
  return useMemo(() => {
    if (!year) return [];
    return facts.filter((f) => f.year === year);
  }, [facts, year]);
}
