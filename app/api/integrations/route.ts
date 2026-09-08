import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const integrations = await prisma.integration.findMany({
      include: { platform: true, logs: { orderBy: { timestamp: "desc" }, take: 8 } },
      orderBy: { name: "asc" },
    });
    return { integrations };
  });
}
