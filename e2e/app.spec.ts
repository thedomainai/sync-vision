import { test, expect } from "@playwright/test";

test.describe("SyncVision Web App", () => {
  test("home page loads correctly", async ({ page }) => {
    await page.goto("/");

    // Check page title or main content
    await expect(page).toHaveTitle(/SyncVision/i);
  });

  test("realtime page loads correctly", async ({ page }) => {
    await page.goto("/realtime");

    // Check for recording button
    const recordButton = page.getByRole("button", { name: /録音開始/i });
    await expect(recordButton).toBeVisible();
  });

  test("realtime page has frame tabs", async ({ page }) => {
    await page.goto("/realtime");

    // Check for frame type tabs
    await expect(page.getByRole("button", { name: /マトリクス/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /タイムライン/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /ロジックツリー/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /ホワイトボード/i })).toBeVisible();
  });

  test("can switch between frame tabs", async ({ page }) => {
    await page.goto("/realtime");

    // Click timeline tab
    await page.getByRole("button", { name: /タイムライン/i }).click();

    // Verify tab is selected (has default variant)
    const timelineTab = page.getByRole("button", { name: /タイムライン/i });
    await expect(timelineTab).toHaveClass(/bg-primary/);
  });

  test("transcript panel shows placeholder text", async ({ page }) => {
    await page.goto("/realtime");

    // Check for placeholder text in transcript panel
    await expect(
      page.getByText(/「録音開始」をクリックして会話を始めてください/i)
    ).toBeVisible();
  });
});
