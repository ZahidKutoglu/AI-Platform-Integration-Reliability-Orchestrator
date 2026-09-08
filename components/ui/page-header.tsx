import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-3 text-[13px] font-medium text-faint">{eyebrow}</p> : null}
        <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink md:text-[52px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-[19px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
