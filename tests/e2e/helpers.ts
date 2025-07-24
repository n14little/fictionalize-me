import { Page, expect } from '@playwright/test';

/**
 * Helper functions for commonly used test operations
 */

/**
 * Login with the provided credentials
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

/**
 * Create a new journal with the given title
 */
export async function createJournal(page: Page, title: string) {
  await page.goto('/journals/new');
  await page.fill('input[name="title"]', title);
  await page.click('button[type="submit"]');
  // Wait for redirect to the new journal page
  await page.waitForURL(/\/journals\/\d+/);
  return page.url().split('/').pop(); // Returns the journal ID
}

/**
 * Create a journal entry in the specified journal
 */
export async function createJournalEntry(
  page: Page,
  journalId: string,
  content: string
) {
  await page.goto(`/journals/${journalId}`);
  await page.click('button:has-text("New Entry")');

  // Fill in the rich text editor
  const editor = page.locator('.ProseMirror, [contenteditable="true"]');
  await editor.click();
  await page.keyboard.type(content);

  // Submit the form
  await page.click('button:has-text("Save")');

  // Wait for the entry to appear in the journal
  await expect(page.getByText(content.substring(0, 20))).toBeVisible();
}
