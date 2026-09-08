import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { ingestEvent } from "@/lib/events/engine";
import { verifyWebhookSignature } from "@/lib/webhooks";
import { logger } from "@/lib/logger";

const payloadSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  event: z.string().optional(),
  platform: z.string().optional(),
  workflow: z.string().optional(),
  status: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  return handleRoute(request, async () => {
    const secret = process.env.WEBHOOK_SECRET ?? "";
    const raw = await request.text();
    const signature =
      request.headers.get("x-ops-signature") ??
      request.headers.get("x-lumen-signature") ??
      request.headers.get("x-n8n-signature");
    const skip = process.env.DEMO_MODE !== "false" && !signature;
    if (!skip && !verifyWebhookSignature(raw, signature, secret)) {
      logger.warn("Webhook signature rejected", { provider });
      throw new ApiError("Invalid webhook signature.", 401);
    }

    const parsed = payloadSchema.parse(raw ? JSON.parse(raw) : {});
    const type = parsed.type ?? parsed.event ?? `${provider}.webhook.received`;
    const platformSlug = parsed.platform ?? (provider === "n8n" ? "n8n" : undefined);
    const event = await ingestEvent({
      type,
      title: parsed.title ?? `${provider} webhook: ${type}`,
      platformSlug,
      source: `webhook.${provider}`,
      payload: {
        ...(parsed.payload ?? parsed),
        workflow: parsed.workflow,
        status: parsed.status,
      },
    });

    if (provider === "n8n" && parsed.workflow) {
      const workflow = await prisma.workflow.findFirst({
        where: { OR: [{ slug: parsed.workflow }, { name: parsed.workflow }] },
      });
      if (workflow) {
        await prisma.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            status: parsed.status === "failed" ? "FAILED" : "SUCCEEDED",
            completedAt: new Date(),
            durationMs: 640,
          },
        });
      }
    }

    return { accepted: true, eventId: event.id };
  });
}
