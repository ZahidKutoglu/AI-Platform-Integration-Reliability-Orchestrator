import type { OperationalStatus, ConnectionStatus, IncidentStatus, IncidentSeverity } from "@prisma/client";

export function statusLabel(status: OperationalStatus | ConnectionStatus | string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function statusTone(status: string): "ok" | "warn" | "down" | "info" | "neutral" {
  const s = status.toUpperCase();
  if (["OPERATIONAL", "CONNECTED", "RESOLVED", "ACTIVE", "VERIFIED", "SUCCEEDED", "MEETING", "APPROVED"].includes(s)) return "ok";
  if (["DEGRADED", "MONITORING", "MITIGATING", "INVESTIGATING", "PENDING_APPROVAL", "AT_RISK", "RETRIED", "REVIEWING", "P2", "P3"].includes(s)) return "warn";
  if (["OUTAGE", "DISCONNECTED", "FAILED", "P1", "CRITICAL", "BREACHED", "HIGH"].includes(s)) return "down";
  if (["DETECTED", "INFO", "SENT", "P4"].includes(s)) return "info";
  return "neutral";
}

export function incidentTone(status: IncidentStatus | IncidentSeverity) {
  return statusTone(status);
}
