import { createHmac, timingSafeEqual } from "crypto";

export function signWebhookPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyWebhookSignature(payload: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = signWebhookPayload(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
