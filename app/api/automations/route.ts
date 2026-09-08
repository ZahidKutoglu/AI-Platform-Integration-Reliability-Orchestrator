import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const automations = await prisma.automation.findMany({
      include: {
        platform: true,
        executions: { orderBy: { startedAt: "desc" }, take: 8 },
      },
      orderBy: { name: "asc" },
    });
    return { automations };
  });
}
