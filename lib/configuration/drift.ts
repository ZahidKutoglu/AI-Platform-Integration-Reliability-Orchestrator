import type { PlatformEvent, Severity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { notifyOperators } from "@/lib/notifications/engine";

export function compareConfiguration(
  expected: Record<string, string>,
  observed: Record<string, string>,
) {
  return Object.entries(expected)
    .filter(([key, value]) => (observed[key] ?? "") !== value)
    .map(([key, value]) => ({
      key,
      expectedValue: value,
      observedValue: observed[key] ?? "(missing)",
    }));
}

export function driftSeverity(key: string): Severity {
  const high = ["external_sharing", "sso", "mfa", "audit_logging", "api_access"];
  if (high.includes(key)) return "HIGH";
  return "MEDIUM";
}

export async function scanPlatformDrift(platformId: string) {
  const baselines = await prisma.configurationBaseline.findMany({ where: { platformId } });
  const snapshot = await prisma.configurationSnapshot.findFirst({
    where: { platformId },
    orderBy: { observedAt: "desc" },
  });
  const observed = (snapshot?.values as Record<string, string>) ?? {};
  const expected = Object.fromEntries(baselines.map((b) => [b.key, b.expectedValue]));
  const diffs = compareConfiguration(expected, observed);

  const created = [];
  for (const diff of diffs) {
    const baseline = baselines.find((b) => b.key === diff.key);
    const existing = await prisma.configurationDrift.findFirst({
      where: { platformId, key: diff.key, status: { in: ["OPEN", "REVIEWING"] } },
    });
    if (existing) continue;
    const drift = await prisma.configurationDrift.create({
      data: {
        platformId,
        key: diff.key,
        label: baseline?.label ?? diff.key,
        expectedValue: diff.expectedValue,
        observedValue: diff.observedValue,
        severity: driftSeverity(diff.key),
      },
    });
    created.push(drift);
  }
  return created;
}

export async function evaluateDriftFromEvent(event: PlatformEvent) {
  if (!event.platformId) return [];
  const created = await scanPlatformDrift(event.platformId);
  if (created.length) {
    await notifyOperators({
      title: "Configuration drift detected",
      message: created.map((d) => d.label).join(", "),
      kind: "configuration",
      href: "/configuration",
    });
    await writeAudit({
      actor: "Configuration engine",
      action: "drift_detected",
      resource: event.platformId,
      details: { count: created.length },
    });
  }
  return created;
}

export async function remediateDrift(driftId: string, actor: string) {
  const drift = await prisma.configurationDrift.findUnique({
    where: { id: driftId },
    include: { platform: true },
  });
  if (!drift) throw new Error("Drift record not found.");

  const snapshot = await prisma.configurationSnapshot.findFirst({
    where: { platformId: drift.platformId },
    orderBy: { observedAt: "desc" },
  });
  const values = {
    ...((snapshot?.values as Record<string, string>) ?? {}),
    [drift.key]: drift.expectedValue,
  };
  await prisma.configurationSnapshot.create({
    data: { platformId: drift.platformId, values, source: "remediation" },
  });
  const updated = await prisma.configurationDrift.update({
    where: { id: driftId },
    data: { status: "REMEDIATED", resolvedAt: new Date(), observedValue: drift.expectedValue },
  });
  await writeAudit({
    actor,
    action: "configuration.remediated",
    resource: `${drift.platform.slug}:${drift.key}`,
    details: { expected: drift.expectedValue, previous: drift.observedValue },
  });
  return updated;
}
