import { test, expect } from '@playwright/test';

// Test authentication can be added with a fixture like this
// test.use({ storageState: 'tests/artifacts/auth.json' });

test.describe('Journal entries functionality', () => {
  // This test would require authentication in a real application
  test('should show journal entry form', async ({ page }) => {
    // Go to a specific journal (this assumes the journal #1 exists)
    await page.goto('/journals/1');
    
    // Click on the new entry button (adjust selector as needed)
    await page.getByRole('button', { name: /new entry|add entry/i }).click();
    
    // Verify the entry form is visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/content|entry/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /save|submit/i })).toBeVisible();
  });

  // This test would need to be updated to match your actual app structure
  test('should show daily writing form', async ({ page }) => {
    // Go to daily writing page
    await page.goto('/journals/daily-write');
    
    // Verify form elements are present
    await expect(page.getByRole('heading', { name: /daily write|journal/i })).toBeVisible();
    await expect(page.getByRole('textbox')).toBeVisible();
  });
  
  // Example of a parametrized test for different journal pages
  const journalPages = [
    { name: 'dashboard', url: '/dashboard' },
    { name: 'journals list', url: '/journals' },
    { name: 'daily write', url: '/journals/daily-write' }
  ];
  
  for (const { name, url } of journalPages) {
    test(`should load ${name} page`, async ({ page }) => {
      await page.goto(url);
      await expect(page).toHaveURL(url);
      // Check page has loaded
      await expect(page.locator('body')).not.toHaveText('404');
      await expect(page.locator('body')).not.toHaveText('Error');
    });
  }
});