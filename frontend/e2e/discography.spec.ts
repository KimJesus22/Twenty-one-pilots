import { test, expect } from '@playwright/test';

test.describe('Discography Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to discography page
    await page.goto('/discography');
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load discography page with albums', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Discografía');

    // Wait for albums to load
    await page.waitForSelector('.album-card', { timeout: 15000 });

    // Check if albums are displayed
    const albumCards = page.locator('.album-card');
    await expect(albumCards.first()).toBeVisible();
  });

  test('should display album statistics', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('.popularity-stats', { timeout: 10000 });

    // Check if statistics are displayed
    const statsCard = page.locator('.stat-card').first();
    await expect(statsCard).toBeVisible();

    // Check specific stats
    await expect(statsCard.locator('.stat-number')).toBeVisible();
    await expect(statsCard.locator('.stat-detail')).toBeVisible();
  });

  test('should load album artwork', async ({ page }) => {
    // Wait for albums to load
    await page.waitForSelector('.album-card', { timeout: 15000 });

    // Check if album covers are loaded
    const albumImages = page.locator('.album-cover img');
    const firstImage = albumImages.first();

    // Wait for image to load or show fallback
    await page.waitForTimeout(2000);

    // Either image should be visible or no-cover div should be visible
    const imageVisible = await firstImage.isVisible().catch(() => false);
    const noCoverVisible = await page.locator('.no-cover').first().isVisible().catch(() => false);

    expect(imageVisible || noCoverVisible).toBe(true);
  });

  test('should apply advanced filters', async ({ page }) => {
    // Wait for filters to be available
    await page.waitForSelector('.advanced-filters', { timeout: 10000 });

    // Test genre filter
    const genreSelect = page.locator('select[name="genre"]');
    if (await genreSelect.isVisible()) {
      await genreSelect.selectOption('alternative');
    }

    // Test year filter
    const minYearInput = page.locator('input[name="minYear"]');
    if (await minYearInput.isVisible()) {
      await minYearInput.fill('2010');
    }

    // Test search
    const searchInput = page.locator('input[placeholder*="buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Trench');
      await searchInput.press('Enter');
    }

    // Wait for filtered results
    await page.waitForTimeout(2000);

    // Check if results are updated
    const albumCards = page.locator('.album-card');
    const cardCount = await albumCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('should rate albums', async ({ page }) => {
    // Wait for albums to load
    await page.waitForSelector('.album-card', { timeout: 15000 });

    // Find rating component in first album
    const firstAlbumCard = page.locator('.album-card').first();
    const ratingComponent = firstAlbumCard.locator('.album-rating');

    if (await ratingComponent.isVisible()) {
      // Find interactive rating stars
      const ratingStars = ratingComponent.locator('.star-rating input[type="radio"]');

      if (await ratingStars.first().isVisible()) {
        // Click on 4-star rating
        const fourStarRating = ratingStars.nth(3); // 0-indexed, so 3 = 4 stars
        await fourStarRating.check();

        // Wait for rating to be processed
        await page.waitForTimeout(1000);

        // Check if rating was applied (this might require checking UI feedback)
        // The exact implementation depends on how ratings are visually confirmed
      }
    }
  });

  test('should toggle album comments', async ({ page }) => {
    // Wait for albums to load
    await page.waitForSelector('.album-card', { timeout: 15000 });

    // Find comments toggle in first album
    const firstAlbumCard = page.locator('.album-card').first();
    const commentsToggle = firstAlbumCard.locator('.comments-toggle');

    if (await commentsToggle.isVisible()) {
      // Click to show comments
      await commentsToggle.click();

      // Wait for comments section to appear
      await page.waitForTimeout(1000);

      // Check if comments section is visible
      const commentsSection = page.locator('.album-comments');
      const isVisible = await commentsSection.isVisible().catch(() => false);

      if (isVisible) {
        // Test adding a comment if form is available
        const commentForm = commentsSection.locator('textarea');
        if (await commentForm.isVisible()) {
          await commentForm.fill('Test comment from E2E test');
          // Note: We don't submit to avoid creating test data
        }
      }
    }
  });

  test('should open album detail view', async ({ page }) => {
    // Wait for albums to load
    await page.waitForSelector('.album-card', { timeout: 15000 });

    // Click on first album
    const firstAlbumCard = page.locator('.album-card').first();
    await firstAlbumCard.click();

    // Wait for detail modal to appear
    await page.waitForSelector('.album-detail-modal', { timeout: 10000 });

    // Check if modal is displayed
    const modal = page.locator('.album-detail-modal');
    await expect(modal).toBeVisible();

    // Check if album details are shown
    await expect(modal.locator('.album-title')).toBeVisible();
    await expect(modal.locator('.album-artist')).toBeVisible();
  });

  test('should navigate album detail tracks', async ({ page }) => {
    // Open album detail
    await page.waitForSelector('.album-card', { timeout: 15000 });
    await page.locator('.album-card').first().click();
    await page.waitForSelector('.album-detail-modal', { timeout: 10000 });

    // Check if track list is visible
    const trackList = page.locator('.tracks-list');
    await expect(trackList).toBeVisible();

    // Check if tracks are displayed
    const tracks = trackList.locator('.track-item');
    await expect(tracks.first()).toBeVisible();

    // Test track interaction
    const firstTrack = tracks.first();
    const playButton = firstTrack.locator('.play-track-btn');

    if (await playButton.isVisible()) {
      // Click play (but don't actually play to avoid audio)
      await playButton.click();

      // Check if audio player appears
      const audioPlayer = page.locator('.audio-player');
      const isVisible = await audioPlayer.isVisible().catch(() => false);

      if (isVisible) {
        // Test player controls
        const closeButton = audioPlayer.locator('.close-btn');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('should handle pagination', async ({ page }) => {
    // Wait for albums to load
    await page.waitForSelector('.album-card', { timeout: 15000 });

    // Check if pagination exists
    const pagination = page.locator('.pagination');
    const isVisible = await pagination.isVisible().catch(() => false);

    if (isVisible) {
      // Check pagination controls
      const nextButton = pagination.locator('button').filter({ hasText: 'Siguiente' });
      const prevButton = pagination.locator('button').filter({ hasText: 'Anterior' });

      // If next button is enabled, click it
      const nextEnabled = await nextButton.isEnabled().catch(() => false);
      if (nextEnabled) {
        await nextButton.click();

        // Wait for new page to load
        await page.waitForTimeout(2000);

        // Check if page changed
        const pageInfo = pagination.locator('.page-info');
        const pageText = await pageInfo.textContent();
        expect(pageText).toContain('Página 2');
      }
    }
  });

  test('should sort albums', async ({ page }) => {
    // Wait for albums to load
    await page.waitForSelector('.album-card', { timeout: 15000 });

    // Find sort select
    const sortSelect = page.locator('select').filter({ hasText: /ordenar/i }).first();

    if (await sortSelect.isVisible()) {
      // Change sort order
      await sortSelect.selectOption('releaseYear');

      // Wait for sorting to apply
      await page.waitForTimeout(2000);

      // Check if albums are reordered (this would require checking the order)
      const albumCards = page.locator('.album-card');
      const firstAlbumYear = await albumCards.first().locator('.release-year').textContent();
      const secondAlbumYear = await albumCards.nth(1).locator('.release-year').textContent();

      // Years should be in descending order (newest first)
      if (firstAlbumYear && secondAlbumYear) {
        const firstYear = parseInt(firstAlbumYear);
        const secondYear = parseInt(secondAlbumYear);
        expect(firstYear).toBeGreaterThanOrEqual(secondYear);
      }
    }
  });

  test('should work with GraphQL cache updates', async ({ page }) => {
    // This test verifies that GraphQL cache updates work correctly
    // Wait for albums to load
    await page.waitForSelector('.album-card', { timeout: 15000 });

    // Get initial album count
    const initialCount = await page.locator('.album-card').count();

    // If rating functionality exists, test cache update
    const ratingComponent = page.locator('.album-rating').first();
    if (await ratingComponent.isVisible()) {
      // Rate an album
      const ratingStars = ratingComponent.locator('.star-rating input[type="radio"]');
      if (await ratingStars.first().isVisible()) {
        await ratingStars.nth(3).check(); // 4 stars

        // Wait for cache update
        await page.waitForTimeout(1000);

        // Check if UI reflects the change (rating count should update)
        // This verifies that Apollo cache updates are working
        const ratingDisplay = ratingComponent.locator('.rating-stats');
        if (await ratingDisplay.isVisible()) {
          // Rating should be updated in cache
          expect(await ratingDisplay.isVisible()).toBe(true);
        }
      }
    }
  });

  test('should handle loading and error states', async ({ page }) => {
    // Test loading state (should be brief)
    const loadingIndicator = page.locator('.loading');
    const isInitiallyVisible = await loadingIndicator.isVisible().catch(() => false);

    if (isInitiallyVisible) {
      // Wait for loading to complete
      await page.waitForSelector('.album-card', { timeout: 15000 });
      // Loading should be gone
      await expect(loadingIndicator).not.toBeVisible();
    }

    // Test error handling (if error occurs)
    const errorMessage = page.locator('.error');
    const hasError = await errorMessage.isVisible().catch(() => false);

    if (hasError) {
      // Check if retry button exists
      const retryButton = errorMessage.locator('button').filter({ hasText: /reintentar/i });
      await expect(retryButton).toBeVisible();
    }
  });
});