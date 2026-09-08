import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { getOperatorSession, assertRole } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  action: z.enum(["review", "approve"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleRoute(request, async () => {
    const session = await getOperatorSession();
    assertRole(session, ["ADMIN", "OPERATOR"]);
    const body = schema.parse(await request.json());
    const drift = await prisma.configurationDrift.findUnique({ where: { id } });
    if (!drift) throw new ApiError("Drift record not found.", 404);
    const updated = await prisma.configurationDrift.update({
      where: { id },
      data: { status: body.action === "review" ? "REVIEWING" : "APPROVED" },
    });
    await writeAudit({
      actor: session.user.name,
      action: `configuration.${body.action}`,
      resource: `${drift.key}`,
    });
    return { drift: updated };
  });
}
