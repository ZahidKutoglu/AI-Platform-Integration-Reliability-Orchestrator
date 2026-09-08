import { prisma } from "@/lib/db";
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
import { SimulatedConnector } from "@/lib/connectors/simulated";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ChatGPTConnector extends SimulatedConnector {
  slug = "chatgpt";
  vendor = "OpenAI";
}

export class ClaudeConnector extends SimulatedConnector {
  slug = "claude";
  vendor = "Anthropic";
}

export class ReplitConnector extends SimulatedConnector {
  slug = "replit";
  vendor = "Replit";
}

export class N8nConnector extends SimulatedConnector {
  slug = "n8n";
  vendor = "n8n";
}

class ServiceIntegrationConnector implements PlatformConnector {
  constructor(
    public slug: string,
    public vendor: string,
  ) {}

  private async integration() {
    const integration = await prisma.integration.findUnique({ where: { slug: this.slug } });
    if (!integration) throw new Error(`Integration ${this.slug} is not registered.`);
    return integration;
  }

  async getHealth(): Promise<HealthSnapshot> {
    const integration = await this.integration();
    const ok = integration.status === "CONNECTED" && integration.health === "OPERATIONAL";
    return {
      status: integration.health,
      availability: ok ? 99.97 : integration.health === "DEGRADED" ? 98.4 : 41.2,
      latencyMs: integration.apiLatencyMs,
      errorRate: ok ? 0.08 : 6.4,
      workflowSuccessRate: ok ? 99.9 : 91.2,
      lastCheckedAt: new Date().toISOString(),
      checks: [
        {
          name: "API reachable",
          ok: integration.health !== "OUTAGE",
          detail: integration.health === "OUTAGE" ? "Endpoint unreachable" : "Service responding",
        },
        {
          name: "Authentication valid",
          ok: integration.status === "CONNECTED",
          detail: integration.status === "CONNECTED" ? "Credential accepted" : "Reconnect required",
        },
        {
          name: "Latency within threshold",
          ok: integration.apiLatencyMs < 800,
          detail: `${integration.apiLatencyMs} ms`,
        },
        {
          name: "Error rate within threshold",
          ok: integration.health === "OPERATIONAL",
          detail: integration.health === "OPERATIONAL" ? "Within normal range" : "Elevated",
        },
      ],
    };
  }

  async getUsers(): Promise<PlatformUser[]> {
    const users = await prisma.user.findMany({ take: 8, orderBy: { name: "asc" } });
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.name,
      role: user.role.toLowerCase(),
      lastActiveAt: user.updatedAt.toISOString(),
    }));
  }

  async getUsage(): Promise<UsageSnapshot> {
    const integration = await this.integration();
    return {
      requests24h: integration.eventsReceived,
      tokens24h: 0,
      activeUsers: 18,
      workflows: 0,
      errorBudgetRemaining: 1.8,
    };
  }

  async getConfiguration(): Promise<Record<string, string>> {
    const integration = await this.integration();
    return (integration.configJson as Record<string, string>) ?? {};
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const started = Date.now();
    await sleep(140 + Math.round(Math.random() * 180));
    const health = await this.getHealth();
    const latencyMs = Date.now() - started;
    const authenticated = health.checks[1]?.ok ?? false;
    const ok = health.status === "OPERATIONAL" && authenticated;
    return {
      ok,
      latencyMs,
      authenticated,
      message: ok ? `${this.vendor} connection verified.` : `${this.vendor} connection test failed.`,
      checks: health.checks,
      testedAt: new Date().toISOString(),
    };
  }

  async getEvents(): Promise<NormalizedConnectorEvent[]> {
    const integration = await this.integration();
    const logs = await prisma.integrationLog.findMany({
      where: { integrationId: integration.id },
      orderBy: { timestamp: "desc" },
      take: 10,
    });
    return logs.map((log) => ({
      type: "integration.log",
      title: log.message,
      severity: log.level === "error" ? "HIGH" : log.level === "warn" ? "MEDIUM" : "INFO",
      payload: (log.details as Record<string, unknown>) ?? {},
      occurredAt: log.timestamp.toISOString(),
      sourceEventId: log.id,
    }));
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    const integration = await this.integration();
    if (action.type === "reconnect") {
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: "CONNECTED", health: "OPERATIONAL", lastSyncAt: new Date() },
      });
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          level: "info",
          message: `${integration.name} reconnected.`,
        },
      });
      return { ok: true, action: action.type, message: `${integration.name} reconnected.` };
    }
    if (action.type === "sync_users") {
      await prisma.integration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date(), eventsReceived: { increment: 1 } },
      });
      return { ok: true, action: action.type, message: "Directory synchronized." };
    }
    return { ok: true, action: action.type, message: `${this.vendor} action accepted.` };
  }
}

export class IdentityConnector extends ServiceIntegrationConnector {
  constructor() {
    super("entra", "Microsoft Entra ID");
  }
}

export class ServiceNowConnector extends ServiceIntegrationConnector {
  constructor() {
    super("servicenow", "ServiceNow");
  }
}

export class SlackConnector extends ServiceIntegrationConnector {
  constructor() {
    super("slack", "Slack");
  }
}
