"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useAvailableYears(companyId: number | null) {
  const supabase = createClient();

  return useQuery<number[]>({
    queryKey: ["company_facts_years", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_facts")
        .select("year")
        .eq("company_id", companyId)
        .order("year", { ascending: false });
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((r) => r.year))).sort((a, b) => b - a);
    },
  });
}
