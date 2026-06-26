export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        <h1 className="font-serif text-3xl tracking-tight text-text-strong">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-mid">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
    </div>
  );
}
