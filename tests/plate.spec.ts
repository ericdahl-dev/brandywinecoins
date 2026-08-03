import { test, expect } from '@playwright/test';

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

      const rects = await page.evaluate(() => {
        const hero = document.querySelector('section')!;
        const kids = Array.from(hero.children) as HTMLElement[];
        // The plate is the only element carrying the artwork as a background.
        const plate = kids.find((el) =>
          getComputedStyle(el).backgroundImage.includes('/art/bg-'),
        );
        // The frame's outer ring owns the corner squares, which are the only
        // things on the page rounded to a full 100%.
        const corner = hero.querySelector<HTMLElement>('span');
        const ring = corner?.parentElement ?? null;
        const box = (el: Element | null) => (el ? el.getBoundingClientRect().toJSON() : null);
        return { plate: box(plate ?? null), ring: box(ring), hero: box(hero) };
      });

      expect(rects.plate, 'no element is painting the plate').not.toBeNull();
      expect(rects.ring, 'no frame ring found').not.toBeNull();

      const { plate, ring, hero } = rects as Record<string, DOMRect>;

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
  const inset = await page.evaluate(() =>
    getComputedStyle(document.querySelector('section')!)
      .getPropertyValue('--frame-inset')
      .trim(),
  );
  expect(inset, '--frame-inset is not reaching the hero').not.toBe('');
});
