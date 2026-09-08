# n8n workflows

These JSON files are importable n8n workflows that speak to the operations API.

## Import

1. Start n8n (`docker compose --profile full up n8n` or a local n8n instance).
2. Open http://localhost:5678.
3. Import each file from this directory.
4. Set `WEBHOOK_SECRET` to the same value as `WEBHOOK_SECRET` in `.env`.
5. Point HTTP Request nodes at the running app (`http://localhost:3000` locally, `http://host.docker.internal:3000` from Docker Desktop).

The in-process event engine, incident engine, and remediation engine execute the same lifecycle when n8n is not running.

## Workflow 1 — Platform Health Alert

`platform-health-alert.json`

Health check → threshold evaluation → webhook → notification → incident.

Every minute n8n reads `GET /api/platforms`. If a platform error rate exceeds its SLO, n8n posts `platform.api_error` to `POST /api/webhooks/n8n`. The API normalizes the event, opens an incident if needed, and runs remediation.

## Workflow 2 — Failed Workflow Recovery

`failed-workflow-recovery.json`

n8n execution fails → event sent to the operations API → retry → verify → incident if still failing.

## Workflow 3 — Configuration Drift

`configuration-drift.json`

Drift detected → webhook → create change request → notify admin → remediate after approval.

Approval and remediation happen on the Configuration page (`Review`, `Approve`, `Remediate`), which writes audit events and a new configuration snapshot.
