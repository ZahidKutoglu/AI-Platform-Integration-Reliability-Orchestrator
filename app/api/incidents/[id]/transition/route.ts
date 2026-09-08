import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { transitionIncident } from "@/lib/incidents/engine";
import { getOperatorSession, assertRole } from "@/lib/auth";

const schema = z.object({
  signal: z.enum(["ack", "mitigate", "monitor", "resolve"]),
  message: z.string().min(3),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleRoute(request, async () => {
    const session = await getOperatorSession();
    assertRole(session, ["ADMIN", "OPERATOR"]);
    const body = schema.parse(await request.json());
    const incident = await prisma.incident.findFirst({ where: { OR: [{ id }, { number: id }] } });
    if (!incident) throw new ApiError("Incident not found.", 404);
    const updated = await transitionIncident(incident.id, body.signal, body.message, session.user.name);
    return { incident: updated };
  });
}
