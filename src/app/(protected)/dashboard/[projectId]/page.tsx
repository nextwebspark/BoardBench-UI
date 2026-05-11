import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardClient } from "./DashboardClient";
import {
  fetchBoardMetrics,
  fetchAllBoardMetrics,
  fetchLatestYear,
  availableYearsFor,
  listCompaniesWithSubSector,
} from "@/lib/benchmark/fetch";
import type { Project } from "@/types/database.types";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: projectData } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!projectData) notFound();
  const project = projectData as Project;

  const focusId = project.focus_company_id ? Number(project.focus_company_id) : null;
  const hasPeers = (project.peer_company_ids?.length ?? 0) > 0;
  const region = project.region ?? "UAE";

  // Resolve benchmark year
  let year: number;
  if (project.benchmark_year) {
    year = project.benchmark_year;
  } else if (focusId) {
    const years = await availableYearsFor(supabase, [focusId]);
    year = years[0] ?? await fetchLatestYear(supabase);
  } else {
    year = await fetchLatestYear(supabase);
  }

  // Fetch metrics
  const [metrics, allCompanies] = await Promise.all([
    hasPeers
      ? fetchBoardMetrics(
          supabase,
          focusId
            ? [focusId, ...(project.peer_company_ids ?? []).map(Number)]
            : (project.peer_company_ids ?? []).map(Number),
          year
        )
      : fetchAllBoardMetrics(supabase, year),
    listCompaniesWithSubSector(supabase),
  ]);

  const focus = focusId ? metrics.find((m) => Number(m.companyId) === focusId) : undefined;
  const peers = focus
    ? metrics.filter((m) => Number(m.companyId) !== focusId)
    : metrics;

  return (
    <>
      <TopBar title={project.name} />
      <DashboardClient
        focus={focus}
        peers={peers}
        year={year}
        projectId={project.id}
        allCompanies={allCompanies}
        region={region}
      />
    </>
  );
}
