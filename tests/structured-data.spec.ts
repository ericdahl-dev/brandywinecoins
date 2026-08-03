import { expect, test } from '@playwright/test';

import { BUSINESS } from '../lib/business';

/**
 * The structured data had no test at all, which mattered because
 * `README.md:11-14` names missing structured data as a primary defect of the old
 * site and a reason for the rebuild. A malformed or absent script tag shipped
 * green, and the symptom would have been invisible on the page.
 *
 * Asserted on the claims rather than the whole blob, so adding a field does not
 * fail the build but dropping or breaking one does.
 */
test.describe('structured data', () => {
  test('is present and parses', async ({ page }) => {
    await page.goto('/');
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    expect(raw, 'no ld+json script on the page').toBeTruthy();
    expect(() => JSON.parse(raw!), 'ld+json did not parse').not.toThrow();
  });

  test('describes an Organization, not a LocalBusiness', async ({ page }) => {
    await page.goto('/');
    const data = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    expect(data['@context']).toBe('https://schema.org');
    // LocalBusiness is for somewhere customers physically visit. There is no
    // premises, so claiming it is both unsupportable and invites local-pack
    // treatment for a business with nowhere to go.
    expect(data['@type'], 'LocalBusiness claims a place customers can visit').toBe('Organization');
  });

  test('carries the contact address from the one place it is defined', async ({ page }) => {
    await page.goto('/');
    const data = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    // The failure this catches: the address changes in lib/business.ts and the
    // structured data keeps advertising the old one, silently.
    expect(data.email).toBe(BUSINESS.email);
    expect(data.name).toBe(BUSINESS.name);
  });

  test('invents no address it cannot support', async ({ page }) => {
    await page.goto('/');
    const data = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    // Fabricated NAP data is worse than missing NAP data for local search, and
    // there is no street address, telephone or opening hours to publish.
    expect(data.address?.streetAddress).toBeUndefined();
    expect(data.telephone).toBeUndefined();
    expect(data.openingHours).toBeUndefined();
    expect(data.openingHoursSpecification).toBeUndefined();
  });

  test('links the eBay identity, which is a claim someone else can verify', async ({ page }) => {
    await page.goto('/');
    const data = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    expect(Array.isArray(data.sameAs)).toBe(true);
    expect(data.sameAs).toContain(BUSINESS.sameAs[0]);
  });
});
