import type { Incident, IncidentStatus, PlatformEvent } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { notifyOperators } from "@/lib/notifications/engine";

const OPEN_STATUSES: IncidentStatus[] = ["DETECTED", "INVESTIGATING", "MITIGATING", "MONITORING"];

export function shouldOpenIncident(event: Pick<PlatformEvent, "type" | "severity">) {
  if (event.severity === "INFO" || event.severity === "LOW") return false;
  return (
    event.type.includes("health_changed") ||
    event.type.includes("api_error") ||
    event.type.includes("workflow.failed") ||
    event.type.includes("disconnected") ||
    event.type.includes("vendor.incident") ||
    event.type.includes("outage") ||
    event.type.includes("latency") ||
    event.type.includes("sync.failed") ||
    event.type.includes("webhook.failed") ||
    event.type.includes("drift_detected")
  );
}

export function severityFromEvent(event: Pick<PlatformEvent, "type" | "severity">): "P1" | "P2" | "P3" | "P4" {
  if (event.type.includes("outage") || event.severity === "CRITICAL") return "P1";
  if (event.severity === "HIGH") return "P2";
  if (event.severity === "MEDIUM") return "P3";
  return "P4";
}

export function nextIncidentStatus(current: IncidentStatus, signal: "ack" | "mitigate" | "monitor" | "resolve") {
  const flow: Record<typeof signal, IncidentStatus> = {
    ack: "INVESTIGATING",
    mitigate: "MITIGATING",
    monitor: "MONITORING",
    resolve: "RESOLVED",
  };
  if (current === "RESOLVED") return current;
  return flow[signal];
}

async function nextIncidentNumber() {
  const latest = await prisma.incident.findFirst({ orderBy: { number: "desc" } });
  const current = latest ? Number(latest.number.replace("INC-", "")) : 420;
  return `INC-${String(current + 1).padStart(5, "0")}`;
}

export async function evaluateIncidentForEvent(event: PlatformEvent) {
  if (!shouldOpenIncident(event) || !event.platformId) return null;

  const existing = await prisma.incident.findFirst({
    where: {
      platformId: event.platformId,
      status: { in: OPEN_STATUSES },
      title: { contains: titleHint(event.type) },
    },
    orderBy: { detectedAt: "desc" },
  });

  if (existing) {
    await appendTimeline(existing.id, "event", event.title, "Operations engine", event.id);
    return existing;
  }

  const platform = await prisma.platform.findUnique({ where: { id: event.platformId } });
  if (!platform) return null;

  const workflows = await prisma.workflow.findMany({
    where: { platformId: platform.id, status: { not: "disabled" } },
    select: { name: true },
  });

  const owner = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const incident = await prisma.incident.create({
    data: {
      number: await nextIncidentNumber(),
      title: incidentTitle(platform.name, event),
      severity: severityFromEvent(event),
      status: "DETECTED",
      platformId: platform.id,
      affectedWorkflows: workflows.map((w) => w.name),
      affectedUsers: Math.max(8, Math.round(platform.userCount * 0.18)),
      ownerId: owner?.id,
      vendorStatus: "Not escalated",
      summary: event.title,
      rootCause: null,
      remediation: null,
    },
  });

  await appendTimeline(incident.id, "detected", `Incident ${incident.number} opened from ${event.type}.`, "Operations engine", event.id);
  await notifyOperators({
    title: incident.title,
    message: `${incident.number} opened on ${platform.name}.`,
    kind: "incident",
    incidentId: incident.id,
    href: `/incidents/${incident.id}`,
  });

  logger.info("Incident created", { number: incident.number, event: event.type });
  return incident;
}

export async function transitionIncident(
  incidentId: string,
  signal: "ack" | "mitigate" | "monitor" | "resolve",
  message: string,
  actor = "Operations engine",
) {
  const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new Error("Incident not found.");
  const status = nextIncidentStatus(incident.status, signal);
  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : incident.resolvedAt,
    },
  });
  await appendTimeline(incidentId, status.toLowerCase(), message, actor);
  if (status === "RESOLVED") {
    await notifyOperators({
      title: `${incident.number} resolved`,
      message,
      kind: "incident",
      incidentId,
      href: `/incidents/${incidentId}`,
    });
  }
  return updated;
}

export async function appendTimeline(
  incidentId: string,
  type: string,
  message: string,
  actor: string,
  platformEventId?: string,
) {
  return prisma.incidentEvent.create({
    data: { incidentId, type, message, actor, platformEventId },
  });
}

function titleHint(type: string) {
  if (type.includes("workflow")) return "workflow";
  if (type.includes("drift")) return "configuration";
  if (type.includes("webhook")) return "webhook";
  if (type.includes("sync")) return "synchronization";
  if (type.includes("latency")) return "latency";
  return "API";
}

function incidentTitle(platformName: string, event: PlatformEvent) {
  if (event.type.includes("workflow.failed")) return `${platformName} workflow failure`;
  if (event.type.includes("drift")) return `${platformName} configuration drift`;
  if (event.type.includes("webhook")) return `${platformName} webhook failure`;
  if (event.type.includes("sync")) return `${platformName} identity synchronization failure`;
  if (event.type.includes("latency")) return `${platformName} latency spike`;
  if (event.type.includes("outage") || event.type.includes("vendor.incident")) return `${platformName} vendor outage`;
  return `${platformName} API degradation`;
}

export async function getIncidentWithRelations(id: string) {
  return prisma.incident.findUnique({
    where: { id },
    include: {
      platform: true,
      owner: true,
      timeline: { orderBy: { timestamp: "asc" } },
      escalations: true,
    },
  });
}

export type { Incident };
