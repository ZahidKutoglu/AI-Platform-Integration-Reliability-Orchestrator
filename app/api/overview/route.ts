import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";
import { sloStatus } from "@/lib/slo/metrics";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const platforms = await prisma.platform.findMany({ orderBy: { name: "asc" } });
    const events = await prisma.platformEvent.findMany({
      include: { platform: true },
      orderBy: { timestamp: "desc" },
      take: 8,
    });
    const incidents = await prisma.incident.findMany({
      where: { status: { not: "RESOLVED" } },
      include: { platform: true },
      orderBy: { detectedAt: "desc" },
    });
    const executions = await prisma.automationExecution.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
      include: { automation: true },
    });
    const health = await prisma.platformHealth.findMany({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: { platform: true },
      orderBy: { timestamp: "asc" },
    });

    const succeeded = executions.filter((e) => e.status === "SUCCEEDED").length;
    const allOperational = platforms.every((p) => p.status === "OPERATIONAL");
    const overall = allOperational
      ? "All systems operational"
      : platforms.some((p) => p.status === "OUTAGE")
        ? "Service disruption"
        : "Degraded performance";

    return {
      overall,
      overallTone: allOperational ? "ok" : platforms.some((p) => p.status === "OUTAGE") ? "down" : "warn",
      platforms,
      events,
      incidents,
      health,
      operational: {
        uptime: Number((platforms.reduce((s, p) => s + p.uptimePercent, 0) / platforms.length).toFixed(2)),
        latency: Math.round(platforms.reduce((s, p) => s + p.latencyMs, 0) / platforms.length),
        errorRate: Number((platforms.reduce((s, p) => s + p.errorRate, 0) / platforms.length).toFixed(2)),
        workflowSuccess: Number(
          (platforms.reduce((s, p) => s + (p.slug === "n8n" ? 98.72 : 99.5), 0) / platforms.length).toFixed(2),
        ),
      },
      automation: {
        executions: executions.length,
        successRate: executions.length ? Number(((succeeded / executions.length) * 100).toFixed(1)) : 100,
        remediations: executions.filter((e) => e.automation.slug.includes("recovery") || e.automation.slug.includes("health")).length,
        interventionsAvoided: 14,
      },
      slo: platforms.map((p) => ({
        slug: p.slug,
        name: p.name,
        availability: { current: p.uptimePercent, target: p.sloAvailability, status: sloStatus(p.uptimePercent, p.sloAvailability) },
        errorRate: { current: p.errorRate, target: p.sloErrorRate, status: sloStatus(p.errorRate, p.sloErrorRate, true) },
      })),
    };
  });
}
