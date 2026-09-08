export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-10">
      <h3 className="text-[21px] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="max-w-md text-[15px] leading-relaxed text-muted">{description}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/[0.05] ${className ?? "h-24"}`} />;
}
