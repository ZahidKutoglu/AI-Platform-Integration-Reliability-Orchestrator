import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "quiet";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-9 px-3.5 text-[13px]" : "h-11 px-5 text-[15px]",
        variant === "primary" && "bg-ink text-white hover:bg-black",
        variant === "secondary" && "bg-white text-ink ring-1 ring-line hover:bg-canvas",
        variant === "ghost" && "text-ink hover:bg-black/5",
        variant === "quiet" && "bg-black/[0.04] text-ink hover:bg-black/[0.07]",
        variant === "danger" && "bg-down text-white hover:opacity-90",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
