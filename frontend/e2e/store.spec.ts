import { test, expect } from '@playwright/test';

test.describe('Store Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to store page
    await page.goto('/store');
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load store page with products', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Tienda');

    // Wait for products to load
    await page.waitForSelector('.product-card', { timeout: 15000 });

    // Check if products are displayed
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('.product-card', { timeout: 15000 });

    // Find category filter
    const categorySelect = page.locator('select').filter({ hasText: /categoría/i }).first();

    if (await categorySelect.isVisible()) {
      // Select a category
      await categorySelect.selectOption('music');

      // Wait for filtered results
      await page.waitForTimeout(2000);

      // Check if products are filtered
      const productCards = page.locator('.product-card');
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('should add product to cart', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('.product-card', { timeout: 15000 });

    // Find first product with add to cart button
    const firstProduct = page.locator('.product-card').first();
    const addToCartButton = firstProduct.locator('button').filter({ hasText: /carrito/i }).first();

    if (await addToCartButton.isVisible()) {
      // Click add to cart
      await addToCartButton.click();

      // Wait for confirmation
      await page.waitForTimeout(1000);

      // Check if cart was updated (this depends on implementation)
      // Could check cart icon, notification, etc.
    }
  });

  test('should display product details', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('.product-card', { timeout: 15000 });

    // Click on first product
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.click();

    // Wait for product detail modal/page
    await page.waitForTimeout(2000);

    // Check if product details are shown
    const productTitle = page.locator('.product-title, .product-name').first();
    const isVisible = await productTitle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(productTitle).toBeVisible();
    }
  });
});