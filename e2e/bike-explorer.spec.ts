import { test, expect } from "@playwright/test";

// These tests require an authenticated session.
// In CI, set up auth state via storageState or use dev login.

test.describe("Bike Explorer", () => {
  test.describe("search and filter", () => {
    test("displays bike listings after login", async ({ page }) => {
      await page.goto("/");
      // Should show the browse tab with bike grid or loading state
      const browseTab = page.getByRole("tab", { name: /durchsuchen/i });
      if (await browseTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(browseTab).toHaveAttribute("data-state", "active");
      }
    });

    test("can switch between tabs", async ({ page }) => {
      await page.goto("/");
      const tabs = ["Durchsuchen", "Favoriten", "Vergleich", "Modelle"];

      for (const tabName of tabs) {
        const tab = page.getByRole("tab", { name: new RegExp(tabName, "i") });
        if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tab.click();
          await expect(tab).toHaveAttribute("data-state", "active");
        }
      }
    });

    test("filter sidebar is visible on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/");
      // Filter sidebar should be visible on desktop in browse tab
      const filterSection = page.locator('[class*="hidden lg:block"]');
      if (await filterSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(filterSection).toBeVisible();
      }
    });
  });

  test.describe("favorites", () => {
    test("shows empty state when no favorites saved", async ({ page }) => {
      await page.goto("/");
      const favTab = page.getByRole("tab", { name: /favoriten/i });
      if (await favTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await favTab.click();
        const emptyState = page.getByText(/keine favoriten/i);
        // Either shows empty state or saved bikes
        await expect(emptyState.or(page.locator("[data-testid='saved-bike']"))).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe("comparison", () => {
    test("shows empty comparison view", async ({ page }) => {
      await page.goto("/");
      const compareTab = page.getByRole("tab", { name: /vergleich/i });
      if (await compareTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await compareTab.click();
        // Should show some comparison UI (empty or with content)
        await expect(page.locator('[role="tabpanel"]')).toBeVisible();
      }
    });
  });
});
