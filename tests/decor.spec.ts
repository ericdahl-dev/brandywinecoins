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

  // The coins now live in the hero's background plate rather than as elements,
  // so there is no box to measure and an overlap assertion would pass
  // vacuously. What still matters is that the content column stays inside a
  // centre safe zone, since the corner artwork is what occupies the edges.
  test('content stays within the centre safe zone', async ({ page }) => {
    for (const width of [768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      for (const name of ['Our Collection Opens Soon', 'Brandywine Coins']) {
        const box = await page
          .getByRole('heading', { name })
          .boundingBox();
        expect(box, `${name} has no box at ${width}px`).not.toBeNull();

        const leftGap = box!.x;
        const rightGap = width - (box!.x + box!.width);

        // The corner coins occupy roughly the outer 24% of the plate on each
        // side at desktop widths. Requiring a proportional margin -- not a
        // fixed px gap -- is what actually keeps text out of the artwork; a
        // 24px bound passed while the headline sat on top of both coins.
        const minGap = width >= 1200 ? width * 0.22 : 24;
        expect(leftGap, `${name} runs into left coin at ${width}px`).toBeGreaterThan(minGap);
        expect(rightGap, `${name} runs into right coin at ${width}px`).toBeGreaterThan(minGap);

        // Centred to within a few px, so it never drifts toward one coin.
        expect(
          Math.abs(leftGap - rightGap),
          `${name} off-centre at ${width}px`,
        ).toBeLessThan(8);
      }
    }
  });
});
