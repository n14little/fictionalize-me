import { test, expect } from '@playwright/test';

test.describe('Journal functionality', () => {
  test('should navigate to journals page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /journals/i }).click();
    
    await expect(page).toHaveURL(/\/journals/);
  });
  
  test('should be able to create and navigate to journal', async ({ page }) => {
    await page.goto('/journals/new');

    await expect(page.getByRole('heading', { name: /create.*journal/i })).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create|submit|save/i })).toBeVisible();

    const journalTitle = `Test Journal ${Date.now()}`;
    const journalDescription = 'Created by automated test';

    await page.getByLabel(/title/i).fill(journalTitle);
    await page.getByLabel(/description/i).fill(journalDescription);
    await page.getByRole('button', { name: /create journal/i }).click();

    await expect(page).toHaveURL('/journals');

    const journalCard = page.getByRole('link', { name: new RegExp(journalTitle, 'i') });
    await expect(journalCard).toBeVisible();

    await journalCard.click();
    
    await expect(page.url()).toMatch(/\/journals\/[\w-]+$/);
    await expect(page.getByRole('heading', { name: new RegExp(journalTitle, 'i') })).toBeVisible();
    await expect(page.getByRole('button', { name: /new entry/i })).toBeVisible();
  });
});