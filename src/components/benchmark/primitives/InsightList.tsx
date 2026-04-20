import { cn } from "@/lib/utils";

export type InsightTone = "positive" | "negative" | "neutral" | "warning";

export interface Insight {
  tone: InsightTone;
  text: React.ReactNode;
}

const DOT_CLASS: Record<InsightTone, string> = {
  positive: "bg-emerald-500",
  negative: "bg-rose-500",
  neutral: "bg-sky-500",
  warning: "bg-amber-500",
};

export function InsightList({ items }: { items: Insight[] }) {
  return (
    <div className="divide-y">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2.5 py-2.5 first:pt-0 last:pb-0">
          <div
            className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT_CLASS[it.tone])}
          />
          <p className="text-sm leading-relaxed">{it.text}</p>
        </div>
      ))}
    </div>
  );
}
