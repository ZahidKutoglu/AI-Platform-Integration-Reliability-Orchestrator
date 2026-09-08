import { describe, expect, it } from "vitest";
import { planRemediation } from "@/lib/remediation/engine";

describe("remediation planner", () => {
  it("retries API errors then health-checks", () => {
    expect(planRemediation("platform.api_error")).toEqual([
      "retry_api_request",
      "notify_administrator",
      "health_check",
    ]);
  });

  it("restarts failed workflows", () => {
    expect(planRemediation("workflow.failed")).toContain("restart_workflow");
  });

  it("fails over during a vendor outage", () => {
    expect(planRemediation("vendor.incident_detected")).toContain("switch_fallback_platform");
    expect(planRemediation("vendor.incident_detected")).toContain("create_vendor_escalation");
  });
});
