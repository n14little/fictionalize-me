import { test, expect } from '@playwright/test';

test.describe('Journal functionality', () => {
  test('should navigate to journals page', async ({ page }) => {
    // Go to the homepage
    await page.goto('/');
    
    // Navigate to the journals page
    await page.getByRole('link', { name: /journals/i }).click();
    
    // Verify we're on the journals page
    await expect(page).toHaveURL(/\/journals/);
  });
  
  test('should show journal creation form', async ({ page }) => {
    // Go to the new journal page
    await page.goto('/journals/new');
    
    // Verify journal creation form elements are present
    await expect(page.getByRole('heading', { name: /create.*journal/i })).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create|submit|save/i })).toBeVisible();
  });
});