import { Page, expect } from '@playwright/test';

/**
 * Helper functions for commonly used test operations
 */

/**
 * Login with Auth0 OAuth flow using real credentials
 * Requires TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables
 */
export async function loginWithAuth0(page: Page) {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error(
      'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set for login tests'
    );
  }

  await page.goto('/auth/signin');

  const signInButton = page.getByRole('button', { name: 'Sign in with Auth0' });
  await signInButton.click();

  // Wait for Auth0 login page
  await page.waitForURL(/auth0\.com/, { timeout: 10000 });

  // Fill in Auth0 credentials
  await page.fill('input[name="username"]', testEmail);
  await page.fill('input[name="password"]', testPassword);

  // Submit the Auth0 login form
  await page.click(
    'button[type="submit"], button[data-action-button-primary="true"]'
  );

  // Handle consent page if it appears
  try {
    await page.waitForURL(/\/u\/consent/, { timeout: 5000 });

    // Look for and click consent button - be very specific to avoid "Decline"
    const acceptButton = page
      .locator('button')
      .filter({ hasText: /^(Accept|Allow|Authorize)$/i });

    if ((await acceptButton.count()) > 0) {
      await acceptButton.first().click();
    } else {
      // If no exact match, look for primary action button but avoid decline/cancel
      const primaryButton = page
        .locator('button[data-action-button-primary="true"]')
        .filter({ hasNotText: /decline|cancel|deny|reject/i });

      if ((await primaryButton.count()) > 0) {
        await primaryButton.first().click();
      }
    }
  } catch {
    // No consent page, continue
  }

  // Wait for redirect back to the app
  await page.waitForURL(/localhost:3000/, { timeout: 15000 });

  // Give the app a moment to load the authenticated state
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Login with the provided credentials (for future use if email/password auth is added)
 * Currently this attempts the Auth0 flow with provided credentials
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/signin');

  const signInButton = page.getByRole('button', { name: 'Sign in with Auth0' });
  await signInButton.click();

  // Wait for Auth0 login page
  await page.waitForURL(/auth0\.com/, { timeout: 10000 });

  // Fill in Auth0 credentials
  await page.fill('input[name="username"]', email);
  await page.fill('input[name="password"]', password);

  // Submit the Auth0 login form
  await page.click(
    'button[type="submit"], button[data-action-button-primary="true"]'
  );

  // Handle consent page if it appears
  try {
    await page.waitForURL(/\/u\/consent/, { timeout: 5000 });

    // Look for and click consent button - be very specific to avoid "Decline"
    const acceptButton = page
      .locator('button')
      .filter({ hasText: /^(Accept|Allow|Authorize)$/i });

    if ((await acceptButton.count()) > 0) {
      await acceptButton.first().click();
    } else {
      // If no exact match, look for primary action button but avoid decline/cancel
      const primaryButton = page
        .locator('button[data-action-button-primary="true"]')
        .filter({ hasNotText: /decline|cancel|deny|reject/i });

      if ((await primaryButton.count()) > 0) {
        await primaryButton.first().click();
      }
    }
  } catch {
    // No consent page, continue
  }

  // Wait for redirect back to the app
  await page.waitForURL(/localhost:3000/, { timeout: 15000 });
}

/**
 * Logout helper - clears session and navigates to home
 */
export async function logout(page: Page) {
  // Try to click logout if available
  try {
    const logoutLink = page.getByRole('link', { name: 'Logout' });
    if (await logoutLink.isVisible()) {
      await logoutLink.click({ force: true });
      await page.waitForURL('/', { timeout: 10000 });
    }
  } catch {
    // If logout link not available, just clear session
  }

  // Clear all cookies and local storage to ensure clean state
  await page.context().clearCookies();
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch {
    // Ignore localStorage access errors (cross-origin or other contexts)
  }

  // Navigate to home to ensure clean state
  await page.goto('/');
}

/**
 * Create a new journal with the given title
 */
export async function createJournal(page: Page, title: string) {
  await page.goto('/journals/new');

  // Wait for CSRF token to load (CsrfTokenInput component)
  await page.waitForFunction(() => {
    const csrfInput = document.querySelector(
      'input[name="csrf_token"]'
    ) as HTMLInputElement;
    return csrfInput && csrfInput.value && csrfInput.value.length > 0;
  });

  await page.fill('input[name="title"]', title);
  await page.click('button[type="submit"]');

  // Wait for redirect to the new journal page
  await page.waitForURL(/\/journals\/[a-f0-9-]+$/);
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
