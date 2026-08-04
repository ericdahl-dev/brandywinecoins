import { test, expect } from '@playwright/test';

import { CONTACT_HREF } from '../lib/business';

// Scoped to the nav landmark: #shop deliberately repeats the Get in Touch
// action, so an unscoped query would be ambiguous by design.
const nav = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'Primary' });

test.describe('primary actions', () => {
  test('exposes About Us, Shop and Get in Touch as links', async ({ page }) => {
    await page.goto('/');

    // Links, not buttons: two are in-page anchors and one is a mailto, so
    // native semantics (middle-click, copy link, no-JS) are correct.
    for (const name of ['About Us', 'Shop', 'Get in Touch']) {
      await expect(nav(page).getByRole('link', { name, exact: true })).toHaveCount(1);
    }
  });

  test('Get in Touch preserves the existing mailto address', async ({ page }) => {
    await page.goto('/');

    await expect(
      nav(page).getByRole('link', { name: 'Get in Touch', exact: true }),
    ).toHaveAttribute('href', CONTACT_HREF);
  });

  test('About Us and Shop point at sections that exist', async ({ page }) => {
    await page.goto('/');

    for (const [name, id] of [
      ['About Us', 'about'],
      ['Shop', 'shop'],
    ] as const) {
      await expect(
        nav(page).getByRole('link', { name, exact: true }),
      ).toHaveAttribute('href', `#${id}`);
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test('every action is a large enough touch target at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');

    for (const name of ['About Us', 'Shop', 'Get in Touch']) {
      const box = await nav(page)
        .getByRole('link', { name, exact: true })
        .boundingBox();
      expect(box, `${name} has no box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
      expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(44);
    }
  });
});

/**
 * The primary action sits on the page's centre line.
 *
 * Everything above it is centred on that axis, so a primary that is not reads as
 * a mistake. A centred flex row did not do this: it centres the group, and
 * because "About Us" is a shorter label than "Get in Touch" the difference put
 * Shop 22 to 25px left at every width. Caught by the owner with reference lines
 * over a screenshot, not by this suite, which is why it is now in this suite.
 */
test.describe('the primary action is centred', () => {
  for (const [width, height] of [
    [1440, 900],
    [1024, 800],
    [700, 800],
    [540, 800],
  ] as const) {
    test(`at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      const shop = (await nav(page).getByRole('link', { name: 'Shop', exact: true }).boundingBox())!;
      const centre = shop.x + shop.width / 2;

      expect(
        Math.abs(centre - width / 2),
        `Shop's centre is ${centre.toFixed(1)}, page centre is ${width / 2}`,
      ).toBeLessThan(1.5);
    });
  }

  test('the outer two actions are the same width, so the centring is structural', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const about = (await nav(page).getByRole('link', { name: 'About Us', exact: true }).boundingBox())!;
    const touch = (await nav(page).getByRole('link', { name: 'Get in Touch', exact: true }).boundingBox())!;
    // Equal outer widths are what put the middle track on the centre line. Lose
    // this and the centring above goes with it.
    expect(Math.abs(about.width - touch.width)).toBeLessThan(1);
  });
});
