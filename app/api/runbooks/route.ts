import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const runbooks = await prisma.runbook.findMany({
      include: { platform: true },
      orderBy: { title: "asc" },
    });
    return { runbooks };
  });
}
