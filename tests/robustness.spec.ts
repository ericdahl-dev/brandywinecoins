import { test, expect } from '@playwright/test';

/**
 * The business name has to survive the wordmark failing to load.
 *
 * The h1's only text is the alt on its image, and the heading used to carry
 * `line-height: 0` to collapse the image's inline line box. With the box zeroed,
 * a failed request rendered "Brandywine Coins" sliced through the middle and
 * overlapping the emblem. Same-origin SVG, so it is unlikely -- but this repo's
 * own history is a run of assets failing in ways nobody noticed, which is what
 * the traced wordmark was about in the first place.
 */
test('the business name still reads if the wordmark fails', async ({ page }) => {
  await page.route('**/art/wordmark.svg', (route) => route.abort());
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveAccessibleName('Brandywine Coins');

  const box = await heading.boundingBox();
  expect(box, 'the h1 is not in the layout').not.toBeNull();
  // A collapsed line box measures a couple of px; a rendered line measures tens.
  expect(box!.height, `the h1 is ${box!.height.toFixed(1)}px tall with no image`)
    .toBeGreaterThan(16);
});

/**
 * Activating an in-page anchor has to move focus into what it scrolled to.
 *
 * Without a tabindex on the target, focus stays on the link: the page moves and
 * the next Tab carries on through the nav rather than into the content the
 * visitor just asked for.
 */
test.describe('in-page anchors move focus', () => {
  for (const [name, id] of [
    ['About Us', 'about'],
    ['Shop', 'shop'],
  ]) {
    test(`${name} lands focus in #${id}`, async ({ page }) => {
      await page.goto('/');

      await page.getByRole('navigation', { name: 'Primary' })
        .getByRole('link', { name })
        .press('Enter');

      const landed = await page.evaluate((target) => {
        const section = document.getElementById(target);
        const active = document.activeElement;
        return !!section && !!active && (section === active || section.contains(active));
      }, id);

      expect(landed, `focus is not inside #${id} after activating ${name}`).toBe(true);
    });
  }
});
