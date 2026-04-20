"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteProject } from "@/hooks/use-projects";
import type { Project } from "@/types/database.types";

interface DeleteProjectDialogProps {
  project: Project | null;
  onClose: () => void;
}

export function DeleteProjectDialog({ project, onClose }: DeleteProjectDialogProps) {
  const { mutateAsync, isPending } = useDeleteProject();

  if (!project) return null;

  async function handleDelete() {
    if (!project) return;
    try {
      await mutateAsync(project.id);
      toast.success("Project deleted");
      onClose();
    } catch {
      toast.error("Failed to delete project");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm rounded-xl bg-card ring-1 ring-foreground/10 shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="font-medium text-base">Delete project</h2>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{project.name}</span>?
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
