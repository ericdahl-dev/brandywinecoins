import { test, expect } from '@playwright/test';

const WIDTHS = [320, 375, 414, 768, 1024, 1440, 1920];

test.describe('responsive layout', () => {
  for (const width of WIDTHS) {
    test(`does not scroll horizontally at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(scrollWidth, `overflows by ${scrollWidth - clientWidth}px`).toBeLessThanOrEqual(
        clientWidth,
      );
    });
  }
});
