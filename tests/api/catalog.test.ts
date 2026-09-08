import { describe, expect, it } from "vitest";
import { API_CATALOG } from "@/lib/docs/catalog";

describe("API catalog", () => {
  it("documents the required operational endpoints", () => {
    const paths = API_CATALOG.map((item) => `${item.method} ${item.path}`);
    expect(paths).toContain("GET /api/platforms");
    expect(paths).toContain("POST /api/platforms/:slug/test");
    expect(paths).toContain("POST /api/events");
    expect(paths).toContain("POST /api/webhooks/:provider");
    expect(paths).toContain("POST /api/simulation/outage");
    expect(paths).toContain("POST /api/simulation/recovery");
  });
});
