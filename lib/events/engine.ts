import type { Prisma, Severity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { correlationId } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { processEvent } from "@/lib/events/processor";

export type IngestEventInput = {
  type: string;
  title: string;
  severity?: Severity;
  platformSlug?: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
  source?: string;
  timestamp?: Date;
};

export function normalizeEvent(input: IngestEventInput) {
  return {
    type: input.type,
    title: input.title,
    severity: input.severity ?? inferSeverity(input.type),
    payload: input.payload ?? {},
    correlationId: input.correlationId ?? correlationId("corr"),
    source: input.source ?? "internal",
    timestamp: input.timestamp ?? new Date(),
  };
}

export function inferSeverity(type: string): Severity {
  if (type.includes("outage") || type.includes("disconnected") || type.includes("vendor.incident")) {
    return "CRITICAL";
  }
  if (type.includes("failed") || type.includes("drift") || type.includes("error")) {
    return "HIGH";
  }
  if (type.includes("degraded") || type.includes("health_changed") || type.includes("retry")) {
    return "MEDIUM";
  }
  return "INFO";
}

export async function ingestEvent(input: IngestEventInput) {
  const normalized = normalizeEvent(input);
  const platform = input.platformSlug
    ? await prisma.platform.findUnique({ where: { slug: input.platformSlug } })
    : null;

  const event = await prisma.platformEvent.create({
    data: {
      type: normalized.type,
      title: normalized.title,
      severity: normalized.severity,
      payload: normalized.payload as Prisma.InputJsonValue,
      correlationId: normalized.correlationId,
      source: normalized.source,
      timestamp: normalized.timestamp,
      processingStatus: "PENDING",
      platformId: platform?.id,
    },
  });

  logger.info("Event ingested", { id: event.id, type: event.type, correlationId: event.correlationId });

  try {
    await prisma.platformEvent.update({
      where: { id: event.id },
      data: { processingStatus: "PROCESSING" },
    });
    await processEvent(event);
    await prisma.platformEvent.update({
      where: { id: event.id },
      data: { processingStatus: "PROCESSED" },
    });
  } catch (error) {
    logger.error("Event processing failed", {
      id: event.id,
      message: error instanceof Error ? error.message : "unknown",
    });
    await prisma.platformEvent.update({
      where: { id: event.id },
      data: { processingStatus: "FAILED" },
    });
  }

  return event;
}
