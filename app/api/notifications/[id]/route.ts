import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";

const schema = z.object({
  read: z.boolean().optional(),
  muted: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleRoute(request, async () => {
    const body = schema.parse(await request.json());
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new ApiError("Notification not found.", 404);
    const notification = await prisma.notification.update({ where: { id }, data: body });
    return { notification };
  });
}
