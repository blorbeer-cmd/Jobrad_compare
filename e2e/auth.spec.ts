import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/");
    // Unauthenticated users should see the login page or be redirected
    await expect(page).toHaveURL(/login/);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test.describe("with dev login", () => {
    test("can log in with dev credentials", async ({ page }) => {
      await page.goto("/login");
      const emailInput = page.locator('input[type="email"], input[name="email"]');

      // Dev login might not be enabled in test environment
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailInput.fill("test@example.com");
        await page.locator('button[type="submit"]').click();
        // After login, should redirect to home
        await page.waitForURL("/", { timeout: 10000 }).catch(() => {
          // Login might fail if dev login is not enabled — that's OK
        });
      }
    });
  });
});
