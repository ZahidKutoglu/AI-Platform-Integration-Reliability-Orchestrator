import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { getConnector } from "@/lib/connectors/registry";
import { getOperatorSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ingestEvent } from "@/lib/events/engine";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRoute(request, async () => {
    const integration = await prisma.integration.findUnique({
      where: { slug },
      include: { platform: true, logs: { orderBy: { timestamp: "desc" }, take: 30 } },
    });
    if (!integration) throw new ApiError("Integration not found.", 404);
    return { integration };
  });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRoute(request, async () => {
    const integration = await prisma.integration.findUnique({ where: { slug } });
    if (!integration) throw new ApiError("Integration not found.", 404);
    const action = new URL(request.url).searchParams.get("action") ?? "test";
    const session = await getOperatorSession();
    const connector = getConnector(slug);

    if (action === "disconnect") {
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: "DISCONNECTED", health: "OUTAGE" },
      });
      await ingestEvent({
        type: "integration.disconnected",
        title: `${integration.name} disconnected`,
        platformSlug: integration.platformId
          ? (await prisma.platform.findUnique({ where: { id: integration.platformId } }))?.slug
          : undefined,
        source: "operator",
        severity: "HIGH",
      });
      await writeAudit({ actor: session.user.name, action: "integration.disconnect", resource: slug });
      return { ok: true, status: "DISCONNECTED" };
    }

    if (action === "connect") {
      const result = await connector.executeAction({ type: "reconnect" });
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: "CONNECTED", health: "OPERATIONAL", lastSyncAt: new Date() },
      });
      await writeAudit({ actor: session.user.name, action: "integration.connect", resource: slug });
      return result;
    }

    const result = await connector.testConnection();
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date(), apiLatencyMs: result.latencyMs },
    });
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        level: result.ok ? "info" : "error",
        message: result.message,
        details: { checks: result.checks },
      },
    });
    await writeAudit({ actor: session.user.name, action: "integration.test", resource: slug });
    return result;
  });
}
