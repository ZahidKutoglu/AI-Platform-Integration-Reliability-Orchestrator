import { prisma } from "@/lib/db";
import { getOperatorSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function writeAudit(input: {
  actor: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  actorId?: string;
}) {
  const session = await getOperatorSession().catch(() => null);
  return prisma.auditEvent.create({
    data: {
      actor: input.actor,
      actorId: input.actorId ?? session?.user.id,
      action: input.action,
      resource: input.resource,
      details: (input.details ?? {}) as Prisma.InputJsonValue,
    },
  });
}
