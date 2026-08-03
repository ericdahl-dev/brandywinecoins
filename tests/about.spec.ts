import { expect, test } from '@playwright/test';

const WJ = '⁠';
const THIN = ' ';
const EM = '—';

/**
 * The About section is rendered from the CMS and typeset on the way out (#41).
 *
 * Asserted on shape and typography rather than on the words, because the words
 * are Mike's to change and a test that pins them would turn every edit into a
 * failing build. What must not change is that the copy arrives at all and that
 * lib/typeset.ts ran on it.
 */
test.describe('about section, from the CMS', () => {
  test('renders the stored prose', async ({ page }) => {
    await page.goto('/');
    const paragraphs = page.locator('#about p');
    expect(await paragraphs.count()).toBeGreaterThanOrEqual(3);

    const text = (await page.locator('#about').innerText()).trim();
    expect(text.length, 'about section is empty -- did the seed run?').toBeGreaterThan(400);
  });

  test('typesetting was applied, not stored', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('#about').innerText();

    // Apostrophes are curled at render, so a straight one means typeset() was
    // bypassed somewhere between the database and the page.
    expect(text, 'a straight apostrophe reached the page').not.toMatch(/\w'\w/);

    // Any em dash carries the full treatment: pinned on the left so it cannot
    // start a line, thin spaces either side.
    if (text.includes(EM)) {
      expect(text, 'em dash is not typeset').toContain(`${WJ}${THIN}${WJ}${EM}${THIN}`);
      expect(text, 'a bare em dash survived').not.toMatch(
        new RegExp(`[^${WJ}]${EM}`, 'u'),
      );
    }
  });

  test('the pull quote is present and is not the old colony line', async ({ page }) => {
    await page.goto('/');
    const quote = page.locator('#about p').last();
    const t = (await quote.innerText()).trim();
    expect(t.length).toBeGreaterThan(10);
    // #31: the pull quote was about New Sweden rather than the business.
    expect(t).not.toContain('New Sweden');
  });
});
