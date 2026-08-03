import { test, expect, type Locator } from '@playwright/test';

/** boundingBox() gives x/y/width/height; the checks below are about edges. */
async function edges(locator: Locator, what: string) {
  const box = await locator.boundingBox();
  expect(box, `${what} is not in the layout`).not.toBeNull();
  const { x, y, width, height } = box!;
  return { left: x, top: y, right: x + width, bottom: y + height };
}

/**
 * The decorative plate has to stop at the ornamental frame.
 *
 * Run full bleed it looks fine on a tall viewport and breaks on a short one:
 * `cover` scales the coins up until they cross the frame line and are then
 * sheared off at the section edge, leaving slivers of coin stranded outside
 * the border. Short landscape phones hit this; portrait ones do not, which is
 * why the sizes below include a wide-and-short pair.
 */
test.describe('decorative plate', () => {
  for (const [width, height] of [
    [874, 360],
    [932, 430],
    [1440, 900],
    [768, 500],
    [390, 844],
    [320, 568],
  ]) {
    test(`stays inside the frame at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      const plate = await edges(page.getByTestId('hero-plate'), 'the plate');
      const ring = await edges(page.getByTestId('frame-ring-outer'), 'the outer frame ring');
      const hero = await edges(page.getByTestId('hero'), 'the hero');

      // Contained by the frame, within a rounding pixel.
      expect(plate.left, 'plate bleeds past the left frame line').toBeGreaterThanOrEqual(ring.left - 1);
      expect(plate.top, 'plate bleeds past the top frame line').toBeGreaterThanOrEqual(ring.top - 1);
      expect(plate.right, 'plate bleeds past the right frame line').toBeLessThanOrEqual(ring.right + 1);
      expect(plate.bottom, 'plate bleeds past the bottom frame line').toBeLessThanOrEqual(ring.bottom + 1);

      // And genuinely inset, so a frame that collapsed to zero cannot pass this.
      expect(plate.left - hero.left, 'plate is not inset from the section').toBeGreaterThan(4);
      expect(hero.bottom - plate.bottom, 'plate is not inset from the section').toBeGreaterThan(4);
    });
  }
});

/**
 * The frame's rings and the plate are siblings, so both cut to a --frame-inset
 * that has to come from their shared ancestor. Hero.module.css picks it up by
 * composing Frame's host class.
 *
 * Guarded because the failure mode is quiet: drop the composes and `inset:
 * var(--frame-inset)` resolves to `auto`, which collapses the rings and the
 * plate rather than throwing. The geometry checks above do catch that, but they
 * report it as six failed bounding boxes. This one names the cause.
 */
test('the hero supplies the frame inset', async ({ page }) => {
  await page.goto('/');
  const inset = await page
    .getByTestId('hero')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--frame-inset').trim());
  expect(inset, '--frame-inset is not reaching the hero').not.toBe('');
});

/**
 * Which plate is loaded, either side of the 47rem switch in Hero.module.css.
 *
 * The two are drawn differently -- the landscape one puts its coins in the
 * corners, the portrait one near the left and right edges -- so `cover` on the
 * wrong one crops away the part worth keeping. Nothing asserted this before, so
 * the two were interchangeable as far as the suite was concerned.
 *
 * 47rem is 752px at the default root size, and the query is max-width, so 752
 * is the last portrait width and 753 the first landscape one.
 */
test.describe('plate at the breakpoint', () => {
  for (const [width, expected] of [
    [753, 'bg-desktop'],
    [752, 'bg-mobile'],
    [1440, 'bg-desktop'],
    [390, 'bg-mobile'],
  ] as const) {
    test(`loads ${expected} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      const image = await page
        .getByTestId('hero-plate')
        .evaluate((el) => getComputedStyle(el).backgroundImage);

      expect(image, `plate at ${width}px is ${image}`).toContain(expected);
    });
  }
});
