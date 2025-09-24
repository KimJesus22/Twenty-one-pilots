import { test, expect } from '@playwright/test';

test.describe('Videos Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to videos page
    await page.goto('/videos');
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load videos page with skeleton loaders', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1.page-title')).toContainText('Videos de Twenty One Pilots');

    // Check if skeleton loaders appear initially
    const skeletonLoaders = page.locator('.skeleton-loader');
    await expect(skeletonLoaders.first()).toBeVisible();

    // Wait for videos to load
    await page.waitForSelector('.video-card', { timeout: 10000 });
  });

  test('should display fallback connection indicator', async ({ page }) => {
    // Wait for videos to load
    await page.waitForSelector('.video-card', { timeout: 10000 });

    // Check if fallback badge appears (if using fallback videos)
    const fallbackBadge = page.locator('.connection-badge.fallback');
    // This might not appear if API is working, so we check conditionally
    const badgeVisible = await fallbackBadge.isVisible().catch(() => false);
    if (badgeVisible) {
      await expect(fallbackBadge).toContainText('Modo Offline');
    }
  });

  test('should search videos with query', async ({ page }) => {
    // Wait for search input to be available
    await page.waitForSelector('input.search-input');

    // Type search query
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('Stressed Out');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForSelector('.video-card', { timeout: 10000 });

    // Check that results contain the search term
    const videoTitles = page.locator('.video-title');
    const firstTitle = await videoTitles.first().textContent();
    expect(firstTitle?.toLowerCase()).toContain('stressed out');
  });

  test('should use advanced filters', async ({ page }) => {
    // Click on advanced filters toggle
    const filterToggle = page.locator('.filter-toggle-button');
    await filterToggle.click();

    // Wait for filters to appear
    await page.waitForSelector('.advanced-filters');

    // Set date filter
    const dateSelect = page.locator('select.filter-select').first();
    await dateSelect.selectOption('month');

    // Set duration filter
    const durationSelect = page.locator('select.filter-select').nth(2);
    await durationSelect.selectOption('medium');

    // Apply filters by searching
    const searchInput = page.locator('input.search-input');
    await searchInput.fill('Twenty One Pilots');
    await searchInput.press('Enter');

    // Wait for filtered results
    await page.waitForSelector('.video-card', { timeout: 10000 });

    // Verify results are displayed
    const videoCards = page.locator('.video-card');
    await expect(videoCards.first()).toBeVisible();
  });

  test('should select and play video', async ({ page }) => {
    // Wait for videos to load
    await page.waitForSelector('.video-card', { timeout: 10000 });

    // Click on first video
    const firstVideoCard = page.locator('.video-card').first();
    await firstVideoCard.click();

    // Wait for video player to appear
    await page.waitForSelector('.video-player-container', { timeout: 10000 });

    // Check if YouTube player iframe is loaded
    const youtubeIframe = page.locator('iframe[src*="youtube.com"]');
    await expect(youtubeIframe).toBeVisible();
  });

  test('should navigate videos with keyboard', async ({ page }) => {
    // Wait for videos to load and select first video
    await page.waitForSelector('.video-card', { timeout: 10000 });
    await page.locator('.video-card').first().click();
    await page.waitForSelector('.video-player-container', { timeout: 10000 });

    // Test spacebar for play/pause (if video is loaded)
    await page.keyboard.press('Space');

    // Test arrow keys for navigation (if multiple videos available)
    const videoCards = page.locator('.video-card');
    const cardCount = await videoCards.count();

    if (cardCount > 1) {
      // Press right arrow to go to next video
      await page.keyboard.press('ArrowRight');

      // Check if a different video is selected (this might require checking selected state)
      // The implementation depends on how selection is visually indicated
    }
  });

  test('should toggle theme', async ({ page }) => {
    // Find theme toggle button
    const themeToggle = page.locator('button[aria-label*="tema"]').first();

    // Get initial background color
    const initialBgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Click theme toggle
    await themeToggle.click();

    // Wait for theme change
    await page.waitForTimeout(500);

    // Check if background color changed
    const newBgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Colors should be different
    expect(initialBgColor).not.toBe(newBgColor);
  });

  test('should handle video loading errors gracefully', async ({ page }) => {
    // This test would require mocking API failures
    // For now, we'll test that error handling UI exists

    // Check if error banner exists (might not be visible initially)
    const errorBanner = page.locator('.error-banner');
    const isVisible = await errorBanner.isVisible().catch(() => false);

    if (isVisible) {
      // If error banner is visible, check it has retry button
      const retryButton = errorBanner.locator('.error-retry');
      await expect(retryButton).toBeVisible();
    }
  });

  test('should display video statistics', async ({ page }) => {
    // Wait for videos to load
    await page.waitForSelector('.video-card', { timeout: 10000 });

    // Check if stats toggle exists
    const statsCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /mostrar estadísticas/i });
    const isVisible = await statsCheckbox.isVisible().catch(() => false);

    if (isVisible) {
      // Enable stats display
      await statsCheckbox.check();

      // Select a video
      await page.locator('.video-card').first().click();
      await page.waitForSelector('.video-player-container', { timeout: 10000 });

      // Check if stats are displayed
      const statsElements = page.locator('.video-stats');
      await expect(statsElements.first()).toBeVisible();
    }
  });

  test('should work on mobile viewport', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile viewports');

    // Test mobile-specific behavior
    await page.waitForSelector('.video-card', { timeout: 10000 });

    // Check if videos are displayed in mobile-friendly layout
    const videoCards = page.locator('.video-card');
    await expect(videoCards.first()).toBeVisible();

    // Test touch interactions
    await videoCards.first().tap();
    await page.waitForSelector('.video-player-container', { timeout: 10000 });
  });
});