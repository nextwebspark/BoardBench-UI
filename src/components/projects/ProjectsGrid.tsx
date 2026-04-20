"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "./ProjectCard";
import type { Project, Company } from "@/types/database.types";

interface ProjectsGridProps {
  data: Project[];
  companies?: Company[];
  isLoading?: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectsGrid({ data, companies = [], isLoading, onEdit, onDelete }: ProjectsGridProps) {
  const [query, setQuery] = useState("");

  const companyMap = useMemo(
    () => new Map(companies.map((c) => [Number(c.id), c.company_name_value])),
    [companies]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return data;
    return data.filter((p) => p.name.toLowerCase().includes(q));
  }, [data, query]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search projects…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs h-8 text-sm"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No projects found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              focusCompanyName={
                project.focus_company_id
                  ? companyMap.get(Number(project.focus_company_id))
                  : undefined
              }
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} project{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
