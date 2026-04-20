"use client";

import { FolderKanban, MoreHorizontal, Pencil, Trash2, ExternalLink, Users, Calendar, Globe } from "lucide-react";
import { useNavigation } from "@/lib/navigation/context";
import { Card, CardHeader, CardTitle, CardAction, CardContent, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/database.types";

interface ProjectCardProps {
  project: Project;
  focusCompanyName?: string;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, focusCompanyName, onEdit, onDelete }: ProjectCardProps) {
  const { navigateTo } = useNavigation();
  const peerCount = project.peer_company_ids?.length ?? 0;

  return (
    <Card className="hover:ring-primary/30 transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2 min-w-0">
          <FolderKanban className="h-4 w-4 text-primary shrink-0" />
          <CardTitle className="truncate">{project.name}</CardTitle>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-7 w-7 text-muted-foreground"
              )}
              aria-label="Project actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(project)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        <ProjectStatusBadge status={project.status} />

        {focusCompanyName && (
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground">Focus:</span> {focusCompanyName}
          </p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
          {peerCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {peerCount} peer{peerCount !== 1 ? "s" : ""}
            </span>
          )}
          {project.benchmark_year && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {project.benchmark_year}
            </span>
          )}
          {project.region && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {project.region}
            </span>
          )}
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">{project.description}</p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          onClick={() => navigateTo(`/dashboard/${project.id}`)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}
