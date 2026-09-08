import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const workflows = await prisma.workflow.findMany({
      include: {
        platform: true,
        executions: { orderBy: { startedAt: "desc" }, take: 5 },
      },
      orderBy: { name: "asc" },
    });
    return { workflows };
  });
}
