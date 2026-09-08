export type ConnectorAction =
  | { type: "retry_request"; requestId?: string }
  | { type: "restart_workflow"; workflowSlug: string }
  | { type: "disable_workflow"; workflowSlug: string }
  | { type: "switch_fallback"; workflowSlug: string; fallbackSlug: string }
  | { type: "reconnect" }
  | { type: "clear_failed_execution"; executionId?: string }
  | { type: "sync_users" }
  | { type: "apply_configuration"; key: string; value: string };

export type HealthSnapshot = {
  status: "OPERATIONAL" | "DEGRADED" | "OUTAGE" | "MAINTENANCE";
  availability: number;
  latencyMs: number;
  errorRate: number;
  workflowSuccessRate: number;
  lastCheckedAt: string;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

export type PlatformUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  lastActiveAt: string;
};

export type UsageSnapshot = {
  requests24h: number;
  tokens24h: number;
  activeUsers: number;
  workflows: number;
  errorBudgetRemaining: number;
};

export type ConnectionTestResult = {
  ok: boolean;
  latencyMs: number;
  authenticated: boolean;
  message: string;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
  testedAt: string;
};

export type NormalizedConnectorEvent = {
  type: string;
  title: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  payload: Record<string, unknown>;
  occurredAt: string;
  sourceEventId: string;
};

export type ActionResult = {
  ok: boolean;
  action: ConnectorAction["type"];
  message: string;
  details?: Record<string, unknown>;
};

export interface PlatformConnector {
  slug: string;
  vendor: string;
  getHealth(): Promise<HealthSnapshot>;
  getUsers(): Promise<PlatformUser[]>;
  getUsage(): Promise<UsageSnapshot>;
  getConfiguration(): Promise<Record<string, string>>;
  testConnection(): Promise<ConnectionTestResult>;
  getEvents(): Promise<NormalizedConnectorEvent[]>;
  executeAction(action: ConnectorAction): Promise<ActionResult>;
}
