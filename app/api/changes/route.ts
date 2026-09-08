import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const changes = await prisma.changeRequest.findMany({
      include: { platform: true, requestedBy: true },
      orderBy: { createdAt: "desc" },
    });
    return { changes };
  });
}
