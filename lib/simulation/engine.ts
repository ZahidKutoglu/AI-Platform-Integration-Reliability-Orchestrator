import type { OperationalStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ingestEvent } from "@/lib/events/engine";
import { writeAudit } from "@/lib/audit";
import { notifyOperators } from "@/lib/notifications/engine";

export type SimulationKind =
  | "claude_outage"
  | "n8n_workflow_failure"
  | "chatgpt_latency"
  | "webhook_failure"
  | "configuration_drift"
  | "identity_sync_failure"
  | "vendor_outage"
  | "recovery";

type ScenarioEffect = {
  platformSlug: string;
  status: OperationalStatus;
  errorRate: number;
  latencyMs: number;
  uptimePercent: number;
  eventType: string;
  title: string;
  extra?: () => Promise<void>;
};

const scenarios: Record<Exclude<SimulationKind, "recovery">, ScenarioEffect> = {
  claude_outage: {
    platformSlug: "claude",
    status: "DEGRADED",
    errorRate: 18,
    latencyMs: 2400,
    uptimePercent: 97.1,
    eventType: "platform.api_error",
    title: "Claude API error rate increased above threshold",
  },
  n8n_workflow_failure: {
    platformSlug: "n8n",
    status: "DEGRADED",
    errorRate: 8.4,
    latencyMs: 980,
    uptimePercent: 98.1,
    eventType: "workflow.failed",
    title: "n8n workflow Platform Health Alert failed",
  },
  chatgpt_latency: {
    platformSlug: "chatgpt",
    status: "DEGRADED",
    errorRate: 1.1,
    latencyMs: 2100,
    uptimePercent: 99.72,
    eventType: "platform.latency_elevated",
    title: "ChatGPT Enterprise latency exceeded SLO",
  },
  webhook_failure: {
    platformSlug: "n8n",
    status: "DEGRADED",
    errorRate: 4.6,
    latencyMs: 860,
    uptimePercent: 98.4,
    eventType: "integration.webhook.failed",
    title: "Webhook delivery to n8n failed",
  },
  configuration_drift: {
    platformSlug: "chatgpt",
    status: "OPERATIONAL",
    errorRate: 0.18,
    latencyMs: 420,
    uptimePercent: 99.98,
    eventType: "configuration.drift_detected",
    title: "External sharing drifted from approved baseline",
    extra: async () => {
      const platform = await prisma.platform.findUniqueOrThrow({ where: { slug: "chatgpt" } });
      const snapshot = await prisma.configurationSnapshot.findFirst({
        where: { platformId: platform.id },
        orderBy: { observedAt: "desc" },
      });
      const values = {
        ...((snapshot?.values as Record<string, string>) ?? {}),
        external_sharing: "Enabled",
      };
      await prisma.configurationSnapshot.create({
        data: { platformId: platform.id, values, source: "simulation" },
      });
    },
  },
  identity_sync_failure: {
    platformSlug: "chatgpt",
    status: "DEGRADED",
    errorRate: 0.4,
    latencyMs: 640,
    uptimePercent: 99.9,
    eventType: "integration.sync.failed",
    title: "SCIM synchronization with Entra ID failed",
    extra: async () => {
      await prisma.integration.update({
        where: { slug: "entra" },
        data: { status: "DEGRADED", health: "DEGRADED" },
      });
    },
  },
  vendor_outage: {
    platformSlug: "replit",
    status: "OUTAGE",
    errorRate: 64,
    latencyMs: 8000,
    uptimePercent: 41.2,
    eventType: "vendor.incident_detected",
    title: "Replit vendor outage detected",
  },
};

