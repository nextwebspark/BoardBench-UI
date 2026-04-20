"use client";

import { useState } from "react";
import { Plus, LayoutGrid, List } from "lucide-react";
import { useNavigation } from "@/lib/navigation/context";
import { TopBar } from "@/components/layout/TopBar";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/use-projects";
import { useAllCompanies } from "@/lib/data-cache/context";
import type { Project } from "@/types/database.types";

type View = "cards" | "table";

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects();
  const { companies } = useAllCompanies();
  const { navigateTo } = useNavigation();
  const [view, setView] = useState<View>("cards");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  return (
    <>
      <TopBar
        title="Projects"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setView("cards")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
                  view === "cards"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-label="Card view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </button>
              <button
                onClick={() => setView("table")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
                  view === "table"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-label="Table view"
              >
                <List className="h-3.5 w-3.5" />
                Table
              </button>
            </div>

            <button onClick={() => navigateTo("/projects/new")} className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="h-4 w-4 mr-1.5" />
              New project
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        {!isLoading && projects.length === 0 ? (
          <EmptyState onNew={() => navigateTo("/projects/new")} />
        ) : view === "cards" ? (
          <ProjectsGrid
            data={projects}
            companies={companies}
            isLoading={isLoading}
            onEdit={setEditingProject}
            onDelete={setDeletingProject}
          />
        ) : (
          <ProjectsTable
            data={projects}
            isLoading={isLoading}
            onEdit={setEditingProject}
            onDelete={setDeletingProject}
          />
        )}
      </div>

      <EditProjectDialog
        project={editingProject}
        onClose={() => setEditingProject(null)}
      />
      <DeleteProjectDialog
        project={deletingProject}
        onClose={() => setDeletingProject(null)}
      />
    </>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
      <div className="rounded-full bg-muted p-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
          />
        </svg>
      </div>
      <div>
        <p className="font-medium">No projects yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first project to start analysing board governance data.
        </p>
      </div>
      <button onClick={onNew} className={cn(buttonVariants({ size: "sm" }))}>
        <Plus className="h-4 w-4 mr-1.5" />
        New project
      </button>
    </div>
  );
}
