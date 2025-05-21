import { test, expect } from '@playwright/test';

test.describe('Homepage tests', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Verify the page has loaded correctly
    await expect(page).toHaveTitle(/Fictionalize Me/);
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for essential navigation elements
    const navElements = await page.getByRole('navigation').count();
    expect(navElements).toBeGreaterThan(0);
  });
});