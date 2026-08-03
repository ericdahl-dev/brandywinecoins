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
type Clip = { x: number; y: number; width: number; height: number };

// fullPage matters below the fold: a clip outside the viewport is an error, not
// a scroll. The section boundaries are the only samples that need it.
async function luma(page: Page, clip: Clip, fullPage = false): Promise<number[]> {
  const png = (await page.screenshot({ clip, fullPage })).toString('base64');
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
    const out: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      out.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    }
    return out;
  }, png);
}

async function meanLuma(page: Page, clip: Clip, fullPage = false): Promise<number> {
  const v = await luma(page, clip, fullPage);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
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
      const inset = (await page.getByTestId('hero-plate').boundingBox())!.y;
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

      const inset = (await page.getByTestId('hero-plate').boundingBox())!.y;
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

/**
 * The ghost watermark in the upper right.
 *
 * It shares the plate with the coins, so the opacity the coins want leaves it
 * at a quarter strength -- which is what happened. The masked second layer
 * restores it, and this is the guard that it stays restored: measured as how
 * far the mark rises above the field around it, the live original gives 12.1
 * and a plate with no ghost layer at all gives 3.1.
 */
test('ghost watermark rises off the field', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const v = await luma(page, { x: 1050, y: 40, width: 370, height: 380 });
  const excess = percentile(v, 97) - percentile(v, 25);

  expect(excess, `ghost rises ${excess.toFixed(2)} above its field`).toBeGreaterThan(5.5);
  expect(excess).toBeLessThan(16);
});

/**
 * The page's sections have to meet without a seam.
 *
 * Each section used to restart an opaque vignette at its own top, so one
 * gradient's dark end butted against the next one's light start and drew a hard
 * 1px line across the full width: rgb(3,7,15) to rgb(5,13,24) at the about/shop
 * boundary. Small in absolute terms, and exactly the kind of hard horizontal
 * edge the eye catches on a near-black field -- it reads as a rendering bug.
 *
 * Sampled in a column at the far left, which carries background and nothing
 * else at every width.
 */
test('sections meet without a step', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const boundaries = await page.evaluate(() =>
    Array.from(document.querySelectorAll('section'))
      .map((el) => Math.round(el.getBoundingClientRect().bottom + window.scrollY))
      .slice(0, -1),
  );
  expect(boundaries.length, 'expected at least one section boundary').toBeGreaterThan(0);

  for (const y of boundaries) {
    const above = await meanLuma(page, { x: 4, y: y - 5, width: 20, height: 3 }, true);
    const below = await meanLuma(page, { x: 4, y: y + 2, width: 20, height: 3 }, true);
    expect(
      Math.abs(above - below),
      `step of ${Math.abs(above - below).toFixed(2)} at the boundary on y=${y}`,
    ).toBeLessThan(0.8);
  }
});
