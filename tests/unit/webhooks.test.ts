import { describe, expect, it } from "vitest";
import { signWebhookPayload, verifyWebhookSignature } from "@/lib/webhooks";

describe("webhook signatures", () => {
  it("accepts a matching HMAC", () => {
    const payload = JSON.stringify({ type: "workflow.failed" });
    const signature = signWebhookPayload(payload, "secret");
    expect(verifyWebhookSignature(payload, signature, "secret")).toBe(true);
  });

  it("rejects a missing or mismatched signature", () => {
    expect(verifyWebhookSignature("{}", null, "secret")).toBe(false);
    expect(verifyWebhookSignature("{}", "deadbeef", "secret")).toBe(false);
  });
});
