import { test, expect, type Page } from '@playwright/test';

/**
 * The hero's field brightness, asserted on rendered pixels.
 *
 * Nothing in this suite looked at colour before, which is how the plate drifted
 * a third of its brightness darker at the edges without anything noticing
 * (issue #13). Configuration assertions would not have caught it either: every
 * value involved was individually defensible, and the drift was in the asset.
 *
 * Chromium decodes the screenshot for us -- a data: URL into a canvas -- so
 * this needs no image library.
 */
async function meanLuma(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
): Promise<number> {
  const png = (await page.screenshot({ clip })).toString('base64');
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
    return sum / (data.length / 4);
  }, png);
}

// A band immediately inside the top frame line, across the middle of the page:
// above the crest, and the coins are at the bottom corners, so it is field only.
// The live original measures about 11 here; the band is wide enough for encoder
// drift and narrow enough to catch the 3x error #13 was about.
const FIELD_MIN = 7;
const FIELD_MAX = 16;

// Clear of both frame lines -- the inner ring sits a gap below the outer one --
// and well above the crest at every width.
const FIELD_BAND = (inset: number, x: number, w: number) => ({
  x,
  y: inset + 12,
  width: w,
  height: 10,
});

test.describe('hero field brightness', () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    test(`sits in the band the artwork sets at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      // The plate is inset by exactly the frame inset, so its box locates the
      // frame line without having to resolve a clamp() out of a custom property.
      const inset = (await page.locator('section > div').first().boundingBox())!.y;
      const x = Math.round(width * 0.3);
      const w = Math.round(width * 0.4);
      const inside = await meanLuma(page, FIELD_BAND(inset, x, w));

      expect(inside, `hero field is ${inside.toFixed(2)}, outside ${FIELD_MIN}..${FIELD_MAX}`)
        .toBeGreaterThan(FIELD_MIN);
      expect(inside).toBeLessThan(FIELD_MAX);
    });

    test(`has no step across the frame line at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      const inset = (await page.locator('section > div').first().boundingBox())!.y;
      const x = Math.round(width * 0.3);
      const w = Math.round(width * 0.4);

      // The plate is cut to the frame and composited over the gradient, so the
      // gradient has to be the plate's own field or the margin reads as a
      // different colour from the field it borders.
      const outside = await meanLuma(page, { x, y: 1, width: w, height: Math.max(4, inset - 3) });
      const inside = await meanLuma(page, FIELD_BAND(inset, x, w));

      expect(
        Math.abs(outside - inside),
        `step across the frame line: outside ${outside.toFixed(2)} vs inside ${inside.toFixed(2)}`,
      ).toBeLessThan(2.5);
    });
  }
});
