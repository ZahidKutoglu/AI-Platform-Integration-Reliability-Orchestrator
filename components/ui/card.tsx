import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[22px] bg-surface shadow-[var(--shadow-card)] ring-1 ring-line",
        padded && "p-7 md:p-8",
        className,
      )}
    >
      {children}
    </section>
  );
}