export async function runSimulation(kind: SimulationKind) {
  if (kind === "recovery") {
    return recoverEnvironment();
  }

  const scenario = scenarios[kind];
  const platform = await prisma.platform.findUniqueOrThrow({ where: { slug: scenario.platformSlug } });

  await prisma.platform.update({
    where: { id: platform.id },
    data: {
      status: scenario.status,
      apiHealth: scenario.status,
      errorRate: scenario.errorRate,
      latencyMs: scenario.latencyMs,
      uptimePercent: scenario.uptimePercent,
      connectionStatus: scenario.status === "OUTAGE" ? "DISCONNECTED" : "DEGRADED",
    },
  });

  await prisma.platformHealth.create({
    data: {
      platformId: platform.id,
      availability: scenario.uptimePercent,
      latencyMs: scenario.latencyMs,
      errorRate: scenario.errorRate,
      workflowSuccessRate: scenario.status === "OPERATIONAL" ? 99.4 : 91.2,
    },
  });

  await scenario.extra?.();

  const event = await ingestEvent({
    type: scenario.eventType,
    title: scenario.title,
    platformSlug: platform.slug,
    source: "simulation",
    payload: { scenario: kind, errorRate: scenario.errorRate, latencyMs: scenario.latencyMs },
  });

  const state = await prisma.simulationState.upsert({
    where: { id: "demo" },
    update: { activeScenarios: [kind] },
    create: { id: "demo", activeScenarios: [kind] },
  });

  await writeAudit({
    actor: "Simulation Center",
    action: "simulate",
    resource: kind,
    details: { eventId: event.id },
  });

  await notifyOperators({
    title: "Simulation started",
    message: scenario.title,
    kind: "simulation",
    href: "/simulation",
  });

  return { ok: true, kind, eventId: event.id, state };
}

export async function recoverEnvironment() {
  const defaults: Record<string, { status: OperationalStatus; errorRate: number; latencyMs: number; uptime: number }> = {
    chatgpt: { status: "OPERATIONAL", errorRate: 0.18, latencyMs: 420, uptime: 99.98 },
    claude: { status: "OPERATIONAL", errorRate: 0.22, latencyMs: 380, uptime: 99.94 },
    replit: { status: "OPERATIONAL", errorRate: 0.31, latencyMs: 510, uptime: 99.91 },
    n8n: { status: "DEGRADED", errorRate: 1.28, latencyMs: 640, uptime: 98.72 },
  };

  for (const [slug, values] of Object.entries(defaults)) {
    await prisma.platform.update({
      where: { slug },
      data: {
        status: values.status,
        apiHealth: values.status,
        errorRate: values.errorRate,
        latencyMs: values.latencyMs,
        uptimePercent: values.uptime,
        connectionStatus: "CONNECTED",
      },
    });
  }

  await prisma.integration.updateMany({
    data: { status: "CONNECTED", health: "OPERATIONAL" },
  });
  await prisma.integration.update({
    where: { slug: "n8n" },
    data: { health: "DEGRADED", status: "DEGRADED" },
  });

  const chatgpt = await prisma.platform.findUniqueOrThrow({ where: { slug: "chatgpt" } });
  const snapshot = await prisma.configurationSnapshot.findFirst({
    where: { platformId: chatgpt.id },
    orderBy: { observedAt: "desc" },
  });
  const restored = {
    ...((snapshot?.values as Record<string, string>) ?? {}),
    external_sharing: "Disabled",
  };
  await prisma.configurationSnapshot.create({
    data: { platformId: chatgpt.id, values: restored, source: "recovery" },
  });

  const open = await prisma.incident.findMany({
    where: { status: { not: "RESOLVED" } },
  });
  for (const incident of open) {
    await prisma.incident.update({
      where: { id: incident.id },
      data: { status: "RESOLVED", resolvedAt: new Date(), remediation: "Environment recovered from Simulation Center." },
    });
    await prisma.incidentEvent.create({
      data: {
        incidentId: incident.id,
        type: "resolved",
        message: "Recovery simulation confirmed platform health.",
        actor: "Simulation Center",
      },
    });
  }

  await ingestEvent({
    type: "platform.health_changed",
    title: "Simulated recovery confirmed. Platforms returned to baseline.",
    source: "simulation",
    severity: "INFO",
    platformSlug: "claude",
  });

  await prisma.simulationState.upsert({
    where: { id: "demo" },
    update: { activeScenarios: [], lastResetAt: new Date() },
    create: { id: "demo", activeScenarios: [] },
  });

  await notifyOperators({
    title: "Environment recovered",
    message: "Simulation Center restored platform baselines.",
    kind: "simulation",
    href: "/",
  });

  return { ok: true, kind: "recovery" as const };
}

export async function resetEnvironment() {
  await recoverEnvironment();
  await prisma.simulationState.update({
    where: { id: "demo" },
    data: { lastResetAt: new Date(), activeScenarios: [] },
  });
  return { ok: true };
}
