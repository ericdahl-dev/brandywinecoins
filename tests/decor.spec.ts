import { test, expect } from '@playwright/test';

test.describe('decoration and content separation', () => {
  test('every image declares alt, and only the wordmark carries text', async ({ page }) => {
    await page.goto('/');

    // The live site does the inverse: content images with alt="" and no text
    // anywhere, which is why it reads as an empty page to crawlers and AT.
    const images = await page.locator('img').all();
    expect(images.length).toBeGreaterThan(0);

    const alts: string[] = [];
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt, 'img is missing an alt attribute entirely').not.toBeNull();
      alts.push(alt!);
    }

    // Ornament (emblem, laurel) must be silent; the wordmark must not be.
    expect(alts.filter((a) => a.trim() !== '')).toEqual(['Brandywine Coins']);
  });

  test('headline is never clipped by the viewport', async ({ page }) => {
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const box = await page
        .getByRole('heading', { name: 'Our Collection Opens Soon' })
        .boundingBox();

      expect(box, `no box at ${width}px`).not.toBeNull();
      expect(box!.x, `overflows left at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `overflows right at ${width}px`).toBeLessThanOrEqual(width);
    }
  });

  test('coin decoration never overlaps the headline', async ({ page }) => {
    for (const width of [375, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const headline = await page
        .getByRole('heading', { name: 'Our Collection Opens Soon' })
        .boundingBox();
      expect(headline).not.toBeNull();

      const coins = await page.locator('[class*="coin"]').all();
      for (const coin of coins) {
        if (!(await coin.isVisible())) continue;
        const c = await coin.boundingBox();
        if (!c) continue;

        const overlaps =
          c.x < headline!.x + headline!.width &&
          c.x + c.width > headline!.x &&
          c.y < headline!.y + headline!.height &&
          c.y + c.height > headline!.y;

        expect(overlaps, `coin collides with headline at ${width}px`).toBe(false);
      }
    }
  });
});
