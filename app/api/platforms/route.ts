import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const platforms = await prisma.platform.findMany({
      orderBy: { name: "asc" },
      include: {
        healthSnapshots: { orderBy: { timestamp: "desc" }, take: 1 },
        _count: { select: { incidents: true, workflows: true } },
      },
    });
    return { platforms };
  });
}
