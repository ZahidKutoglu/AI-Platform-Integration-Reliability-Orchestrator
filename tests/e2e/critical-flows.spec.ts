import { test, expect } from "@playwright/test";

test("overview presents the operations product, not a SOC console", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "AI Platform Operations" })).toBeVisible();
  await expect(page.getByText("Operate your enterprise AI stack with confidence.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});

test("platform connection test calls the backend", async ({ page }) => {
  await page.goto("/platforms/chatgpt");
  await expect(page.getByRole("heading", { name: "ChatGPT Enterprise" })).toBeVisible();
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/platforms/chatgpt/test"));
  await page.getByRole("button", { name: "Test connection" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
});

test("simulation center mutates operational state", async ({ page }) => {
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Run" }).first().click();
  await expect(page.getByText(/Degraded|Outage|Claude/i).first()).toBeVisible({ timeout: 20_000 });
});
