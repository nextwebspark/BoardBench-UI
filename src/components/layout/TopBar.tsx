interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6 shrink-0">
      <h1 className="font-semibold text-base">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
