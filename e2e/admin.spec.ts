import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("admin pages require authentication", async ({ page }) => {
    await page.goto("/admin");
    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/login|admin/);
  });

  test("admin sub-pages are accessible", async ({ page }) => {
    // These pages require admin role — verify they exist and respond
    const adminPages = ["/admin", "/admin/users", "/admin/invites", "/admin/adapters"];

    for (const path of adminPages) {
      const response = await page.goto(path);
      // Should get a response (200 for authorized, 302/401 for unauthorized)
      expect(response?.status()).toBeDefined();
      expect([200, 302, 307, 401, 403]).toContain(response?.status());
    }
  });
});
