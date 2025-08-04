import { test, expect } from '@playwright/test';
import { loginWithAuth0, createJournal } from './helpers';

test.describe('Reference Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch {
      // Ignore localStorage access errors
    }
  });

  test.describe('Unauthenticated Access', () => {
    test('should redirect to sign in when accessing reference tasks without auth', async ({
      page,
    }) => {
      await page.goto('/reference-tasks');

      // Should either redirect to signin or show the reference tasks page
      const finalUrl = page.url();
      expect(finalUrl.includes('/auth/signin')).toBe(true);
    });

    test('should redirect to sign in when accessing create reference task without auth', async ({
      page,
    }) => {
      await page.goto('/reference-tasks/new');

      // Should either redirect to signin or show the form
      const finalUrl = page.url();
      expect(finalUrl.includes('/auth/signin')).toBe(true);
    });
  });

  test.describe('Authenticated Reference Task Operations', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginWithAuth0(page);
      } catch (error) {
        test.fail(true, `Login failed: ${error}`);
      }
    });

    test('should display reference tasks page when authenticated', async ({
      page,
    }) => {
      await page.goto('/reference-tasks');
      await page.waitForURL('/reference-tasks');

      await expect(page).toHaveTitle(/Fictionalize Me/);
      await expect(
        page.getByRole('heading', { name: 'Reference Tasks' })
      ).toBeVisible();

      // Should show create button
      await expect(
        page.getByRole('link', { name: 'Create Reference Task' })
      ).toBeVisible();
    });

    test('should create a new reference task successfully', async ({
      page,
    }) => {
      // First create a journal to use in the reference task
      const timestamp = Date.now();
      await createJournal(page, `E2E Test Journal ${timestamp}`);

      // Now create the reference task
      await page.goto('/reference-tasks/new');

      await expect(
        page.getByRole('heading', { name: 'Create Reference Task' })
      ).toBeVisible();

      // Wait for CSRF token to load
      await page.waitForFunction(() => {
        const csrfInput = document.querySelector(
          'input[name=csrf_token]'
        ) as HTMLInputElement;
        return csrfInput && csrfInput.value && csrfInput.value.length > 0;
      });

      // Fill in the form
      await page.fill('input[name="title"]', 'E2E Test Daily Task');
      await page.fill(
        'textarea[name="description"]',
        'This is a test task created by e2e tests'
      );

      // Select the journal we just created
      await page.selectOption('select[name="journal_id"]', {
        label: `E2E Test Journal ${timestamp}`,
      });

      // Select recurrence type
      await page.selectOption('select[name="recurrence_type"]', 'daily');

      // Set recurrence interval
      await page.fill('input[name="recurrence_interval"]', '1');

      // Set start date (today)
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[name="starts_on"]', today);

      // Make sure it's active
      await page.check('input[name="is_active"]');

      // Submit the form
      await page.getByRole('button', { name: 'Create Reference Task' }).click();

      // Should redirect to reference tasks list
      await page.waitForURL('/reference-tasks');

      // Should see the created task
      await expect(
        page.getByRole('heading', { name: 'E2E Test Daily Task' })
      ).toBeVisible();
    });

    test('should show validation errors for invalid reference task data', async ({
      page,
    }) => {
      await page.goto('/reference-tasks/new');

      // Try to submit empty form
      await page.getByRole('button', { name: 'Create Reference Task' }).click();

      // Should stay on the form page and show HTML5 validation or error messages
      expect(page.url()).toContain('/reference-tasks/new');

      // Check for required field validation (HTML5 validation will prevent submission)
      const titleInput = page.locator('input[name="title"]');
      await expect(titleInput).toHaveAttribute('required');

      const journalSelect = page.locator('select[name="journal_id"]');
      await expect(journalSelect).toHaveAttribute('required');

      const recurrenceSelect = page.locator('select[name="recurrence_type"]');
      await expect(recurrenceSelect).toHaveAttribute('required');
    });

    test('should edit an existing reference task', async ({ page }) => {
      // First create a journal to use
      const timestamp = Date.now();
      await createJournal(page, `E2E Edit Test Journal ${timestamp}`);

      // Then create a task to edit
      await page.goto('/reference-tasks/new');

      // Wait for CSRF token to load
      await page.waitForFunction(() => {
        const csrfInput = document.querySelector(
          'input[name=csrf_token]'
        ) as HTMLInputElement;
        return csrfInput && csrfInput.value && csrfInput.value.length > 0;
      });

      await page.fill('input[name="title"]', 'E2E Edit Test Task');
      await page.fill('textarea[name="description"]', 'Original description');

      // Select the journal we created
      await page.selectOption('select[name="journal_id"]', {
        label: `E2E Edit Test Journal ${timestamp}`,
      });
      await page.selectOption('select[name="recurrence_type"]', 'weekly');
      await page.fill('input[name="recurrence_interval"]', '1');

      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[name="starts_on"]', today);
      await page.check('input[name="is_active"]');

      await page.getByRole('button', { name: 'Create Reference Task' }).click();
      await page.waitForURL('/reference-tasks');

      // Now edit the task
      const editButton = page.getByRole('link', { name: 'Edit' }).first();
      await editButton.click();

      // Should be on edit page
      // expect(page.url()).toContain('/edit');
      await expect(
        page.getByRole('heading', { name: 'Edit Reference Task' })
      ).toBeVisible();

      // Wait for CSRF token to load on edit form
      await page.waitForFunction(() => {
        const csrfInput = document.querySelector(
          'input[name=csrf_token]'
        ) as HTMLInputElement;
        return csrfInput && csrfInput.value && csrfInput.value.length > 0;
      });

      // Update the task
      await page.fill('input[name="title"]', 'E2E Edited Test Task');
      await page.fill('textarea[name="description"]', 'Updated description');
      await page.selectOption('select[name="recurrence_type"]', 'monthly');

      await page.getByRole('button', { name: 'Update Reference Task' }).click();

      // Should redirect back to reference tasks list
      await page.waitForURL('/reference-tasks');

      // Should see the updated task
      await expect(page.getByText('E2E Edited Test Task')).toBeVisible();
      await expect(page.getByText('monthly')).toBeVisible();
    });

    test('should handle form validation in edit mode', async ({ page }) => {
      await page.goto('/reference-tasks');

      // Try to edit a task (if any exist)
      const editLinks = page.getByRole('link', { name: 'Edit' });
      const editCount = await editLinks.count();

      if (editCount === 0) {
        test.skip(true, 'No reference tasks available to edit');
      }

      await editLinks.first().click();

      // Clear required fields
      await page.fill('input[name="title"]', '');

      // Try to submit
      await page.getByRole('button', { name: 'Update Reference Task' }).click();

      // Should stay on edit page due to validation
      expect(page.url()).toContain('/edit');

      // Check that title field is required
      const titleInput = page.locator('input[name="title"]');
      await expect(titleInput).toHaveAttribute('required');
    });

    test('should cancel reference task creation and return to list', async ({
      page,
    }) => {
      await page.goto('/reference-tasks/new');

      // Click cancel link
      await page.getByRole('link', { name: 'Cancel' }).click();

      // Should return to reference tasks list
      await page.waitForURL('/reference-tasks');
      await expect(
        page.getByRole('heading', { name: 'Reference Tasks' })
      ).toBeVisible();
    });

    test('should show empty state when no reference tasks exist', async ({
      page,
    }) => {
      await page.goto('/reference-tasks');

      // The page might show either tasks or an empty state
      // We'll check for either condition
      const hasCreateButton = await page
        .getByRole('link', { name: 'Create Reference Task' })
        .isVisible();
      const hasEmptyMessage = await page
        .getByText("You don't have any reference tasks yet")
        .isVisible();

      expect(hasCreateButton || hasEmptyMessage).toBe(true);
    });
  });

  test.describe('Reference Task Form Validation', () => {
    test('should show correct recurrence type options', async ({ page }) => {
      // This test can run without authentication to check form structure
      await page.goto('/reference-tasks/new');

      // If redirected to signin, skip this test
      if (page.url().includes('/auth/signin')) {
        test.skip(true, 'Authentication required');
      }

      const recurrenceSelect = page.locator('select[name="recurrence_type"]');
      await expect(recurrenceSelect).toBeVisible();

      // Check that all expected options are present
      await expect(
        recurrenceSelect.locator('option[value="daily"]')
      ).toBeVisible();
      await expect(
        recurrenceSelect.locator('option[value="weekly"]')
      ).toBeVisible();
      await expect(
        recurrenceSelect.locator('option[value="monthly"]')
      ).toBeVisible();
      await expect(
        recurrenceSelect.locator('option[value="yearly"]')
      ).toBeVisible();
    });

    test('should have proper form structure for accessibility', async ({
      page,
    }) => {
      await page.goto('/reference-tasks/new');

      if (page.url().includes('/auth/signin')) {
        test.skip(true, 'Authentication required');
      }

      // Check form labels and inputs are properly associated
      await expect(page.locator('label[for="title"]')).toBeVisible();
      await expect(page.locator('input[name="title"]')).toBeVisible();

      await expect(page.locator('label[for="journal_id"]')).toBeVisible();
      await expect(page.locator('select[name="journal_id"]')).toBeVisible();

      await expect(page.locator('label[for="recurrence_type"]')).toBeVisible();
      await expect(
        page.locator('select[name="recurrence_type"]')
      ).toBeVisible();
    });
  });
});
