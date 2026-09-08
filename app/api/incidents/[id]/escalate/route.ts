import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { createVendorEscalation } from "@/lib/escalations/package";
import { getOperatorSession, assertRole } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleRoute(request, async () => {
    const session = await getOperatorSession();
    assertRole(session, ["ADMIN", "OPERATOR"]);
    const incident = await prisma.incident.findFirst({ where: { OR: [{ id }, { number: id }] } });
    if (!incident) throw new ApiError("Incident not found.", 404);
    return createVendorEscalation(incident.id, session.user.name);
  });
}
