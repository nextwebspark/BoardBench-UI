"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { X, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useUpdateProject } from "@/hooks/use-projects";
import { useAllCompanies } from "@/lib/data-cache/context";
import { cn } from "@/lib/utils";
import type { Project, Company } from "@/types/database.types";

interface EditProjectDialogProps {
  project: Project | null;
  onClose: () => void;
}

export function EditProjectDialog({ project, onClose }: EditProjectDialogProps) {
  const { mutateAsync, isPending } = useUpdateProject();
  const { companies } = useAllCompanies();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [benchmarkYear, setBenchmarkYear] = useState("");
  const [status, setStatus] = useState<"active" | "paused" | "archived">("active");
  const [focusCompany, setFocusCompany] = useState<Company | null>(null);
  const [focusQuery, setFocusQuery] = useState("");
  const [showFocusPicker, setShowFocusPicker] = useState(false);

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setDescription(project.description ?? "");
    setRegion(project.region ?? "");
    setBenchmarkYear(project.benchmark_year?.toString() ?? "");
    setStatus(project.status as "active" | "paused" | "archived");
    setFocusQuery("");
    setShowFocusPicker(false);

    if (project.focus_company_id) {
      const found = companies.find((c) => Number(c.id) === Number(project.focus_company_id));
      setFocusCompany(found ?? null);
    } else {
      setFocusCompany(null);
    }
  }, [project, companies]);

  const focusMatches = useMemo(() => {
    const q = focusQuery.toLowerCase().trim();
    if (!q) return companies.slice(0, 8);
    return companies
      .filter(
        (c) =>
          c.company_name_value.toLowerCase().includes(q) ||
          (c.company_code ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [companies, focusQuery]);

  if (!project) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;

    const year = parseInt(benchmarkYear, 10);

    try {
      await mutateAsync({
        id: project.id,
        name: name.trim(),
        description: description.trim() || undefined,
        region: region.trim() || undefined,
        benchmark_year: isNaN(year) ? undefined : year,
        status,
        focus_company_id: focusCompany ? Number(focusCompany.id) : undefined,
      });
      toast.success("Project updated");
      onClose();
    } catch {
      toast.error("Failed to update project");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-card ring-1 ring-foreground/10 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-medium text-base">Edit project</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ep-name">Name</Label>
            <Input
              id="ep-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-description">Description</Label>
            <textarea
              id="ep-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ep-region">Region</Label>
              <Input
                id="ep-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. APAC"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-year">Benchmark year</Label>
              <Input
                id="ep-year"
                type="number"
                value={benchmarkYear}
                onChange={(e) => setBenchmarkYear(e.target.value)}
                min={1900}
                max={2100}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Focus company</Label>
            {focusCompany && !showFocusPicker ? (
              <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2 text-sm">
                <span className="font-medium">{focusCompany.company_name_value}</span>
                <button
                  type="button"
                  onClick={() => setShowFocusPicker(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={focusQuery}
                    onChange={(e) => setFocusQuery(e.target.value)}
                    placeholder="Search company…"
                    className="pl-8 h-8 text-sm"
                    autoFocus={showFocusPicker}
                  />
                </div>
                <div className="max-h-36 overflow-y-auto rounded-lg border bg-popover shadow-sm">
                  {focusMatches.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setFocusCompany(c);
                        setShowFocusPicker(false);
                        setFocusQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left transition-colors",
                        focusCompany && Number(c.id) === Number(focusCompany.id) && "bg-accent"
                      )}
                    >
                      {focusCompany && Number(c.id) === Number(focusCompany.id) && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <span className="flex-1 truncate">{c.company_name_value}</span>
                      {c.company_code && (
                        <span className="text-xs text-muted-foreground shrink-0">{c.company_code}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
