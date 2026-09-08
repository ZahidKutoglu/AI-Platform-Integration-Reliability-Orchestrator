import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRoute(request, async () => {
    const automation = await prisma.automation.findUnique({
      where: { slug },
      include: {
        platform: true,
        executions: { orderBy: { startedAt: "desc" }, take: 20 },
      },
    });
    if (!automation) throw new ApiError("Automation not found.", 404);
    return { automation };
  });
}
