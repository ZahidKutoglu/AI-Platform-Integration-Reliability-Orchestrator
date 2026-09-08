import { describe, expect, it } from "vitest";
import { compareConfiguration, driftSeverity } from "@/lib/configuration/drift";

describe("configuration drift", () => {
  it("reports keys that diverged from baseline", () => {
    const diffs = compareConfiguration(
      { sso: "Required", external_sharing: "Disabled" },
      { sso: "Required", external_sharing: "Enabled" },
    );
    expect(diffs).toEqual([
      { key: "external_sharing", expectedValue: "Disabled", observedValue: "Enabled" },
    ]);
  });

  it("treats sharing and identity keys as high severity", () => {
    expect(driftSeverity("external_sharing")).toBe("HIGH");
    expect(driftSeverity("retention")).toBe("MEDIUM");
  });
});
