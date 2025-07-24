import { test, expect } from '@playwright/test';

test.describe('Rich text editing tests', () => {
  test('should handle rich text editor interactions', async ({ page }) => {
    // Navigate to a page with the rich text editor
    // This assumes that the daily-write page has a rich text editor
    await page.goto('/journals/daily-write');

    // Type some content into the editor
    // Adjust the selector to match your actual editor implementation
    await page.locator('.ProseMirror, [contenteditable="true"]').click();
    await page.keyboard.type('This is a test journal entry with *formatting*.');

    // Test formatting features - bold text
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+b');

    // Verify that formatting has been applied (this will depend on your editor)
    // In many editors, bold text is wrapped in <strong> tags
    const editorContent = await page
      .locator('.ProseMirror, [contenteditable="true"]')
      .innerHTML();
    expect(editorContent).toContain('<strong>');

    // Submit the entry (adjust selector as needed)
    await page.getByRole('button', { name: /save|submit/i }).click();

    // Verify successful submission (adjust based on your app's behavior)
    await expect(page.getByText(/saved|success/i)).toBeVisible();
  });
});
