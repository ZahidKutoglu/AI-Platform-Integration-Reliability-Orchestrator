import { prisma } from "@/lib/db";

export async function globalSearch(query: string) {
  const q = query.trim();
  const contains = q ? { contains: q } : undefined;

  const [platforms, incidents, workflows, integrations, events, changes, runbooks] = await Promise.all([
    prisma.platform.findMany({
      where: contains ? { OR: [{ name: contains }, { vendor: contains }, { slug: contains }] } : undefined,
      orderBy: { name: "asc" },
      take: 6,
    }),
    prisma.incident.findMany({
      where: contains ? { OR: [{ title: contains }, { number: contains }, { summary: contains }] } : undefined,
      include: { platform: true },
      orderBy: { detectedAt: "desc" },
      take: 6,
    }),
    prisma.workflow.findMany({
      where: contains ? { OR: [{ name: contains }, { slug: contains }, { description: contains }] } : undefined,
      include: { platform: true },
      orderBy: { name: "asc" },
      take: 6,
    }),
    prisma.integration.findMany({
      where: contains ? { OR: [{ name: contains }, { slug: contains }] } : undefined,
      orderBy: { name: "asc" },
      take: 6,
    }),
    prisma.platformEvent.findMany({
      where: contains ? { OR: [{ title: contains }, { type: contains }, { correlationId: contains }] } : undefined,
      include: { platform: true },
      orderBy: { timestamp: "desc" },
      take: 8,
    }),
    prisma.changeRequest.findMany({
      where: contains ? { OR: [{ title: contains }, { number: contains }, { proposedChange: contains }] } : undefined,
      include: { platform: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.runbook.findMany({
      where: contains ? { OR: [{ title: contains }, { summary: contains }, { slug: contains }] } : undefined,
      orderBy: { title: "asc" },
      take: 6,
    }),
  ]);

  return { platforms, incidents, workflows, integrations, events, changes, runbooks };
}
