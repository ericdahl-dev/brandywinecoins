import { test, expect } from '@playwright/test';

/**
 * All three actions have to be reachable without scrolling.
 *
 * The hero's `min-height` is a floor, not a cap, and every part of the crest was
 * sized off `--crest-w`, which came only from inline size. So on a short
 * viewport nothing gave way -- the hero grew past the fold and took the buttons
 * with it. At 1366x768 the nav started 811px down a 768px screen; on an 874x360
 * landscape phone the visitor got two and a half screens of logo before
 * anything to press.
 *
 * The sizes below are the ones that failed, plus the two that always passed, so
 * a fix that trades one for the other cannot land quietly.
 */
test.describe('primary actions above the fold', () => {
  for (const [width, height] of [
    [1440, 900],
    [1366, 768],
    [1280, 800],
    [1024, 640],
    [874, 360],
    [768, 1024],
    [390, 844],
    [320, 568],
  ]) {
    test(`all three are in the first screen at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      const nav = page.getByRole('navigation', { name: 'Primary' });
      const box = await nav.boundingBox();
      expect(box, 'the primary nav is not in the layout').not.toBeNull();

      const bottom = box!.y + box!.height;
      expect(
        bottom,
        `nav ends ${Math.round(bottom)}px down a ${height}px screen`,
      ).toBeLessThanOrEqual(height);

      // Every one of them, not just the row's box: at narrow widths they stack,
      // and it is the last of the three that falls off.
      for (const name of ['About Us', 'Get in Touch', 'Shop']) {
        const link = await nav.getByRole('link', { name }).boundingBox();
        expect(link, `${name} is not in the layout`).not.toBeNull();
        expect(
          link!.y + link!.height,
          `${name} ends ${Math.round(link!.y + link!.height)}px down a ${height}px screen`,
        ).toBeLessThanOrEqual(height);
      }
    });
  }
});
