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
