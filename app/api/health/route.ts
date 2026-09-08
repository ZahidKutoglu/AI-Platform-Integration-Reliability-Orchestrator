import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    await prisma.$queryRaw`SELECT 1 as ok`;
    return {
      status: "ok",
        service: "ai-operations",
      time: new Date().toISOString(),
    };
  }, { skipRateLimit: true });
}
