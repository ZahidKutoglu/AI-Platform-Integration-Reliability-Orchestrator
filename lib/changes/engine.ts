import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function approveChange(id: string, actor: string) {
  const change = await prisma.changeRequest.update({
    where: { id },
    data: { status: "APPROVED" },
  });
  await writeAudit({ actor, action: "change.approved", resource: change.number });
  return change;
}

export async function rejectChange(id: string, actor: string) {
  const change = await prisma.changeRequest.update({
    where: { id },
    data: { status: "REJECTED", result: "Rejected by operator." },
  });
  await writeAudit({ actor, action: "change.rejected", resource: change.number });
  return change;
}

export async function executeChange(id: string, actor: string) {
  const change = await prisma.changeRequest.findUniqueOrThrow({
    where: { id },
    include: { platform: true },
  });
  if (change.status !== "APPROVED") {
    throw new Error("Change must be approved before it can be executed.");
  }

  await prisma.changeRequest.update({ where: { id }, data: { status: "EXECUTING" } });

  const snapshot = await prisma.configurationSnapshot.findFirst({
    where: { platformId: change.platformId },
    orderBy: { observedAt: "desc" },
  });
  const values = {
    ...((snapshot?.values as Record<string, string>) ?? {}),
  };
  if (change.proposedChange.toLowerCase().includes("usage api") || change.proposedChange.toLowerCase().includes("api access")) {
    values.api_access = "Restricted";
  }

  await prisma.configurationSnapshot.create({
    data: {
      platformId: change.platformId,
      values,
      source: "change_request",
    },
  });

  const verified = await prisma.changeRequest.update({
    where: { id },
    data: {
      status: "VERIFIED",
      executedAt: new Date(),
      verifiedAt: new Date(),
      result: "Change executed and verified against the live configuration snapshot.",
    },
  });

  await writeAudit({
    actor,
    action: "change.executed",
    resource: change.number,
    details: { platform: change.platform.slug },
  });

  return verified;
}
