import { cn } from "@/lib/utils";
import { statusLabel, statusTone } from "@/lib/status";

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full",
        tone === "ok" && "bg-ok",
        tone === "warn" && "bg-warn",
        tone === "down" && "bg-down",
        tone === "info" && "bg-info",
        tone === "neutral" && "bg-faint",
        className,
      )}
      aria-hidden
    />
  );
}

export function StatusBadge({ status, children }: { status: string; children?: React.ReactNode }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[13px] font-medium",
        tone === "ok" && "bg-ok-soft text-ok",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "down" && "bg-down-soft text-down",
        tone === "info" && "bg-info-soft text-info",
        tone === "neutral" && "bg-black/[0.04] text-muted",
      )}
    >
      <StatusDot status={status} />
      {children ?? statusLabel(status)}
    </span>
  );
}
