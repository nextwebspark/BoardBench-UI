export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/40 backdrop-blur-md pointer-events-auto">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Building your dashboard</p>
          <p className="text-xs text-muted-foreground mt-1">Crunching board composition data…</p>
        </div>
      </div>
    </div>
  );
}
