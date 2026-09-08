import { describe, expect, it } from "vitest";
import { nextIncidentStatus, severityFromEvent, shouldOpenIncident } from "@/lib/incidents/engine";

describe("incident engine", () => {
  it("opens incidents for operational failures only", () => {
    expect(shouldOpenIncident({ type: "platform.api_error", severity: "HIGH" })).toBe(true);
    expect(shouldOpenIncident({ type: "platform.health_changed", severity: "INFO" })).toBe(false);
    expect(shouldOpenIncident({ type: "workflow.completed", severity: "INFO" })).toBe(false);
  });

  it("maps event severity onto P1-P4", () => {
    expect(severityFromEvent({ type: "vendor.outage", severity: "CRITICAL" })).toBe("P1");
    expect(severityFromEvent({ type: "platform.api_error", severity: "HIGH" })).toBe("P2");
    expect(severityFromEvent({ type: "workflow.failed", severity: "MEDIUM" })).toBe("P3");
  });

  it("advances the incident lifecycle", () => {
    expect(nextIncidentStatus("DETECTED", "ack")).toBe("INVESTIGATING");
    expect(nextIncidentStatus("INVESTIGATING", "mitigate")).toBe("MITIGATING");
    expect(nextIncidentStatus("MITIGATING", "monitor")).toBe("MONITORING");
    expect(nextIncidentStatus("MONITORING", "resolve")).toBe("RESOLVED");
    expect(nextIncidentStatus("RESOLVED", "ack")).toBe("RESOLVED");
  });
});
