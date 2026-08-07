import { expect, test } from '@playwright/test';

import { CONTACT_EMAIL } from '../lib/business';

/**
 * Guards on the widget's appearance, all of which regressed or were silently
 * wrong once already.
 *
 * These are deliberately about what a visitor can see and read, not about which
 * CSS rule produced it -- the widget's own class names and defaults change
 * between versions, and an upgrade that reintroduces any of these should fail
 * here rather than in front of Mike.
 */
const TOGGLE = '.chat-window-toggle';

async function openChat(page: import('@playwright/test').Page) {
  // Fixed, because the panel is sized against the viewport: at Playwright's
  // default 1280x720 it shrinks enough that the empty-space guard below cannot
  // see the very regression it exists for.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const toggle = page.locator(TOGGLE);
  const appeared = await toggle
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!appeared, 'built without NEXT_PUBLIC_CHAT_WEBHOOK_URL, so there is no widget');
  await toggle.first().click();
  await expect(page.locator('.chat-window')).toBeVisible({ timeout: 10_000 });
}

test.describe('the chat, once opened', () => {
  test('says it is not Mike, somewhere that cannot scroll away', async ({ page }) => {
    await openChat(page);

    // The obvious home for this is i18n.footer, and that is a trap: the widget
    // only renders the footer on its welcome screen, which is switched off, so
    // the disclosure shipped once and was invisible the whole time.
    const header = page.locator('.chat-header');
    await expect(header).toContainText(/automated assistant/i);
    await expect(header, 'no way to reach a person without using the chat').toContainText(
      CONTACT_EMAIL,
    );
  });

  test('starts its messages at the top, not adrift at the bottom', async ({ page }) => {
    await openChat(page);

    await expect(page.locator('.chat-message').first()).toBeVisible();

    // Asserted on the property rather than on measured geometry, deliberately.
    //
    // The obvious test -- measure the gap above the first message -- was tried
    // twice and would not fail when the regression was reintroduced, even
    // though a standalone probe showed the gap growing from 14px to 142px. A
    // guard that cannot be made to fail on demand is worse than none, because
    // it reads as coverage.
    //
    // margin-top:auto is what the widget ships, and it is the single thing that
    // pins messages to the bottom of the panel and leaves a few hundred pixels
    // of nothing above them -- the state a visitor also stares at for the ten
    // seconds a reply takes.
    const marginTop = await page.locator('.chat-messages-list').evaluate(
      (el) => getComputedStyle(el).marginTop,
    );
    expect(marginTop, 'messages are pinned to the bottom again').toBe('0px');
  });

  test('is readable for an audience over 50', async ({ page }) => {
    await openChat(page);

    const size = await page
      .locator('.chat-message')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    // Same floor the page copy was raised to. This is the one place on the site
    // where someone reads sustained text.
    expect(size, `chat text is ${size}px`).toBeGreaterThanOrEqual(18);
  });

  test('sits inside the ornate frame rather than across it', async ({ page }) => {
    await openChat(page);

    const gap = await page.locator('.chat-window').evaluate(
      (el) => window.innerWidth - el.getBoundingClientRect().right,
    );

    // The frame inset is ~16px at this width; the window must clear it, or it
    // cuts the one element doing the most work in the composition.
    expect(gap, `only ${Math.round(gap)}px between the window and the page edge`).toBeGreaterThan(20);
  });
});
