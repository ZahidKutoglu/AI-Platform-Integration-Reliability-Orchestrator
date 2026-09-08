import { ApiError, handleRoute } from "@/lib/http";
import { getConnector } from "@/lib/connectors/registry";
import { prisma } from "@/lib/db";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRoute(request, async () => {
    const platform = await prisma.platform.findUnique({ where: { slug } });
    if (!platform) throw new ApiError("Platform not found.", 404);
    const health = await getConnector(slug).getHealth();
    return { slug, health };
  });
}
