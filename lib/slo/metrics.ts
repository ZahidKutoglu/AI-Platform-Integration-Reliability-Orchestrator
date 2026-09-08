export type SloStatus = "meeting" | "at_risk" | "breached";

export function sloStatus(current: number, target: number, inverse = false): SloStatus {
  if (inverse) {
    if (current <= target) return "meeting";
    if (current <= target * 1.25) return "at_risk";
    return "breached";
  }
  if (current >= target) return "meeting";
  if (current >= target - 0.2) return "at_risk";
  return "breached";
}

export function errorBudget(current: number, target: number) {
  const allowed = 100 - target;
  const consumed = Math.max(0, 100 - current);
  const remaining = Math.max(0, allowed - consumed);
  const remainingPercent = allowed === 0 ? 0 : (remaining / allowed) * 100;
  return { allowed, consumed, remaining, remainingPercent };
}
