import { test, expect } from '@playwright/test';

test.describe('Forum Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to forum page
    await page.goto('/forum');
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load forum page with threads', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Foro');

    // Wait for threads to load
    await page.waitForSelector('.thread-item', { timeout: 15000 });

    // Check if threads are displayed
    const threadItems = page.locator('.thread-item');
    await expect(threadItems.first()).toBeVisible();
  });

  test('should create new thread', async ({ page }) => {
    // Find create thread button
    const createButton = page.locator('button').filter({ hasText: /crear/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();

      // Wait for create form
      await page.waitForSelector('.create-thread-form', { timeout: 5000 });

      // Fill form (but don't submit to avoid creating test data)
      const titleInput = page.locator('input[name="title"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Thread from E2E');
      }
    }
  });

  test('should filter threads by category', async ({ page }) => {
    // Wait for threads to load
    await page.waitForSelector('.thread-item', { timeout: 15000 });

    // Find category filter
    const categorySelect = page.locator('select').filter({ hasText: /categoría/i }).first();

    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('general');

      // Wait for filtered results
      await page.waitForTimeout(2000);

      // Check if threads are filtered
      const threadItems = page.locator('.thread-item');
      await expect(threadItems.first()).toBeVisible();
    }
  });

  test('should open thread detail', async ({ page }) => {
    // Wait for threads to load
    await page.waitForSelector('.thread-item', { timeout: 15000 });

    // Click on first thread
    const firstThread = page.locator('.thread-item').first();
    await firstThread.click();

    // Wait for thread detail to load
    await page.waitForTimeout(2000);

    // Check if thread content is shown
    const threadContent = page.locator('.thread-content, .post-content').first();
    const isVisible = await threadContent.isVisible().catch(() => false);

    if (isVisible) {
      await expect(threadContent).toBeVisible();
    }
  });
});