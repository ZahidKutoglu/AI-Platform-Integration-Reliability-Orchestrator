import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";
import { getOperatorSession } from "@/lib/auth";
import { ingestEvent } from "@/lib/events/engine";

const createSchema = z.object({
  title: z.string().min(4),
  platformSlug: z.string(),
  severity: z.enum(["P1", "P2", "P3", "P4"]).default("P3"),
  summary: z.string().min(4),
});

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const status = new URL(request.url).searchParams.get("status");
    const incidents = await prisma.incident.findMany({
      where: status ? { status: status as never } : undefined,
      include: { platform: true, owner: true },
      orderBy: { detectedAt: "desc" },
    });
    return { incidents };
  });
}

export async function POST(request: Request) {
  return handleRoute(request, async () => {
    const body = createSchema.parse(await request.json());
    const session = await getOperatorSession();
    const event = await ingestEvent({
      type: "platform.api_error",
      title: body.title,
      platformSlug: body.platformSlug,
      source: "operator",
      payload: { summary: body.summary, severity: body.severity },
      severity: body.severity === "P1" ? "CRITICAL" : body.severity === "P2" ? "HIGH" : "MEDIUM",
    });
    const incident = await prisma.incident.findFirst({
      where: { platform: { slug: body.platformSlug } },
      orderBy: { detectedAt: "desc" },
      include: { platform: true, owner: true },
    });
    return { incident, eventId: event.id, reporter: session.user.name };
  });
}
