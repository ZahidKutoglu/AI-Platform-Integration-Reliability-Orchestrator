import {
  PrismaClient,
  type IncidentStatus,
  type IncidentSeverity,
  type OperationalStatus,
  type Prisma,
  type Severity,
} from "@prisma/client";

const prisma = new PrismaClient();

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const hoursAgo = (hours: number) => minutesAgo(hours * 60);

export async function seedDatabase() {
  await prisma.automationExecution.deleteMany();
  await prisma.workflowExecution.deleteMany();
  await prisma.incidentEvent.deleteMany();
  await prisma.vendorEscalation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.configurationDrift.deleteMany();
  await prisma.configurationSnapshot.deleteMany();
  await prisma.configurationBaseline.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.platformEvent.deleteMany();
  await prisma.platformHealth.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.runbook.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.simulationState.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { email: "maya.chen@example.com", name: "Maya Chen", role: "ADMIN", department: "Platform Operations", title: "Head of AI Platform Operations" },
      { email: "jordan.hale@example.com", name: "Jordan Hale", role: "OPERATOR", department: "Platform Operations", title: "Reliability Engineer" },
      { email: "priya.nair@example.com", name: "Priya Nair", role: "OPERATOR", department: "Automation", title: "Workflow Engineer" },
      { email: "lucas.ortiz@example.com", name: "Lucas Ortiz", role: "OPERATOR", department: "Identity", title: "Identity Engineer" },
      { email: "elena.vasquez@example.com", name: "Elena Vasquez", role: "ADMIN", department: "Enterprise Architecture", title: "Platform Architect" },
      { email: "noah.kim@example.com", name: "Noah Kim", role: "VIEWER", department: "Finance", title: "FP&A Partner" },
      { email: "amelia.brooks@example.com", name: "Amelia Brooks", role: "OPERATOR", department: "Service Management", title: "Incident Commander" },
      { email: "theo.marc@example.com", name: "Theo Marc", role: "OPERATOR", department: "Developer Experience", title: "Replit Administrator" },
      { email: "hana.sato@example.com", name: "Hana Sato", role: "VIEWER", department: "Legal", title: "Technology Counsel" },
      { email: "owen.reid@example.com", name: "Owen Reid", role: "OPERATOR", department: "Integrations", title: "Integration Engineer" },
      { email: "sofia.alvarez@example.com", name: "Sofia Alvarez", role: "VIEWER", department: "People", title: "HR Operations" },
      { email: "caleb.nguyen@example.com", name: "Caleb Nguyen", role: "OPERATOR", department: "Platform Operations", title: "On-call Engineer" },
      { email: "isla.berg@example.com", name: "Isla Berg", role: "VIEWER", department: "Communications", title: "Internal Comms Lead" },
      { email: "marcus.dell@example.com", name: "Marcus Dell", role: "OPERATOR", department: "Automation", title: "n8n Administrator" },
      { email: "ravi.kapoor@example.com", name: "Ravi Kapoor", role: "VIEWER", department: "Risk", title: "Operational Risk Analyst" },
    ],
  });
  const users = await prisma.user.findMany();

  const maya = users.find((u) => u.email.startsWith("maya"))!;
  const jordan = users.find((u) => u.email.startsWith("jordan"))!;
  const priya = users.find((u) => u.email.startsWith("priya"))!;

  const chatgpt = await prisma.platform.create({
    data: {
      slug: "chatgpt",
      name: "ChatGPT Enterprise",
      vendor: "OpenAI",
      description: "Enterprise assistant platform used across knowledge work and customer operations.",
      connectorKey: "chatgpt",
      status: "OPERATIONAL",
      connectionStatus: "CONNECTED",
      apiHealth: "OPERATIONAL",
      latencyMs: 420,
      errorRate: 0.18,
      uptimePercent: 99.98,
      lastSyncAt: minutesAgo(14),
      workflowCount: 6,
      userCount: 1840,
      configurationStatus: "Aligned",
      sloAvailability: 99.95,
      sloLatencyMs: 800,
      sloErrorRate: 1,
    },
  });

  const claude = await prisma.platform.create({
    data: {
      slug: "claude",
      name: "Claude",
      vendor: "Anthropic",
      description: "Reasoning and document analysis platform for research, legal, and risk teams.",
      connectorKey: "claude",
      status: "OPERATIONAL",
      connectionStatus: "CONNECTED",
      apiHealth: "OPERATIONAL",
      latencyMs: 380,
      errorRate: 0.22,
      uptimePercent: 99.94,
      lastSyncAt: minutesAgo(9),
      workflowCount: 4,
      userCount: 960,
      configurationStatus: "Aligned",
      sloAvailability: 99.9,
      sloLatencyMs: 900,
      sloErrorRate: 1.2,
    },
  });

  const replit = await prisma.platform.create({
    data: {
      slug: "replit",
      name: "Replit",
      vendor: "Replit",
      description: "Hosted development and agent environment for internal application teams.",
      connectorKey: "replit",
      status: "OPERATIONAL",
      connectionStatus: "CONNECTED",
      apiHealth: "OPERATIONAL",
      latencyMs: 510,
      errorRate: 0.31,
      uptimePercent: 99.91,
      lastSyncAt: minutesAgo(22),
      workflowCount: 3,
      userCount: 210,
      configurationStatus: "Aligned",
      sloAvailability: 99.8,
      sloLatencyMs: 1000,
      sloErrorRate: 1.5,
    },
  });

  const n8n = await prisma.platform.create({
    data: {
      slug: "n8n",
      name: "n8n",
      vendor: "n8n",
      description: "Automation fabric for health alerts, recovery, and change notifications.",
      connectorKey: "n8n",
      status: "DEGRADED",
      connectionStatus: "CONNECTED",
      apiHealth: "DEGRADED",
      latencyMs: 640,
      errorRate: 1.28,
      uptimePercent: 98.72,
      lastSyncAt: minutesAgo(4),
      workflowCount: 8,
      userCount: 36,
      configurationStatus: "Review required",
      sloAvailability: 99.5,
      sloLatencyMs: 700,
      sloErrorRate: 0.8,
    },
  });

  async function healthSeries(platformId: string, base: { a: number; l: number; e: number; w: number }, wobble = 0.04) {
    const points = [];
    for (let i = 24; i >= 0; i--) {
      points.push({
        platformId,
        timestamp: hoursAgo(i),
        availability: Number((base.a - Math.sin(i / 3) * wobble).toFixed(3)),
        latencyMs: Math.round(base.l + Math.cos(i / 2) * 40),
        errorRate: Number(Math.max(0.05, base.e + Math.sin(i / 4) * 0.12).toFixed(3)),
        workflowSuccessRate: Number((base.w - Math.abs(Math.sin(i / 5)) * 0.3).toFixed(3)),
      });
    }
    await prisma.platformHealth.createMany({ data: points });
  }

  await healthSeries(chatgpt.id, { a: 99.98, l: 420, e: 0.18, w: 99.7 });
  await healthSeries(claude.id, { a: 99.94, l: 380, e: 0.22, w: 99.6 });
  await healthSeries(replit.id, { a: 99.91, l: 510, e: 0.31, w: 99.5 });
  await healthSeries(n8n.id, { a: 98.72, l: 640, e: 1.28, w: 98.72 }, 0.35);

  await prisma.integration.createMany({
    data: [
      { slug: "chatgpt", name: "ChatGPT Enterprise", kind: "AI_PLATFORM", platformId: chatgpt.id, status: "CONNECTED", health: "OPERATIONAL", lastSyncAt: minutesAgo(14), eventsReceived: 12840, apiLatencyMs: 420, configJson: { region: "us-east", workspace: "enterprise-chatgpt" } },
      { slug: "claude", name: "Claude", kind: "AI_PLATFORM", platformId: claude.id, status: "CONNECTED", health: "OPERATIONAL", lastSyncAt: minutesAgo(9), eventsReceived: 7420, apiLatencyMs: 380, configJson: { workspace: "enterprise-claude" } },
      { slug: "replit", name: "Replit", kind: "AI_PLATFORM", platformId: replit.id, status: "CONNECTED", health: "OPERATIONAL", lastSyncAt: minutesAgo(22), eventsReceived: 1960, apiLatencyMs: 510, configJson: { team: "platform-builders" } },
      { slug: "n8n", name: "n8n", kind: "AUTOMATION", platformId: n8n.id, status: "DEGRADED", health: "DEGRADED", lastSyncAt: minutesAgo(4), eventsReceived: 22110, apiLatencyMs: 640, configJson: { instance: "https://n8n.internal" } },
      { slug: "entra", name: "Identity Provider", kind: "IDENTITY", status: "CONNECTED", health: "OPERATIONAL", lastSyncAt: minutesAgo(31), eventsReceived: 540, apiLatencyMs: 210, configJson: { tenant: "contoso.example.com", protocol: "SCIM" } },
      { slug: "servicenow", name: "ServiceNow", kind: "TICKETING", status: "CONNECTED", health: "OPERATIONAL", lastSyncAt: minutesAgo(18), eventsReceived: 880, apiLatencyMs: 290, configJson: { table: "incident", instance: "example.service-now.com" } },
      { slug: "slack", name: "Slack", kind: "NOTIFICATIONS", status: "CONNECTED", health: "OPERATIONAL", lastSyncAt: minutesAgo(3), eventsReceived: 4120, apiLatencyMs: 120, configJson: { channel: "#ai-operations" } },
    ],
  });
  const integrations = await prisma.integration.findMany();

  for (const integration of integrations) {
    await prisma.integrationLog.createMany({
      data: [
        { integrationId: integration.id, timestamp: minutesAgo(40), level: "info", message: `${integration.name} connector synchronized.` },
        { integrationId: integration.id, timestamp: minutesAgo(12), level: integration.health === "DEGRADED" ? "warn" : "info", message: integration.health === "DEGRADED" ? "Workflow success dipped below SLO." : "Heartbeat accepted." },
      ],
    });
  }

  const workflowDefs = [
    { slug: "research-briefing", name: "Research briefing", platformId: claude.id, kind: "assistant", status: "active", description: "Drafts investment research briefs from approved corpora.", trigger: "Schedule · 06:00 ET", fallbackSlug: "chatgpt" },
    { slug: "contract-review", name: "Contract review", platformId: claude.id, kind: "assistant", status: "active", description: "Summarizes third-party paper for legal operations.", trigger: "ServiceNow catalog", fallbackSlug: "chatgpt" },
    { slug: "customer-summary", name: "Customer summary", platformId: chatgpt.id, kind: "assistant", status: "active", description: "Produces account summaries for relationship managers.", trigger: "CRM webhook", fallbackSlug: "claude" },
    { slug: "knowledge-search", name: "Knowledge search", platformId: chatgpt.id, kind: "assistant", status: "active", description: "Enterprise search over the approved knowledge base.", trigger: "User request", fallbackSlug: "claude" },
    { slug: "internal-app-agent", name: "Internal app agent", platformId: replit.id, kind: "development", status: "active", description: "Builds and previews internal tools in Replit.", trigger: "Developer command", fallbackSlug: "chatgpt" },
    { slug: "platform-health-alert", name: "Platform Health Alert", platformId: n8n.id, kind: "automation", status: "active", description: "Evaluates health thresholds and opens incidents.", trigger: "Health check schedule", n8nWorkflowId: "wf_health_alert", fallbackSlug: "slack" },
    { slug: "failed-workflow-recovery", name: "Failed Workflow Recovery", platformId: n8n.id, kind: "automation", status: "active", description: "Retries failed automations and verifies recovery.", trigger: "workflow.failed event", n8nWorkflowId: "wf_recovery", fallbackSlug: "servicenow" },
    { slug: "configuration-drift", name: "Configuration Drift", platformId: n8n.id, kind: "automation", status: "degraded", description: "Creates a change request when configuration drifts.", trigger: "configuration.drift_detected", n8nWorkflowId: "wf_drift", fallbackSlug: "servicenow" },
    { slug: "vendor-incident-monitor", name: "Vendor incident monitor", platformId: n8n.id, kind: "automation", status: "active", description: "Watches vendor status and drafts escalations.", trigger: "vendor.incident_detected", fallbackSlug: "servicenow" },
    { slug: "integration-sync", name: "Integration sync", platformId: n8n.id, kind: "automation", status: "active", description: "Synchronizes users, webhooks, and usage APIs.", trigger: "Every 15 minutes", fallbackSlug: "entra" },
  ];

  const workflows = [];
  for (const def of workflowDefs) {
    workflows.push(await prisma.workflow.create({ data: def }));
  }

  for (const workflow of workflows) {
    const executions = [];
    for (let i = 0; i < 8; i++) {
      const failed = workflow.slug === "configuration-drift" && i < 2;
      executions.push({
        workflowId: workflow.id,
        startedAt: minutesAgo(30 + i * 80),
        completedAt: minutesAgo(29 + i * 80),
        status: failed ? "FAILED" : i === 0 && workflow.platformId === n8n.id ? "RETRIED" : "SUCCEEDED",
        durationMs: 700 + i * 40,
        attempt: failed ? 1 : 1,
        error: failed ? "Webhook acknowledgement missing" : null,
      } satisfies Prisma.WorkflowExecutionCreateManyInput);
    }
    await prisma.workflowExecution.createMany({ data: executions });
  }

  const eventSeed: Array<{
    minutes: number;
    platformId: string;
    type: string;
    title: string;
    severity: Severity;
  }> = [
    { minutes: 4, platformId: claude.id, type: "platform.health_changed", title: "Claude health check passed", severity: "INFO" },
    { minutes: 6, platformId: n8n.id, type: "workflow.completed", title: "n8n workflow automatically retried", severity: "MEDIUM" },
    { minutes: 10, platformId: chatgpt.id, type: "configuration.drift_detected", title: "Configuration drift detected", severity: "HIGH" },
    { minutes: 16, platformId: chatgpt.id, type: "integration.sync.completed", title: "ChatGPT connector synchronized", severity: "INFO" },
    { minutes: 28, platformId: n8n.id, type: "workflow.failed", title: "n8n workflow execution failed", severity: "HIGH" },
    { minutes: 41, platformId: chatgpt.id, type: "platform.health_changed", title: "Slack notification delivered for n8n retry", severity: "INFO" },
    { minutes: 55, platformId: claude.id, type: "platform.api_error", title: "Claude API briefly elevated error rate", severity: "MEDIUM" },
    { minutes: 80, platformId: replit.id, type: "user_sync_completed", title: "Replit user directory synchronized", severity: "INFO" },
    { minutes: 110, platformId: chatgpt.id, type: "workflow.completed", title: "Knowledge search workflow completed", severity: "INFO" },
    { minutes: 140, platformId: n8n.id, type: "integration.disconnected", title: "n8n webhook listener restarted", severity: "MEDIUM" },
    { minutes: 180, platformId: claude.id, type: "workflow.completed", title: "Contract review workflow completed", severity: "INFO" },
    { minutes: 220, platformId: chatgpt.id, type: "platform.health_changed", title: "ChatGPT API health check passed", severity: "INFO" },
    { minutes: 260, platformId: chatgpt.id, type: "user_sync_completed", title: "Entra ID SCIM sync completed", severity: "INFO" },
    { minutes: 310, platformId: n8n.id, type: "workflow.completed", title: "Integration sync automation completed", severity: "INFO" },
    { minutes: 360, platformId: replit.id, type: "platform.health_changed", title: "Replit agent runtime healthy", severity: "INFO" },
    { minutes: 420, platformId: claude.id, type: "configuration.changed", title: "Claude retention setting verified", severity: "INFO" },
    { minutes: 480, platformId: chatgpt.id, type: "workflow.completed", title: "Customer summary batch completed", severity: "INFO" },
    { minutes: 540, platformId: n8n.id, type: "vendor.incident_detected", title: "n8n cloud status reported degraded performance", severity: "HIGH" },
    { minutes: 600, platformId: claude.id, type: "platform.health_changed", title: "Claude availability recovered", severity: "INFO" },
    { minutes: 720, platformId: chatgpt.id, type: "platform.health_changed", title: "ChatGPT usage API synchronized", severity: "INFO" },
    { minutes: 840, platformId: replit.id, type: "workflow.completed", title: "Internal app agent preview published", severity: "INFO" },
    { minutes: 960, platformId: n8n.id, type: "workflow.completed", title: "Platform Health Alert executed", severity: "INFO" },
    { minutes: 1100, platformId: chatgpt.id, type: "configuration.changed", title: "SSO requirement confirmed", severity: "INFO" },
    { minutes: 1260, platformId: claude.id, type: "user_sync_completed", title: "Claude SCIM users refreshed", severity: "INFO" },
  ];

  // Fix dummy entra/slack references - those aren't platforms
  const events = [];
  for (const item of eventSeed) {
    events.push(
      await prisma.platformEvent.create({
        data: {
          timestamp: minutesAgo(item.minutes),
          platformId: item.platformId,
          type: item.type,
          title: item.title,
          severity: item.severity,
          payload: { seeded: true },
          correlationId: `corr_${item.minutes}`,
          processingStatus: "PROCESSED",
          source: "seed",
        },
      }),
    );
  }

  const incidentSpecs: Array<{
    number: string;
    title: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    platformId: string;
    minutes: number;
    resolved?: number;
    ownerId: string;
    workflows: string[];
    users: number;
    rootCause: string;
    remediation: string;
    vendorStatus: string;
    summary: string;
    timeline: Array<{ minutes: number; type: string; message: string; actor: string }>;
  }> = [
    {
      number: "INC-00421",
      title: "Claude API degradation",
      severity: "P2",
      status: "INVESTIGATING",
      platformId: claude.id,
      minutes: 86,
      ownerId: jordan.id,
      workflows: ["Research briefing", "Contract review"],
      users: 140,
      rootCause: "Elevated 5xx responses from the Messages API.",
      remediation: "Retries in progress. Fallback to ChatGPT prepared.",
      vendorStatus: "Watching vendor status",
      summary: "Claude error rate briefly crossed the investigation threshold.",
      timeline: [
        { minutes: 86, type: "detected", message: "Error rate crossed 2.4%.", actor: "Operations engine" },
        { minutes: 82, type: "investigating", message: "Jordan Hale acknowledged the incident.", actor: "Jordan Hale" },
        { minutes: 70, type: "remediation", message: "Automated retries enabled for research briefing.", actor: "Remediation engine" },
      ],
    },
    {
      number: "INC-00422",
      title: "n8n workflow failure",
      severity: "P3",
      status: "MONITORING",
      platformId: n8n.id,
      minutes: 48,
      ownerId: priya.id,
      workflows: ["Platform Health Alert", "Configuration Drift"],
      users: 36,
      rootCause: "Webhook acknowledgement timeout from the operations API.",
      remediation: "Workflow retried automatically. Monitoring success rate.",
      vendorStatus: "Not escalated",
      summary: "A scheduled automation failed and was retried.",
      timeline: [
        { minutes: 48, type: "detected", message: "Execution wf_4821 failed.", actor: "Operations engine" },
        { minutes: 44, type: "mitigating", message: "Automatic retry dispatched.", actor: "Remediation engine" },
        { minutes: 18, type: "monitoring", message: "Subsequent execution succeeded.", actor: "Operations engine" },
      ],
    },
    {
      number: "INC-00418",
      title: "ChatGPT latency spike",
      severity: "P3",
      status: "RESOLVED",
      platformId: chatgpt.id,
      minutes: 60 * 26,
      resolved: 60 * 25,
      ownerId: maya.id,
      workflows: ["Customer summary"],
      users: 220,
      rootCause: "Regional capacity event at the vendor.",
      remediation: "Traffic shaped until latency returned below 800 ms.",
      vendorStatus: "Closed",
      summary: "Latency exceeded SLO for 38 minutes.",
      timeline: [
        { minutes: 60 * 26, type: "detected", message: "p95 latency 1.9s.", actor: "Operations engine" },
        { minutes: 60 * 25, type: "resolved", message: "Latency returned to 410 ms.", actor: "Maya Chen" },
      ],
    },
    {
      number: "INC-00415",
      title: "SCIM synchronization delay",
      severity: "P4",
      status: "RESOLVED",
      platformId: chatgpt.id,
      minutes: 60 * 54,
      resolved: 60 * 52,
      ownerId: users.find((u) => u.email.startsWith("lucas"))!.id,
      workflows: ["Integration sync"],
      users: 18,
      rootCause: "Identity provider pagination token expired.",
      remediation: "Token refreshed and directory re-synchronized.",
      vendorStatus: "Not required",
      summary: "New joiners were delayed in ChatGPT Enterprise by 90 minutes.",
      timeline: [
        { minutes: 60 * 54, type: "detected", message: "SCIM job exceeded duration SLO.", actor: "Operations engine" },
        { minutes: 60 * 52, type: "resolved", message: "Directory catch-up completed.", actor: "Lucas Ortiz" },
      ],
    },
    {
      number: "INC-00409",
      title: "Replit agent runtime interruption",
      severity: "P2",
      status: "RESOLVED",
      platformId: replit.id,
      minutes: 60 * 80,
      resolved: 60 * 78,
      ownerId: users.find((u) => u.email.startsWith("theo"))!.id,
      workflows: ["Internal app agent"],
      users: 42,
      rootCause: "Vendor compute pool recycle.",
      remediation: "Workspaces restarted; in-flight previews republished.",
      vendorStatus: "Vendor confirmed",
      summary: "Hosted runtimes were unavailable for 17 minutes.",
      timeline: [
        { minutes: 60 * 80, type: "detected", message: "Runtime health check failed.", actor: "Operations engine" },
        { minutes: 60 * 78, type: "resolved", message: "All workspaces recovered.", actor: "Theo Marc" },
      ],
    },
  ];

  for (const spec of incidentSpecs) {
    const incident = await prisma.incident.create({
      data: {
        number: spec.number,
        title: spec.title,
        severity: spec.severity,
        status: spec.status,
        platformId: spec.platformId,
        affectedWorkflows: spec.workflows,
        affectedUsers: spec.users,
        detectedAt: minutesAgo(spec.minutes),
        resolvedAt: spec.resolved ? minutesAgo(spec.resolved) : null,
        ownerId: spec.ownerId,
        rootCause: spec.rootCause,
        remediation: spec.remediation,
        vendorStatus: spec.vendorStatus,
        summary: spec.summary,
      },
    });
    for (const item of spec.timeline) {
      await prisma.incidentEvent.create({
        data: {
          incidentId: incident.id,
          timestamp: minutesAgo(item.minutes),
          type: item.type,
          message: item.message,
          actor: item.actor,
        },
      });
    }
  }

  const chatgptIncident = await prisma.incident.findUniqueOrThrow({ where: { number: "INC-00418" } });
  await prisma.vendorEscalation.create({
    data: {
      number: "ESC-00418",
      incidentId: chatgptIncident.id,
      platformId: chatgpt.id,
      status: "CLOSED",
      package: {
        incidentId: "INC-00418",
        platform: "ChatGPT Enterprise",
        startTime: daysAgo(1).toISOString(),
        duration: "38m",
        affectedUsers: 220,
        errorRate: 0.9,
        latency: 1900,
        affectedWorkflows: ["Customer summary"],
        currentImpact: "Resolved",
      },
    },
  });

  const configSets: Array<{
    platformId: string;
    values: Record<string, string>;
    drifted?: Record<string, string>;
  }> = [
    {
      platformId: chatgpt.id,
      values: {
        sso: "Required",
        mfa: "Required",
        external_sharing: "Disabled",
        api_access: "Restricted",
        retention: "Approved",
        audit_logging: "Enabled",
      },
      drifted: { external_sharing: "Enabled" },
    },
    {
      platformId: claude.id,
      values: {
        sso: "Required",
        mfa: "Required",
        workspace_sharing: "Internal only",
        api_access: "Restricted",
        retention: "Approved",
        audit_logging: "Enabled",
      },
    },
    {
      platformId: replit.id,
      values: {
        sso: "Required",
        mfa: "Required",
        public_repls: "Disabled",
        secrets_access: "Vault only",
        retention: "Approved",
        audit_logging: "Enabled",
      },
    },
    {
      platformId: n8n.id,
      values: {
        sso: "Required",
        mfa: "Required",
        public_workflows: "Disabled",
        webhook_auth: "Required",
        retention: "Approved",
        audit_logging: "Enabled",
      },
    },
  ];

  const labels: Record<string, string> = {
    sso: "SSO",
    mfa: "MFA",
    external_sharing: "External sharing",
    api_access: "API access",
    retention: "Retention",
    audit_logging: "Audit logging",
    workspace_sharing: "Workspace sharing",
    public_repls: "Public repls",
    secrets_access: "Secrets access",
    public_workflows: "Public workflows",
    webhook_auth: "Webhook authentication",
  };

  for (const set of configSets) {
    for (const [key, expectedValue] of Object.entries(set.values)) {
      await prisma.configurationBaseline.create({
        data: {
          platformId: set.platformId,
          key,
          label: labels[key] ?? key,
          expectedValue,
          category: key.includes("sso") || key.includes("mfa") ? "Identity" : "Platform",
        },
      });
    }
    await prisma.configurationSnapshot.create({
      data: {
        platformId: set.platformId,
        observedAt: minutesAgo(20),
        values: { ...set.values, ...(set.drifted ?? {}) },
        source: "connector",
      },
    });
    if (set.drifted) {
      for (const [key, observedValue] of Object.entries(set.drifted)) {
        await prisma.configurationDrift.create({
          data: {
            platformId: set.platformId,
            key,
            label: labels[key] ?? key,
            expectedValue: set.values[key],
            observedValue,
            severity: "HIGH",
            status: "OPEN",
            detectedAt: minutesAgo(10),
          },
        });
      }
    }
  }

  await prisma.changeRequest.createMany({
    data: [
      {
        number: "CHG-00291",
        title: "Enable API access for analytics integration",
        status: "PENDING_APPROVAL",
        requestedById: maya.id,
        platformId: chatgpt.id,
        risk: "Medium",
        proposedChange: "Enable usage API for the analytics integration while keeping write APIs restricted.",
      },
      {
        number: "CHG-00288",
        title: "Tighten n8n webhook authentication",
        status: "VERIFIED",
        requestedById: priya.id,
        platformId: n8n.id,
        risk: "Low",
        proposedChange: "Require signed webhooks for all inbound automations.",
        executedAt: hoursAgo(30),
        verifiedAt: hoursAgo(29),
        result: "Webhook signatures verified on three sample deliveries.",
      },
      {
        number: "CHG-00284",
        title: "Disable public Replit previews in production team",
        status: "APPROVED",
        requestedById: users.find((u) => u.email.startsWith("theo"))!.id,
        platformId: replit.id,
        risk: "Low",
        proposedChange: "Keep public repls disabled for the production team workspace.",
      },
    ],
  });

  const runbooks = [
    {
      slug: "claude-api-degradation",
      title: "Claude API degradation",
      platformId: claude.id,
      summary: "Respond when Claude availability or error rate leaves the SLO.",
      symptoms: ["Elevated 5xx rate", "Latency above 900 ms", "Workflow retries increasing"],
      detection: "Platform Health Monitor evaluates Claude connector metrics every 60 seconds.",
      automatedRemediation: ["Retry API request", "Notify administrator", "Open incident if threshold persists"],
      manualRemediation: ["Shift research briefing to ChatGPT fallback", "Confirm vendor status page"],
      escalationCriteria: ["P2 for more than 15 minutes", "Customer-facing workflow impacted"],
      recoveryVerification: ["Error rate below 1.2%", "Health check passing"],
      postIncidentSteps: ["Update reliability notes", "Review retry budget"],
      initialChecks: ["API reachable", "Authentication valid", "Error rate"],
      diagnosticSteps: ["Compare current error rate to SLO", "Inspect affected workflows", "Review recent deploys"],
    },
    {
      slug: "n8n-workflow-failures",
      title: "n8n workflow failures",
      platformId: n8n.id,
      summary: "Recover failed automations and prevent duplicate side effects.",
      symptoms: ["Execution status Failed", "Webhook 4xx/5xx", "Success rate below 99.5%"],
      detection: "workflow.failed events from the n8n connector.",
      automatedRemediation: ["Restart workflow", "Clear failed execution", "Verify subsequent run"],
      manualRemediation: ["Inspect node output", "Replay with reduced concurrency"],
      escalationCriteria: ["Three consecutive failures", "Change request workflow blocked"],
      recoveryVerification: ["Latest execution succeeded", "No backlog in the queue"],
      postIncidentSteps: ["Attach execution IDs to the incident", "Tune retry policy if needed"],
      initialChecks: ["n8n API reachable", "Webhook auth", "Queue depth"],
      diagnosticSteps: ["Open the failed execution", "Confirm downstream acknowledgement", "Retry once"],
    },
    {
      slug: "chatgpt-api-outage",
      title: "ChatGPT API outage",
      platformId: chatgpt.id,
      summary: "Operate through an OpenAI availability incident.",
      symptoms: ["Health check timeout", "Connection errors", "User-facing assistant unavailable"],
      detection: "ChatGPT connector health plus vendor incident monitor.",
      automatedRemediation: ["Switch workflow to fallback platform", "Notify administrator", "Draft vendor escalation"],
      manualRemediation: ["Hold non-critical batch jobs", "Post to #ai-operations"],
      escalationCriteria: ["OUTAGE status", "Customer operations impacted"],
      recoveryVerification: ["Availability above 99.95%", "Test connection succeeds"],
      postIncidentSteps: ["Close vendor escalation", "Restore paused workflows"],
      initialChecks: ["API reachable", "Authentication valid", "Latency"],
      diagnosticSteps: ["Confirm vendor status", "Sample a test completion", "Check fallback workflows"],
    },
    {
      slug: "scim-synchronization-failure",
      title: "SCIM synchronization failure",
      platformId: chatgpt.id,
      summary: "Restore identity propagation from Entra ID.",
      symptoms: ["Joiners missing from a platform", "SCIM job duration exceeded", "401 on directory connector"],
      detection: "integration.sync.failed from the identity connector.",
      automatedRemediation: ["Reconnect integration", "Retry directory sync"],
      manualRemediation: ["Refresh client secret", "Replay SCIM pagination"],
      escalationCriteria: ["Access blocked for more than 1 hour"],
      recoveryVerification: ["Last sync timestamp current", "Sample user present"],
      postIncidentSteps: ["Rotate secret if it was the cause", "Update the identity runbook"],
      initialChecks: ["Entra reachable", "Token valid", "SCIM schema"],
      diagnosticSteps: ["Inspect last sync error", "Test a single user GET", "Run full sync"],
    },
    {
      slug: "configuration-drift",
      title: "Configuration drift",
      platformId: chatgpt.id,
      summary: "Return drifted settings to the approved baseline.",
      symptoms: ["Drift record OPEN", "Unexpected sharing or API access"],
      detection: "Configuration Drift Monitor compares snapshots to baselines.",
      automatedRemediation: ["Notify administrator", "Open change request"],
      manualRemediation: ["Review, approve, or remediate the key"],
      escalationCriteria: ["High-severity identity or sharing drift"],
      recoveryVerification: ["Observed value matches baseline", "Drift record remediated"],
      postIncidentSteps: ["Record the audit event", "Confirm no related incidents remain"],
      initialChecks: ["Latest snapshot age", "Baseline present", "Drift severity"],
      diagnosticSteps: ["Diff expected vs observed", "Identify who changed it", "Remediate or accept"],
    },
    {
      slug: "integration-authentication-failure",
      title: "Integration authentication failure",
      summary: "Reconnect a platform when a service credential fails.",
      symptoms: ["Connection status Disconnected", "401/403 from connector", "Sync stopped"],
      detection: "Connector testConnection reports authentication invalid.",
      automatedRemediation: ["Reconnect integration", "Notify administrator"],
      manualRemediation: ["Rotate the credential in the vendor console", "Update connector secrets"],
      escalationCriteria: ["Production traffic blocked"],
      recoveryVerification: ["Test connection succeeds", "Events resume"],
      postIncidentSteps: ["Document rotation", "Check remaining connectors"],
      initialChecks: ["Credential present", "Clock skew", "Vendor auth endpoint"],
      diagnosticSteps: ["Test connection", "Inspect last auth error", "Reconnect"],
    },
    {
      slug: "webhook-failure",
      title: "Webhook failure",
      platformId: n8n.id,
      summary: "Restore signed webhook delivery between the operations API and n8n.",
      symptoms: ["Delivery 5xx", "Signature mismatch", "Missing acknowledgements"],
      detection: "integration.webhook.failed events.",
      automatedRemediation: ["Reconnect integration", "Retry delivery"],
      manualRemediation: ["Verify WEBHOOK_SECRET", "Replay the payload"],
      escalationCriteria: ["Health alerts not reaching operators"],
      recoveryVerification: ["Test webhook 200", "Automation execution recorded"],
      postIncidentSteps: ["Rotate signing secret if leaked", "Confirm n8n workflow active"],
      initialChecks: ["Signing secret configured", "n8n reachable", "Recent deliveries"],
      diagnosticSteps: ["Send a signed test webhook", "Inspect n8n execution", "Confirm incident creation"],
    },
  ];

  for (const runbook of runbooks) {
    await prisma.runbook.create({ data: runbook });
  }

  await prisma.automation.createMany({
    data: [
      { slug: "platform-health-monitor", name: "Platform Health Monitor", trigger: "Every 60 seconds · connector health", action: "Evaluate thresholds, notify, open incident", status: "ACTIVE", lastExecutionAt: minutesAgo(1), successRate: 99.4, avgExecutionMs: 420, description: "Reads live connector health and compares it to platform SLOs.", platformId: n8n.id, n8nWorkflowFile: "workflows/platform-health-alert.json" },
      { slug: "failed-workflow-recovery", name: "Failed Workflow Recovery", trigger: "workflow.failed", action: "Retry, verify, incident if still failing", status: "ACTIVE", lastExecutionAt: minutesAgo(6), successRate: 97.1, avgExecutionMs: 1180, description: "Automatically retries failed n8n executions.", platformId: n8n.id, n8nWorkflowFile: "workflows/failed-workflow-recovery.json" },
      { slug: "configuration-drift-monitor", name: "Configuration Drift Monitor", trigger: "configuration.changed", action: "Diff baseline, notify, open change request", status: "ACTIVE", lastExecutionAt: minutesAgo(10), successRate: 99.8, avgExecutionMs: 510, description: "Keeps approved configuration and observed configuration aligned.", platformId: chatgpt.id, n8nWorkflowFile: "workflows/configuration-drift.json" },
      { slug: "vendor-incident-monitor", name: "Vendor Incident Monitor", trigger: "vendor.incident_detected", action: "Open incident and draft escalation", status: "ACTIVE", lastExecutionAt: minutesAgo(9), successRate: 99.2, avgExecutionMs: 640, description: "Turns vendor status events into operational incidents.", platformId: chatgpt.id },
      { slug: "integration-sync", name: "Integration Sync", trigger: "Every 15 minutes", action: "Synchronize users, webhooks, and usage APIs", status: "ACTIVE", lastExecutionAt: minutesAgo(14), successRate: 99.6, avgExecutionMs: 2300, description: "Keeps connectors current without waiting for a failure.", platformId: chatgpt.id },
    ],
  });

  const automations = await prisma.automation.findMany();
  for (const automation of automations) {
    await prisma.automationExecution.createMany({
      data: Array.from({ length: 6 }).map((_, i) => ({
        automationId: automation.id,
        startedAt: minutesAgo(8 + i * 15),
        completedAt: minutesAgo(8 + i * 15),
        status: i === 5 && automation.slug === "failed-workflow-recovery" ? "RETRIED" : "SUCCEEDED",
        durationMs: automation.avgExecutionMs + i * 20,
        result: { seed: true },
      })),
    });
  }

  await prisma.notification.createMany({
    data: [
      { userId: maya.id, title: "Claude API latency elevated", message: "p95 crossed 900 ms for two consecutive checks.", kind: "health", href: "/platforms/claude", createdAt: minutesAgo(80) },
      { userId: maya.id, title: "Configuration drift detected", message: "External sharing is Enabled; baseline is Disabled.", kind: "configuration", href: "/configuration", createdAt: minutesAgo(10) },
      { userId: maya.id, title: "n8n workflow failed", message: "Platform Health Alert execution did not complete.", kind: "workflow", href: "/incidents", createdAt: minutesAgo(48) },
      { userId: maya.id, title: "Incident resolved", message: "INC-00418 ChatGPT latency spike is resolved.", kind: "incident", href: "/incidents", read: true, createdAt: hoursAgo(25) },
      { userId: maya.id, title: "Integration reconnected", message: "n8n webhook listener is receiving events again.", kind: "integration", href: "/integrations", createdAt: minutesAgo(140) },
    ],
  });

  await prisma.auditEvent.createMany({
    data: [
      { timestamp: minutesAgo(14), actor: "Maya Chen", actorId: maya.id, action: "connector.sync", resource: "chatgpt", details: { result: "ok" } },
      { timestamp: minutesAgo(10), actor: "Configuration engine", action: "drift_detected", resource: "chatgpt:external_sharing", details: { expected: "Disabled", observed: "Enabled" } },
      { timestamp: minutesAgo(6), actor: "Remediation engine", action: "restart_workflow", resource: "INC-00422", details: { ok: true } },
      { timestamp: hoursAgo(30), actor: "Priya Nair", actorId: priya.id, action: "change.executed", resource: "CHG-00288", details: { result: "verified" } },
    ],
  });

  await prisma.simulationState.create({
    data: { id: "demo", lastResetAt: new Date(), activeScenarios: [] },
  });

  console.log(`Seeded operations demo: ${users.length} users, 4 platforms, ${events.length} events.`);
}

async function runCli() {
  try {
    await seedDatabase();
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes("seed")) {
  runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
