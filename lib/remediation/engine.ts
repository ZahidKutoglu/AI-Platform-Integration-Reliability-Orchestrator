import type { Incident, PlatformEvent } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getConnector } from "@/lib/connectors/registry";
import { appendTimeline, transitionIncident } from "@/lib/incidents/engine";
import { notifyOperators } from "@/lib/notifications/engine";
import { writeAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { asStringArray } from "@/lib/utils";

export type RemediationActionName =
  | "retry_api_request"
  | "restart_workflow"
  | "disable_affected_workflow"
  | "switch_fallback_platform"
  | "reconnect_integration"
  | "clear_failed_execution"
  | "notify_administrator"
  | "create_incident"
  | "create_vendor_escalation"
  | "health_check";

export type RemediationStep = {
  action: RemediationActionName;
  ok: boolean;
  message: string;
};

export function planRemediation(eventType: string): RemediationActionName[] {
  if (eventType.includes("workflow.failed")) {
    return ["restart_workflow", "clear_failed_execution", "health_check", "notify_administrator"];
  }
  if (eventType.includes("webhook")) {
    return ["reconnect_integration", "health_check", "notify_administrator"];
  }
  if (eventType.includes("drift")) {
    return ["notify_administrator"];
  }
  if (eventType.includes("sync")) {
    return ["reconnect_integration", "notify_administrator", "health_check"];
  }
  if (eventType.includes("outage") || eventType.includes("vendor.incident")) {
    return ["switch_fallback_platform", "notify_administrator", "create_vendor_escalation", "health_check"];
  }
  return ["retry_api_request", "notify_administrator", "health_check"];
}

export async function executeRemediationPlan(incidentId: string, event: PlatformEvent) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { platform: true, owner: true },
  });
  if (!incident) return [];

  await transitionIncident(incidentId, "ack", "Automated investigation started.", "Remediation engine");
  await transitionIncident(incidentId, "mitigate", "Executing configured remediation.", "Remediation engine");

  const steps: RemediationStep[] = [];
  const actions = planRemediation(event.type);

  for (const action of actions) {
    const step = await runAction(action, incident, event);
    steps.push(step);
    await appendTimeline(incidentId, "remediation", step.message, "Remediation engine");
    await writeAudit({
      actor: "Remediation engine",
      action: action,
      resource: incident.number,
      details: step,
    });
  }

  const health = await getConnector(incident.platform.slug).getHealth();
  const recovered = health.status === "OPERATIONAL" && health.errorRate <= incident.platform.sloErrorRate;

  if (recovered) {
    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        remediation: steps.map((s) => s.message).join(" "),
        rootCause: inferredCause(event.type),
      },
    });
    await transitionIncident(
      incidentId,
      "resolve",
      "Recovery confirmed by health check. Incident resolved automatically.",
      "Remediation engine",
    );
  } else {
    await transitionIncident(
      incidentId,
      "monitor",
      "Remediation applied. Monitoring vendor recovery.",
      "Remediation engine",
    );
    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        remediation: steps.map((s) => s.message).join(" "),
        rootCause: inferredCause(event.type),
      },
    });
  }

  logger.info("Remediation complete", { incident: incident.number, recovered, steps: steps.length });
  return steps;
}

async function runAction(
  action: RemediationActionName,
  incident: Incident & { platform: { slug: string; name: string } },
  event: PlatformEvent,
): Promise<RemediationStep> {
  const connector = getConnector(incident.platform.slug);
  const workflowSlug = asStringArray(incident.affectedWorkflows)[0]
    ? slugFromName(asStringArray(incident.affectedWorkflows)[0])
    : undefined;

  switch (action) {
    case "retry_api_request": {
      const result = await connector.executeAction({ type: "retry_request" });
      return { action, ok: result.ok, message: result.message };
    }
    case "restart_workflow": {
      if (!workflowSlug) return { action, ok: false, message: "No affected workflow to restart." };
      const result = await connector.executeAction({ type: "restart_workflow", workflowSlug });
      return { action, ok: result.ok, message: result.message };
    }
    case "disable_affected_workflow": {
      if (!workflowSlug) return { action, ok: false, message: "No affected workflow to disable." };
      const result = await connector.executeAction({ type: "disable_workflow", workflowSlug });
      return { action, ok: result.ok, message: result.message };
    }
    case "switch_fallback_platform": {
      const workflow = await prisma.workflow.findFirst({
        where: { platformId: incident.platformId, status: { not: "disabled" } },
      });
      if (!workflow) return { action, ok: true, message: "No workflow required fallback." };
      const fallback = workflow.fallbackSlug ?? "chatgpt";
      const result = await connector.executeAction({
        type: "switch_fallback",
        workflowSlug: workflow.slug,
        fallbackSlug: fallback,
      });
      return { action, ok: result.ok, message: result.message };
    }
    case "reconnect_integration": {
      const result = await connector.executeAction({ type: "reconnect" });
      return { action, ok: result.ok, message: result.message };
    }
    case "clear_failed_execution": {
      const result = await connector.executeAction({ type: "clear_failed_execution" });
      return { action, ok: result.ok, message: result.message };
    }
    case "notify_administrator": {
      await notifyOperators({
        title: `Remediation running for ${incident.number}`,
        message: event.title,
        kind: "remediation",
        incidentId: incident.id,
        href: `/incidents/${incident.id}`,
      });
      return { action, ok: true, message: "Administrator notified." };
    }
    case "create_incident":
      return { action, ok: true, message: `Incident ${incident.number} already active.` };
    case "create_vendor_escalation": {
      const existing = await prisma.vendorEscalation.findFirst({ where: { incidentId: incident.id } });
      if (existing) return { action, ok: true, message: `Escalation ${existing.number} already exists.` };
      await prisma.vendorEscalation.create({
        data: {
          number: `ESC-${incident.number.replace("INC-", "")}`,
          incidentId: incident.id,
          platformId: incident.platformId,
          status: "DRAFT",
          package: {
            generatedBy: "remediation-engine",
            reason: event.title,
          },
        },
      });
      return { action, ok: true, message: "Vendor escalation package drafted." };
    }
    case "health_check": {
      const health = await connector.getHealth();
      return {
        action,
        ok: health.status !== "OUTAGE",
        message: `Health check: ${health.status.toLowerCase()} (${health.errorRate.toFixed(2)}% errors, ${health.latencyMs} ms).`,
      };
    }
  }
}

function slugFromName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function inferredCause(type: string) {
  if (type.includes("workflow.failed")) return "Downstream workflow execution failed and required retry.";
  if (type.includes("drift")) return "Observed platform configuration diverged from the approved baseline.";
  if (type.includes("webhook")) return "Inbound webhook delivery failed.";
  if (type.includes("sync")) return "Identity provider synchronization did not complete.";
  if (type.includes("latency")) return "Vendor API latency exceeded the platform SLO.";
  if (type.includes("outage")) return "Vendor-side availability incident.";
  return "Elevated vendor API error rate.";
}
