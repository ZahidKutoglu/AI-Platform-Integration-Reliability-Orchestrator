import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { remediateDrift, scanPlatformDrift } from "@/lib/configuration/drift";
import { getOperatorSession, assertRole } from "@/lib/auth";
import { ingestEvent } from "@/lib/events/engine";

const schema = z.object({
  driftId: z.string().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform: slug } = await context.params;
  return handleRoute(request, async () => {
    const session = await getOperatorSession();
    assertRole(session, ["ADMIN", "OPERATOR"]);
    const platform = await prisma.platform.findUnique({ where: { slug } });
    if (!platform) throw new ApiError("Platform not found.", 404);
    const body = schema.parse(await request.json().catch(() => ({})));
    await scanPlatformDrift(platform.id);
    const targets = body.driftId
      ? [await prisma.configurationDrift.findUnique({ where: { id: body.driftId } })]
      : await prisma.configurationDrift.findMany({
          where: { platformId: platform.id, status: { in: ["OPEN", "REVIEWING", "APPROVED"] } },
        });
    const updated = [];
    for (const drift of targets) {
      if (!drift) continue;
      updated.push(await remediateDrift(drift.id, session.user.name));
    }
    await ingestEvent({
      type: "configuration.changed",
      title: `${platform.name} configuration remediated to baseline`,
      platformSlug: slug,
      source: "configuration.remediate",
      severity: "INFO",
    });
    return { remediated: updated.length, drifts: updated };
  });
}
