import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleRoute(request, async () => {
    const incident = await prisma.incident.findFirst({
      where: { OR: [{ id }, { number: id }] },
      include: {
        platform: true,
        owner: true,
        timeline: { orderBy: { timestamp: "asc" } },
        escalations: true,
      },
    });
    if (!incident) throw new ApiError("Incident not found.", 404);
    const relatedEvents = await prisma.platformEvent.findMany({
      where: { platformId: incident.platformId, timestamp: { gte: incident.detectedAt } },
      orderBy: { timestamp: "desc" },
      take: 20,
    });
    return { incident, relatedEvents };
  });
}
