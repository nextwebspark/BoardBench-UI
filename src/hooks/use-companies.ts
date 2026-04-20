"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Company, CompanyFact, BoardDirector, BoardCommittee } from "@/types/database.types";

export interface CompanyFilters {
  search?: string;
  country?: string;
  industry?: string;
}

export function useCompanies(filters: CompanyFilters = {}) {
  const supabase = createClient();

  return useQuery<Company[]>({
    queryKey: ["companies", filters],
    queryFn: async () => {
      let query = supabase.from("companies").select("*").order("company_name_value");

      if (filters.search) {
        query = query.ilike("company_name_value", `%${filters.search}%`);
      }
      if (filters.country) {
        query = query.eq("country_value", filters.country);
      }
      if (filters.industry) {
        query = query.eq("sector_value", filters.industry);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllCompanyFactsForYear(year: number | null) {
  const supabase = createClient();

  return useQuery<{ company_id: number; revenue: import("@/types/database.types").Json; employees: import("@/types/database.types").Json | null }[]>({
    queryKey: ["company_facts_all_year", year],
    enabled: year != null,
    queryFn: async () => {
      if (year == null) return [];
      const { data, error } = await supabase
        .from("company_facts")
        .select("company_id, revenue, employees")
        .eq("year", year);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCompanyFacts(companyId?: number, year?: number) {
  const supabase = createClient();

  return useQuery<CompanyFact[]>({
    queryKey: ["company_facts", companyId, year],
    queryFn: async () => {
      let query = supabase.from("company_facts").select("*");

      if (companyId) query = query.eq("company_id", companyId);
      if (year) query = query.eq("year", year);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBoardDirectors(factId?: number, filters: CompanyFilters = {}) {
  const supabase = createClient();

  return useQuery<BoardDirector[]>({
    queryKey: ["board_directors", factId, filters],
    queryFn: async () => {
      let query = supabase.from("board_directors").select("*").order("director_name");

      if (factId) query = query.eq("fact_id", factId);
      if (filters.search) {
        query = query.ilike("director_name", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBoardCommittees(factId?: number) {
  const supabase = createClient();

  return useQuery<BoardCommittee[]>({
    queryKey: ["board_committees", factId],
    queryFn: async () => {
      let query = supabase.from("board_committees").select("*").order("member_name");

      if (factId) query = query.eq("fact_id", factId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
