import { describe, expect, it } from "vitest";
import { inferSeverity, normalizeEvent } from "@/lib/events/engine";

describe("event normalization", () => {
  it("assigns a correlation id and default source", () => {
    const event = normalizeEvent({ type: "workflow.failed", title: "n8n failed" });
    expect(event.type).toBe("workflow.failed");
    expect(event.source).toBe("internal");
    expect(event.correlationId.startsWith("corr_")).toBe(true);
    expect(event.severity).toBe("HIGH");
  });

  it("infers critical severity for outages", () => {
    expect(inferSeverity("vendor.incident_detected")).toBe("CRITICAL");
    expect(inferSeverity("user_sync_completed")).toBe("INFO");
  });
});
