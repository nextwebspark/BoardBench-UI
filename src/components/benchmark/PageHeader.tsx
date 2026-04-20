export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="h-[3px] w-8 rounded-sm bg-primary mb-2.5" />
      <h1 className="text-2xl font-serif tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
