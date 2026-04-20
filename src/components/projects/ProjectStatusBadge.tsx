import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "active" | "paused" | "archived";

const statusConfig: Record<Status, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-primary/15 text-primary border-primary/20 hover:bg-primary/20",
  },
  paused: {
    label: "Paused",
    className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20 dark:text-yellow-400 hover:bg-yellow-500/20",
  },
  archived: {
    label: "Archived",
    className: "bg-muted text-muted-foreground border-border hover:bg-muted",
  },
};

export function ProjectStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as Status] ?? statusConfig.active;
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
}
