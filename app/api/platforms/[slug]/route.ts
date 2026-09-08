import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { getConnector } from "@/lib/connectors/registry";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRoute(request, async () => {
    const platform = await prisma.platform.findUnique({
      where: { slug },
      include: {
        healthSnapshots: { orderBy: { timestamp: "desc" }, take: 24 },
        events: { orderBy: { timestamp: "desc" }, take: 12 },
        workflows: true,
        runbooks: true,
        integrations: true,
        drifts: { where: { status: { in: ["OPEN", "REVIEWING"] } } },
      },
    });
    if (!platform) throw new ApiError("Platform not found.", 404);
    const connector = getConnector(slug);
    const [usage, users, configuration] = await Promise.all([
      connector.getUsage(),
      connector.getUsers(),
      connector.getConfiguration(),
    ]);
    return { platform, usage, users, configuration };
  });
}
