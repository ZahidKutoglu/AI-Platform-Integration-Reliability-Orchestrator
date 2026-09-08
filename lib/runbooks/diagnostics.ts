import { getConnector } from "@/lib/connectors/registry";
import { prisma } from "@/lib/db";

export type DiagnosticResult = {
  name: string;
  ok: boolean;
  warn: boolean;
  detail: string;
};

export async function runRunbookDiagnostic(slug: string) {
  const runbook = await prisma.runbook.findUnique({ where: { slug } });
  if (!runbook) throw new Error("Runbook not found.");

  const connectorSlug = runbook.platformId
    ? (await prisma.platform.findUnique({ where: { id: runbook.platformId } }))?.slug
    : inferConnector(slug);

  const connector = getConnector(connectorSlug ?? "chatgpt");
  const health = await connector.testConnection();

  const results: DiagnosticResult[] = health.checks.map((check) => ({
    name: check.name,
    ok: check.ok,
    warn: !check.ok && !check.detail.toLowerCase().includes("timeout") && !check.detail.toLowerCase().includes("unreachable"),
    detail: check.detail,
  }));

  const failed = results.filter((r) => !r.ok);
  const recommendation = failed.length
    ? recommend(slug, failed)
    : "All diagnostic checks passed. No remediation required.";

  return {
    runbook: runbook.title,
    testedAt: health.testedAt,
    latencyMs: health.latencyMs,
    results,
    recommendation,
  };
}

function inferConnector(slug: string) {
  if (slug.includes("claude")) return "claude";
  if (slug.includes("chatgpt")) return "chatgpt";
  if (slug.includes("n8n") || slug.includes("webhook")) return "n8n";
  if (slug.includes("scim") || slug.includes("identity")) return "entra";
  if (slug.includes("replit")) return "replit";
  return "chatgpt";
}

function recommend(slug: string, failed: DiagnosticResult[]) {
  if (slug.includes("drift")) return "Review the drifted keys, then remediate back to the approved baseline.";
  if (failed.some((f) => f.name.includes("Authentication"))) return "Reconnect the integration and rotate the service credential.";
  if (failed.some((f) => f.name.includes("Error rate"))) return "Retry the vendor API, then fail over affected workflows if the error rate stays elevated.";
  if (failed.some((f) => f.name.includes("Latency"))) return "Shift non-critical traffic to the fallback platform until latency returns to the SLO.";
  return "Open an incident and escalate to the vendor if recovery does not complete within 15 minutes.";
}
