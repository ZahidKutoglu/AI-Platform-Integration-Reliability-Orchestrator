import { describe, expect, it } from "vitest";
import { errorBudget, sloStatus } from "@/lib/slo/metrics";

describe("SLO evaluation", () => {
  it("marks availability that meets the target", () => {
    expect(sloStatus(99.98, 99.95)).toBe("meeting");
    expect(sloStatus(98.72, 99.5)).toBe("breached");
  });

  it("inverts comparison for latency and error rate", () => {
    expect(sloStatus(420, 800, true)).toBe("meeting");
    expect(sloStatus(18, 1.2, true)).toBe("breached");
  });

  it("computes remaining error budget", () => {
    const budget = errorBudget(99.98, 99.95);
    expect(budget.remaining).toBeGreaterThan(0);
    expect(errorBudget(98.72, 99.5).remaining).toBe(0);
  });
});
