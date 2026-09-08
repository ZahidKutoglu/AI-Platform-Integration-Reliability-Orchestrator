export const API_CATALOG = [
  {
    method: "GET",
    path: "/api/health",
    summary: "Application and database health.",
  },
  {
    method: "GET",
    path: "/api/platforms",
    summary: "List connected AI platforms and current health.",
  },
  {
    method: "GET",
    path: "/api/platforms/:slug",
    summary: "Platform detail, including latest health snapshot.",
  },
  {
    method: "GET",
    path: "/api/platforms/:slug/health",
    summary: "Live connector health check.",
  },
  {
    method: "POST",
    path: "/api/platforms/:slug/test",
    summary: "Test the platform connector and return a health-check result.",
  },
  {
    method: "GET",
    path: "/api/incidents",
    summary: "List incidents, optionally filtered by status.",
  },
  {
    method: "POST",
    path: "/api/incidents",
    summary: "Create an incident from an operator report.",
  },
  {
    method: "GET",
    path: "/api/incidents/:id",
    summary: "Incident detail, timeline, and related events.",
  },
  {
    method: "POST",
    path: "/api/incidents/:id/transition",
    summary: "Move an incident through its lifecycle.",
  },
  {
    method: "POST",
    path: "/api/incidents/:id/escalate",
    summary: "Generate a vendor escalation package.",
  },
  {
    method: "POST",
    path: "/api/events",
    summary: "Ingest a normalized operational event.",
  },
  {
    method: "GET",
    path: "/api/events",
    summary: "Query the operational event timeline.",
  },
  {
    method: "POST",
    path: "/api/webhooks/:provider",
    summary: "Inbound webhook from n8n or a vendor.",
  },
  {
    method: "GET",
    path: "/api/workflows",
    summary: "List operational workflows.",
  },
  {
    method: "POST",
    path: "/api/workflows/:slug/execute",
    summary: "Execute or retry a workflow.",
  },
  {
    method: "GET",
    path: "/api/configuration/:platform",
    summary: "Baseline, snapshot, and drift for a platform.",
  },
  {
    method: "POST",
    path: "/api/configuration/:platform/remediate",
    summary: "Restore drifted keys to the approved baseline.",
  },
  {
    method: "POST",
    path: "/api/simulation/outage",
    summary: "Simulate a platform failure and run the operational lifecycle.",
  },
  {
    method: "POST",
    path: "/api/simulation/recovery",
    summary: "Restore platforms to the demo baseline.",
  },
  {
    method: "GET",
    path: "/api/search",
    summary: "Global search across platforms, incidents, workflows, and runbooks.",
  },
  {
    method: "GET",
    path: "/api/notifications",
    summary: "Operator notification inbox.",
  },
  {
    method: "GET",
    path: "/api/docs",
    summary: "This catalog.",
  },
] as const;
