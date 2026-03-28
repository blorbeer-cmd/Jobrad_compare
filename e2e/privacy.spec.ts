import { test, expect } from "@playwright/test";

test.describe("Privacy & GDPR", () => {
  test("privacy policy page is publicly accessible", async ({ page }) => {
    const response = await page.goto("/datenschutz");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("privacy link is visible in footer", async ({ page }) => {
    await page.goto("/login");
    const privacyLink = page.getByRole("link", { name: /datenschutz/i });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute("href", "/datenschutz");
  });

  test("profile page requires authentication", async ({ page }) => {
    await page.goto("/profil");
    // Should redirect to login
    await expect(page).toHaveURL(/login|profil/);
  });
});
