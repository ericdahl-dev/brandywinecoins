import { expect, test } from '@playwright/test';

/**
 * Type has to stay readable on a phone.
 *
 * Reported by the owner, whose customers skew over 50 -- coin collecting does.
 * Every size on mobile was sitting at the floor of its clamp, because the fluid
 * `cqi` term never wins at phone widths, and the floors were set low.
 *
 * Cormorant Garamond makes it worse than the number suggests: it has an
 * unusually small x-height, so its lowercase reads a size or so smaller than the
 * same point size in a UI face.
 *
 * Asserted as floors at the widths where the floor is what applies. Desktop is
 * deliberately not covered -- it was never the complaint, and pinning it would
 * make retuning the fluid range harder for no benefit.
 */
const PHONES = [
  [320, 568],
  [390, 844],
  [430, 932],
] as const;

const sizeOf = async (page: import('@playwright/test').Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

test.describe('readable on a phone', () => {
  for (const [width, height] of PHONES) {
    test(`the About prose is at least 19px at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const size = await sizeOf(page, '#about [class*="prose"] p');
      expect(size, `About prose is ${size}px`).toBeGreaterThanOrEqual(19);
    });
  }

  for (const [width, height] of PHONES) {
    test(`the Shop copy is at least 18px at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const size = await sizeOf(page, '#shop [class*="plateBody"]');
      expect(size, `Shop copy is ${size}px`).toBeGreaterThanOrEqual(18);
    });
  }

  for (const [width, height] of PHONES) {
    test(`the hero's closing line is at least 14px at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const size = await sizeOf(page, '[class*="patience"]');
      expect(size, `hero closing line is ${size}px`).toBeGreaterThanOrEqual(14);
    });
  }

  for (const [width, height] of PHONES) {
    test(`the pull quote is at least 20px at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const size = await sizeOf(page, '#about [class*="pullQuote"]');
      expect(size, `pull quote is ${size}px`).toBeGreaterThanOrEqual(20);
    });
  }

  for (const [width, height] of PHONES) {
    test(`the action labels are at least 17px at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const size = await sizeOf(page, 'nav[aria-label="Primary"] a');
      expect(size, `action label is ${size}px`).toBeGreaterThanOrEqual(17);
    });
  }
});
