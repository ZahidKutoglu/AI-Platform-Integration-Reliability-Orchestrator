import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";
import { getOperatorSession } from "@/lib/auth";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const session = await getOperatorSession();
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId: session.user.id }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return { notifications };
  });
}
