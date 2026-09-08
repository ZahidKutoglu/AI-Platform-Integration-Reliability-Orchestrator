import { prisma } from "@/lib/db";
import { correlationId } from "@/lib/utils";
import type {
  ActionResult,
  ConnectionTestResult,
  ConnectorAction,
  HealthSnapshot,
  NormalizedConnectorEvent,
  PlatformConnector,
  PlatformUser,
  UsageSnapshot,
} from "@/lib/connectors/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export abstract class SimulatedConnector implements PlatformConnector {
  abstract slug: string;
  abstract vendor: string;

  protected async platform() {
    const platform = await prisma.platform.findUnique({ where: { slug: this.slug } });
    if (!platform) {
      throw new Error(`Platform ${this.slug} is not registered.`);
    }
    return platform;
  }

  async getHealth(): Promise<HealthSnapshot> {
    const platform = await this.platform();
    const latest = await prisma.platformHealth.findFirst({
      where: { platformId: platform.id },
      orderBy: { timestamp: "desc" },
    });

    return {
      status: platform.status,
      availability: latest?.availability ?? platform.uptimePercent,
      latencyMs: latest?.latencyMs ?? platform.latencyMs,
      errorRate: latest?.errorRate ?? platform.errorRate,
      workflowSuccessRate: latest?.workflowSuccessRate ?? 99.4,
      lastCheckedAt: new Date().toISOString(),
      checks: [
        {
          name: "API reachable",
          ok: platform.status !== "OUTAGE",
          detail: platform.status === "OUTAGE" ? "Vendor endpoint timed out" : "HTTP 200 from health endpoint",
        },
        {
          name: "Authentication valid",
          ok: platform.connectionStatus === "CONNECTED",
          detail:
            platform.connectionStatus === "CONNECTED"
              ? "Service credential accepted"
              : "Token refresh required",
        },
        {
          name: "Latency within threshold",
          ok: platform.latencyMs <= platform.sloLatencyMs,
          detail: `${platform.latencyMs} ms vs ${platform.sloLatencyMs} ms SLO`,
        },
        {
          name: "Error rate within threshold",
          ok: platform.errorRate <= platform.sloErrorRate,
          detail: `${platform.errorRate.toFixed(2)}% vs ${platform.sloErrorRate.toFixed(2)}% SLO`,
        },
      ],
    };
  }

  async getUsers(): Promise<PlatformUser[]> {
    const users = await prisma.user.findMany({ orderBy: { name: "asc" }, take: 12 });
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.name,
      role: user.role.toLowerCase(),
      lastActiveAt: user.updatedAt.toISOString(),
    }));
  }

  async getUsage(): Promise<UsageSnapshot> {
    const platform = await this.platform();
    const factor = this.slug === "chatgpt" ? 1.4 : this.slug === "claude" ? 1.1 : 0.6;
    return {
      requests24h: Math.round(18400 * factor),
      tokens24h: Math.round(42_800_000 * factor),
      activeUsers: platform.userCount,
      workflows: platform.workflowCount,
      errorBudgetRemaining: Math.max(0, platform.sloAvailability - (100 - platform.uptimePercent)),
    };
  }

  async getConfiguration(): Promise<Record<string, string>> {
    const platform = await this.platform();
    const snapshot = await prisma.configurationSnapshot.findFirst({
      where: { platformId: platform.id },
      orderBy: { observedAt: "desc" },
    });
    return (snapshot?.values as Record<string, string>) ?? {};
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const started = Date.now();
    await sleep(180 + Math.round(Math.random() * 220));
    const health = await this.getHealth();
    const latencyMs = Date.now() - started;
    const authenticated = health.checks.find((c) => c.name === "Authentication valid")?.ok ?? false;
    const reachable = health.checks.find((c) => c.name === "API reachable")?.ok ?? false;
    const ok = reachable && authenticated && health.status !== "OUTAGE";

    return {
      ok,
      latencyMs,
      authenticated,
      message: ok
        ? `${this.vendor} connection verified.`
        : `${this.vendor} connection test failed.`,
      checks: health.checks,
      testedAt: new Date().toISOString(),
    };
  }

  async getEvents(): Promise<NormalizedConnectorEvent[]> {
    const platform = await this.platform();
    const events = await prisma.platformEvent.findMany({
      where: { platformId: platform.id },
      orderBy: { timestamp: "desc" },
      take: 12,
    });
    return events.map((event) => ({
      type: event.type,
      title: event.title,
      severity: event.severity,
      payload: event.payload as Record<string, unknown>,
      occurredAt: event.timestamp.toISOString(),
      sourceEventId: event.id,
    }));
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    const platform = await this.platform();

    switch (action.type) {
      case "reconnect": {
        await prisma.platform.update({
          where: { id: platform.id },
          data: { connectionStatus: "CONNECTED", lastSyncAt: new Date() },
        });
        return { ok: true, action: action.type, message: `${platform.name} connector reconnected.` };
      }
      case "retry_request":
        return {
          ok: true,
          action: action.type,
          message: "Request retried against the vendor API.",
          details: { requestId: action.requestId ?? correlationId("req") },
        };
      case "restart_workflow": {
        const workflow = await prisma.workflow.findUnique({ where: { slug: action.workflowSlug } });
        if (!workflow) return { ok: false, action: action.type, message: "Workflow not found." };
        await prisma.workflow.update({
          where: { id: workflow.id },
          data: { status: "active" },
        });
        await prisma.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            status: "SUCCEEDED",
            completedAt: new Date(),
            durationMs: 940,
            attempt: 2,
          },
        });
        return { ok: true, action: action.type, message: `${workflow.name} restarted.` };
      }
      case "disable_workflow": {
        const workflow = await prisma.workflow.findUnique({ where: { slug: action.workflowSlug } });
        if (!workflow) return { ok: false, action: action.type, message: "Workflow not found." };
        await prisma.workflow.update({ where: { id: workflow.id }, data: { status: "disabled" } });
        return { ok: true, action: action.type, message: `${workflow.name} disabled.` };
      }
      case "switch_fallback": {
        const workflow = await prisma.workflow.findUnique({ where: { slug: action.workflowSlug } });
        if (!workflow) return { ok: false, action: action.type, message: "Workflow not found." };
        await prisma.workflow.update({
          where: { id: workflow.id },
          data: { fallbackSlug: action.fallbackSlug, status: "fallback" },
        });
        return {
          ok: true,
          action: action.type,
          message: `${workflow.name} switched to fallback ${action.fallbackSlug}.`,
        };
      }
      case "clear_failed_execution":
        return { ok: true, action: action.type, message: "Failed execution cleared from the queue." };
      case "sync_users": {
        await prisma.platform.update({
          where: { id: platform.id },
          data: { lastSyncAt: new Date() },
        });
        return { ok: true, action: action.type, message: "Directory synchronized." };
      }
      case "apply_configuration": {
        const snapshot = await prisma.configurationSnapshot.findFirst({
          where: { platformId: platform.id },
          orderBy: { observedAt: "desc" },
        });
        const values = {
          ...((snapshot?.values as Record<string, string>) ?? {}),
          [action.key]: action.value,
        };
        await prisma.configurationSnapshot.create({
          data: {
            platformId: platform.id,
            values,
            source: "remediation",
          },
        });
        return {
          ok: true,
          action: action.type,
          message: `Applied ${action.key}=${action.value}.`,
        };
      }
      default:
        return { ok: false, action: (action as ConnectorAction).type, message: "Unsupported action." };
    }
  }
}
