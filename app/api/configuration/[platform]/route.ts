import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { scanPlatformDrift } from "@/lib/configuration/drift";

export async function GET(request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform: slug } = await context.params;
  return handleRoute(request, async () => {
    const platform = await prisma.platform.findUnique({
      where: { slug },
      include: {
        baselines: true,
        snapshots: { orderBy: { observedAt: "desc" }, take: 5 },
        drifts: { orderBy: { detectedAt: "desc" } },
        changeRequests: { orderBy: { createdAt: "desc" }, include: { requestedBy: true } },
      },
    });
    if (!platform) throw new ApiError("Platform not found.", 404);
    await scanPlatformDrift(platform.id);
    const drifts = await prisma.configurationDrift.findMany({
      where: { platformId: platform.id },
      orderBy: { detectedAt: "desc" },
    });
    return { platform: { ...platform, drifts } };
  });
}
