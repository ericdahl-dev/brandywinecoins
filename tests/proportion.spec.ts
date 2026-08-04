import { expect, test } from '@playwright/test';

/**
 * The artwork (`public/art/bg-desktop.webp`, 1535x1024) puts the wordmark at
 * about 46% of the plate's width. `--crest-w` was capped at 700px while the
 * plate kept scaling with the viewport under `background-size: cover`, so above
 * roughly 1535px the two came apart: at 2560 the wordmark was 27% of the
 * viewport and the left coin's portrait was taller than the wordmark's caps.
 *
 * Asserted on the rendered proportion rather than on the CSS, so it holds
 * whichever term ends up binding.
 */
const WIDE = [
  [1920, 1080],
  [2560, 1440],
] as const;

test.describe('the composition on a wide monitor', () => {
  for (const [width, height] of WIDE) {
    test(`keeps the wordmark a real share of the page at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const markWidth = await page
        .locator('h1 img')
        .evaluate((el) => el.getBoundingClientRect().width);
      const share = markWidth / width;
      expect(
        share,
        `the wordmark is ${(share * 100).toFixed(1)}% of the viewport (${Math.round(markWidth)}px of ${width})`,
      ).toBeGreaterThanOrEqual(0.4);
    });
  }

  for (const [width, height] of WIDE) {
    test(`keeps the mark clear of the corner coins at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const box = (await page.getByRole('heading', { name: 'Brandywine Coins' }).boundingBox())!;
      // The other half of the fix. Letting the mark grow is only correct while
      // it still clears the artwork -- the coins occupy roughly the outer 24%
      // of the plate, and a mark that grows into them trades one composition
      // bug for a worse one. `decor.spec.ts` guards this at height 900, where
      // the crest's svh budget binds and the mark never reaches its vw term;
      // these are the sizes where it does.
      const minGap = width * 0.22;
      expect(box.x, `the mark runs into the left coin at ${width}x${height}`).toBeGreaterThan(
        minGap,
      );
      expect(
        width - (box.x + box.width),
        `the mark runs into the right coin at ${width}x${height}`,
      ).toBeGreaterThan(minGap);
    });
  }
});
