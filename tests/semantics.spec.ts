import { test, expect } from '@playwright/test';

test.describe('page semantics', () => {
  test('exposes exactly one h1 named "Brandywine Coins"', async ({ page }) => {
    await page.goto('/');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveAccessibleName('Brandywine Coins');
  });

  test('has a descriptive title and meta description', async ({ page }) => {
    await page.goto('/');

    // The live site ships neither, which is why it is invisible to search.
    await expect(page).toHaveTitle(/Brandywine Coins/);

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(description?.trim().length ?? 0).toBeGreaterThan(50);
    expect(description).toMatch(/Wilmington/);
  });
});
