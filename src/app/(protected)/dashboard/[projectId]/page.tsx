import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardClient } from "./DashboardClient";
import { fetchBoardMetrics, availableYearsFor, listCompaniesWithSubSector } from "@/lib/benchmark/fetch";
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

  if (!project.focus_company_id || !project.peer_company_ids?.length) {
    return (
      <>
        <TopBar title={project.name} />
        <div className="flex-1 p-8">
          <div className="rounded-lg border bg-card p-6 text-sm">
            <p className="font-semibold">Benchmark not configured</p>
            <p className="mt-1 text-muted-foreground">
              This project was created before the benchmark flow. Create a new project to set a
              focus company and peer group.
            </p>
          </div>
        </div>
      </>
    );
  }

  const focusId = Number(project.focus_company_id);
  const peerIds = (project.peer_company_ids ?? []).map((id) => Number(id));
  const allIds = [focusId, ...peerIds];

  const targetYear =
    project.benchmark_year ?? null;

  // Run years lookup and an optimistic metrics fetch in parallel when we already know the year
  const [years, optimisticMetrics, allCompanies] = await Promise.all([
    availableYearsFor(supabase, allIds),
    targetYear ? fetchBoardMetrics(supabase, allIds, targetYear) : Promise.resolve(null),
    listCompaniesWithSubSector(supabase),
  ]);

  const year =
    targetYear && years.includes(targetYear)
      ? targetYear
      : years[0] ?? new Date().getFullYear();

  // Only re-fetch if the resolved year differs from what we fetched optimistically
  const metrics =
    optimisticMetrics && targetYear === year
      ? optimisticMetrics
      : await fetchBoardMetrics(supabase, allIds, year);
  const focus = metrics.find((m) => Number(m.companyId) === focusId);
  const peers = metrics.filter((m) => Number(m.companyId) !== focusId);

  if (!focus) {
    return (
      <>
        <TopBar title={project.name} />
        <div className="flex-1 p-8">
          <div className="rounded-lg border bg-card p-6 text-sm">
            <p className="font-semibold">Focus company data unavailable</p>
            <p className="mt-1 text-muted-foreground">
              The selected focus company has no data for {year}.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={project.name} />
      <DashboardClient focus={focus} peers={peers} year={year} projectId={project.id} allCompanies={allCompanies} />
    </>
  );
}
