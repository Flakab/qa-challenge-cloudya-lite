import { test, expect } from '@playwright/test';

// Sample test to show expected structure.

test('login page loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toHaveText('☁️ Cloudya Lite');
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
});
