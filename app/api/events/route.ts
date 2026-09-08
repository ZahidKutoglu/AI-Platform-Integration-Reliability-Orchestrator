import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";
import { ingestEvent } from "@/lib/events/engine";

const ingestSchema = z.object({
  type: z.string().min(3),
  title: z.string().min(3),
  platformSlug: z.string().optional(),
  severity: z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  source: z.string().optional(),
  correlationId: z.string().optional(),
});

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const url = new URL(request.url);
    const take = Number(url.searchParams.get("take") ?? 40);
    const events = await prisma.platformEvent.findMany({
      include: { platform: true },
      orderBy: { timestamp: "desc" },
      take: Math.min(take, 100),
    });
    return { events };
  });
}

export async function POST(request: Request) {
  return handleRoute(request, async () => {
    const body = ingestSchema.parse(await request.json());
    const event = await ingestEvent(body);
    return { event };
  });
}
