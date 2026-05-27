import { test, expect } from "@playwright/test";

test("marketing home renders and screenshots", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/right card/i);
  await page.screenshot({
    path: `e2e/screenshots/marketing-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("login page renders the form", async ({ page }, testInfo) => {
  await page.goto("/login");
  await expect(page.getByTestId("login-form")).toBeVisible();
  await page.screenshot({
    path: `e2e/screenshots/login-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("signup page renders the form", async ({ page }, testInfo) => {
  await page.goto("/signup");
  await expect(page.getByTestId("signup-form")).toBeVisible();
  await page.screenshot({
    path: `e2e/screenshots/signup-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("protected route redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
