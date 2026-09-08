import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const escalations = await prisma.vendorEscalation.findMany({
      include: { incident: true, platform: true },
      orderBy: { createdAt: "desc" },
    });
    return { escalations };
  });
}
