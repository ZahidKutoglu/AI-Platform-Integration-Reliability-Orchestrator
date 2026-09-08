import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { clientKey, isDemoMode, rateLimit } from "@/lib/rate-limit";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export async function handleRoute<T>(
  request: Request,
  fn: () => Promise<T>,
  options?: { skipRateLimit?: boolean },
) {
  try {
    if (!options?.skipRateLimit && !isDemoMode()) {
      const limited = rateLimit(clientKey(request));
      if (!limited.ok) {
        return json(
          { error: "Too many requests. Please wait a moment and try again." },
          {
            status: 429,
            headers: { "Retry-After": String(Math.ceil((limited.retryAfterMs ?? 1000) / 1000)) },
          },
        );
      }
    }
    const result = await fn();
    return json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return json({ error: "Invalid request.", details: error.flatten() }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    const status = (error as { status?: number }).status;
    if (typeof status === "number") {
      return json({ error: (error as Error).message }, { status });
    }
    logger.error("Unhandled API error", {
      path: new URL(request.url).pathname,
      message: error instanceof Error ? error.message : "unknown",
    });
    const detail = error instanceof Error ? error.message : "unknown";
    return json(
      {
        error: isDemoMode()
          ? detail
          : "Something went wrong. The operations team has been notified.",
      },
      { status: 500 },
    );
  }
}
