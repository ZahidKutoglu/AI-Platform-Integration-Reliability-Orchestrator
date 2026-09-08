import { prisma } from "@/lib/db";
import { durationBetween, asStringArray } from "@/lib/utils";
import { writeAudit } from "@/lib/audit";

export async function buildEscalationPackage(incidentId: string) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      platform: { include: { healthSnapshots: { orderBy: { timestamp: "desc" }, take: 1 } } },
      owner: true,
      timeline: { orderBy: { timestamp: "asc" } },
    },
  });
  if (!incident) throw new Error("Incident not found.");

  const events = await prisma.platformEvent.findMany({
    where: { platformId: incident.platformId, timestamp: { gte: incident.detectedAt } },
    orderBy: { timestamp: "asc" },
    take: 20,
  });

  const health = incident.platform.healthSnapshots[0];

  return {
    generatedAt: new Date().toISOString(),
    incidentId: incident.number,
    platform: incident.platform.name,
    vendor: incident.platform.vendor,
    startTime: incident.detectedAt.toISOString(),
    duration: durationBetween(incident.detectedAt, incident.resolvedAt),
    affectedUsers: incident.affectedUsers,
    affectedWorkflows: asStringArray(incident.affectedWorkflows),
    errorRate: health?.errorRate ?? incident.platform.errorRate,
    latencyMs: health?.latencyMs ?? incident.platform.latencyMs,
    requestIds: events.map((e) => e.correlationId),
    logs: events.map((e) => ({
      timestamp: e.timestamp.toISOString(),
      type: e.type,
      title: e.title,
      severity: e.severity,
    })),
    internalInvestigation: incident.timeline.map((item) => ({
      timestamp: item.timestamp.toISOString(),
      actor: item.actor,
      message: item.message,
    })),
    currentImpact: incident.summary,
    owner: incident.owner?.name ?? "Unassigned",
    vendorStatus: incident.vendorStatus,
  };
}

export async function createVendorEscalation(incidentId: string, actor: string) {
  const incident = await prisma.incident.findUniqueOrThrow({
    where: { id: incidentId },
  });
  const pkg = await buildEscalationPackage(incidentId);
  const number = `ESC-${incident.number.replace("INC-", "")}`;
  const escalation = await prisma.vendorEscalation.upsert({
    where: { number },
    update: { package: pkg, status: "SENT" },
    create: {
      number,
      incidentId,
      platformId: incident.platformId,
      package: pkg,
      status: "SENT",
    },
  });
  await prisma.incident.update({
    where: { id: incidentId },
    data: { vendorStatus: "Escalated to vendor" },
  });
  await prisma.incidentEvent.create({
    data: {
      incidentId,
      type: "escalation",
      message: `Vendor escalation ${escalation.number} generated.`,
      actor,
    },
  });
  await writeAudit({ actor, action: "vendor.escalated", resource: escalation.number });
  return { escalation, package: pkg };
}
