import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  accent?: string;
}

export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <Card className="flex overflow-hidden p-0 divide-x">
      {items.map((it, i) => (
        <div key={i} className="flex-1 p-4 space-y-1.5">
          <div
            className={cn("h-[3px] w-6 rounded-sm", it.accent ?? "bg-primary")}
          />
          <div className="text-2xl font-semibold tabular-nums tracking-tight">
            {it.value}
          </div>
          <div className="text-xs font-medium text-muted-foreground">{it.label}</div>
          {it.sub && <div className="text-xs text-muted-foreground/80">{it.sub}</div>}
        </div>
      ))}
    </Card>
  );
}
