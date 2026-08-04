import { expect, test } from '@playwright/test';

import { BUSINESS } from '../lib/business';

/**
 * The defect this covers: the contact address existed only inside
 * `href="mailto:"` and the structured data, so a visitor with no mail client
 * bound to `mailto:` clicked the site's primary action and nothing happened --
 * with no other way to reach Mike, and no symptom anyone could see.
 *
 * Asserted on what a visitor can read and copy rather than on markup, so the
 * tests survive whatever the footer is built out of.
 */
test.describe('the footer', () => {
  for (const width of [320, 1440]) {
    test(`puts the contact email on the page as text at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const visible = await page.locator('body').innerText();
      expect(visible, 'the email is nowhere a visitor could read or copy it').toContain(
        BUSINESS.email,
      );
    });
  }

  test('fits the address on the narrowest phone without spilling the page', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    // An email address has no break opportunity a browser will take by default,
    // so a long one at a large size pushes the document wider than the viewport
    // and every section on the page gains a horizontal scrollbar.
    const spill = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(spill, `the page scrolls ${spill}px sideways at 320px`).toBeLessThanOrEqual(0);
  });

  test('sends every contact link with a subject, so Mike can triage', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('a[href^="mailto:"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    );
    expect(hrefs.length, 'no mailto link on the page at all').toBeGreaterThan(0);
    // Every one of them, not just the footer's: they all land in the same
    // inbox, and one without a subject is one Mike has to open to classify.
    for (const href of hrefs) {
      expect(href, `${href} arrives with a blank subject line`).toContain('subject=');
    }
  });

  test('closes the page, below the Shop section', async ({ page }) => {
    await page.goto('/');
    const shopBottom = await page
      .locator('#shop')
      .evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    const footerTop = await page
      .locator('footer')
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    expect(
      footerTop,
      `footer starts at ${footerTop}, above the end of #shop at ${shopBottom}`,
    ).toBeGreaterThanOrEqual(shopBottom);
  });

  test('claims the work, with a year that is not stale', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('footer').innerText();
    expect(text, 'no copyright line').toContain('©');
    expect(text, 'the copyright names nobody').toContain(BUSINESS.name);
    // The year, not a hardcoded one. A footer reading 2026 in 2028 is the
    // clearest signal a site has been abandoned, which is the opposite of what
    // a footer on a dealer's site is for.
    expect(text, 'the copyright year is not the current one').toContain(
      String(new Date().getFullYear()),
    );
  });
});
