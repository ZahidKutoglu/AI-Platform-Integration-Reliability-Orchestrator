import { ApiError, handleRoute } from "@/lib/http";
import { getConnector } from "@/lib/connectors/registry";
import { ingestEvent } from "@/lib/events/engine";
import { writeAudit } from "@/lib/audit";
import { getOperatorSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRoute(request, async () => {
    const platform = await prisma.platform.findUnique({ where: { slug } });
    if (!platform) throw new ApiError("Platform not found.", 404);
    const session = await getOperatorSession();
    const result = await getConnector(slug).testConnection();
    await writeAudit({
      actor: session.user.name,
      actorId: session.user.id,
      action: "connector.test",
      resource: slug,
      details: { ok: result.ok, latencyMs: result.latencyMs },
    });
    await ingestEvent({
      type: result.ok ? "platform.health_changed" : "platform.api_error",
      title: result.ok ? `${platform.name} connection test passed` : `${platform.name} connection test failed`,
      platformSlug: slug,
      source: "connector.test",
      payload: { latencyMs: result.latencyMs, checks: result.checks },
      severity: result.ok ? "INFO" : "HIGH",
    });
    await prisma.platform.update({
      where: { id: platform.id },
      data: { lastSyncAt: new Date() },
    });
    return result;
  });
}
