"use client";

import { cn } from "@/lib/utils";

export type BenchmarkScreenId = "1.1" | "1.2" | "1.6" | "1.10" | "1.11";

interface BenchmarkSidebarProps {
  active: BenchmarkScreenId;
  onChange: (id: BenchmarkScreenId) => void;
}

const ITEMS: { id: BenchmarkScreenId; label: string }[] = [
  { id: "1.1", label: "Board size" },
  { id: "1.2", label: "Independence ratio" },
  { id: "1.6", label: "Diversity" },
  { id: "1.10", label: "Composition snapshot" },
  { id: "1.11", label: "Composition score" },
];

export function BenchmarkSidebar({ active, onChange }: BenchmarkSidebarProps) {
  return (
    <aside className="w-48 shrink-0 border-r bg-card">
      <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Module 1 · Composition
      </div>
      <nav className="py-1">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cn(
              "flex w-full items-center gap-2 border-l-2 px-3 py-1.5 text-xs transition-colors",
              active === it.id
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-transparent text-foreground/70 hover:bg-muted hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                active === it.id ? "bg-primary" : "bg-muted-foreground/40"
              )}
            />
            {it.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
