import { prisma } from "@/lib/db";
import { getOperatorSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function notifyOperators(input: {
  title: string;
  message: string;
  kind: string;
  incidentId?: string;
  href?: string;
}) {
  const session = await getOperatorSession().catch(() => null);
  const notification = await prisma.notification.create({
    data: {
      userId: session?.user.id,
      title: input.title,
      message: input.message,
      kind: input.kind,
      incidentId: input.incidentId,
      href: input.href,
    },
  });
  logger.info("Notification created", { id: notification.id, kind: input.kind });
  return notification;
}

export async function listNotifications() {
  return prisma.notification.findMany({
    where: { muted: false },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}
