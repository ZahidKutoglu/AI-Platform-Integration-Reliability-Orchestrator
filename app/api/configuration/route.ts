import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const platforms = await prisma.platform.findMany({
      include: {
        baselines: true,
        snapshots: { orderBy: { observedAt: "desc" }, take: 1 },
        drifts: { where: { status: { not: "REMEDIATED" } }, orderBy: { detectedAt: "desc" } },
      },
      orderBy: { name: "asc" },
    });
    return { platforms };
  });
}
