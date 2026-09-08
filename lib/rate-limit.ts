const buckets = new Map<string, { count: number; resetAt: number }>();

function limitPerMinute() {
  const parsed = Number(process.env.API_RATE_LIMIT_PER_MINUTE);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120;
}

export function isDemoMode() {
  return process.env.DEMO_MODE !== "false";
}

export function rateLimit(key: string, limit = limitPerMinute()) {
  const now = Date.now();
  const windowMs = 60_000;
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

export function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
