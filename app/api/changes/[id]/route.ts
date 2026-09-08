import { z } from "zod";
import { ApiError, handleRoute } from "@/lib/http";
import { approveChange, executeChange, rejectChange } from "@/lib/changes/engine";
import { getOperatorSession, assertRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  action: z.enum(["approve", "reject", "execute"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleRoute(request, async () => {
    const session = await getOperatorSession();
    assertRole(session, ["ADMIN", "OPERATOR"]);
    const body = schema.parse(await request.json());
    const existing = await prisma.changeRequest.findFirst({ where: { OR: [{ id }, { number: id }] } });
    if (!existing) throw new ApiError("Change request not found.", 404);
    if (body.action === "approve") return { change: await approveChange(existing.id, session.user.name) };
    if (body.action === "reject") return { change: await rejectChange(existing.id, session.user.name) };
    return { change: await executeChange(existing.id, session.user.name) };
  });
}
