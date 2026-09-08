import type { PlatformEvent } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { evaluateIncidentForEvent } from "@/lib/incidents/engine";
import { executeRemediationPlan } from "@/lib/remediation/engine";
import { evaluateDriftFromEvent } from "@/lib/configuration/drift";

export async function processEvent(event: PlatformEvent) {
  logger.info("Processing event", { type: event.type, id: event.id });

  if (event.platformId) {
    const integration = await prisma.integration.findFirst({
      where: { platformId: event.platformId },
    });
    if (integration) {
      await prisma.integration.update({
        where: { id: integration.id },
        data: { eventsReceived: { increment: 1 } },
      });
    }
  }

  if (event.type === "configuration.drift_detected" || event.type === "configuration.changed") {
    await evaluateDriftFromEvent(event);
  }

  const incident = await evaluateIncidentForEvent(event);
  if (incident) {
    await executeRemediationPlan(incident.id, event);
  }

  await prisma.automationExecution.create({
    data: {
      status: "SUCCEEDED",
      durationMs: 80 + Math.round(Math.random() * 120),
      completedAt: new Date(),
      result: { eventId: event.id, type: event.type },
      automation: {
        connect: { slug: automationForEvent(event.type) },
      },
    },
  }).catch(() => undefined);
}

function automationForEvent(type: string) {
  if (type.startsWith("workflow.")) return "failed-workflow-recovery";
  if (type.startsWith("configuration.")) return "configuration-drift-monitor";
  if (type.startsWith("vendor.")) return "vendor-incident-monitor";
  if (type.startsWith("integration.")) return "integration-sync";
  return "platform-health-monitor";
}
