import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";
import { errorBudget, sloStatus } from "@/lib/slo/metrics";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const platforms = await prisma.platform.findMany({
      include: { healthSnapshots: { orderBy: { timestamp: "asc" }, take: 24 } },
      orderBy: { name: "asc" },
    });
    const metrics = platforms.map((platform) => ({
      platform,
      availability: {
        label: "Availability",
        current: platform.uptimePercent,
        target: platform.sloAvailability,
        status: sloStatus(platform.uptimePercent, platform.sloAvailability),
        budget: errorBudget(platform.uptimePercent, platform.sloAvailability),
      },
      latency: {
        label: "Latency",
        current: platform.latencyMs,
        target: platform.sloLatencyMs,
        status: sloStatus(platform.latencyMs, platform.sloLatencyMs, true),
      },
      errorRate: {
        label: "Error rate",
        current: platform.errorRate,
        target: platform.sloErrorRate,
        status: sloStatus(platform.errorRate, platform.sloErrorRate, true),
      },
    }));
    return { metrics };
  });
}
