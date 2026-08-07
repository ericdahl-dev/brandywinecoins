import { expect, test } from '@playwright/test';

/**
 * The widget mounts itself outside the React tree and floats over the page.
 *
 * Two different things are worth checking, and they have very different costs,
 * so they are separated rather than bundled:
 *
 *  - that it cannot disturb the composition beneath it. Cheap, deterministic,
 *    and it should run on every push.
 *  - that it actually reaches the workflow. That means a real call to n8n,
 *    Anthropic and Airtable -- slow, and it fails when any of those is having a
 *    bad day. Coupling every push to three external services is how a suite
 *    stops being trusted, so it is opt-in.
 */

/** The live path only runs when asked: CHAT_E2E=1 npx playwright test tests/chat.spec.ts */
const LIVE = process.env.CHAT_E2E === '1';

const TOGGLE = '[class*="chat-window-toggle"]';

test.describe('the shop chat', () => {
  test('does not disturb the page', async ({ page }) => {
    await page.goto('/');

    // Holds whether or not the chat is configured in this build, which is the
    // point: the page must be the page either way.
    await expect(page.locator('footer')).toBeVisible();
    const spill = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(spill, `the page scrolls ${spill}px sideways with the chat mounted`).toBeLessThanOrEqual(0);
  });

  test('offers a way in when a webhook is configured', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator(TOGGLE);

    // The widget is imported dynamically, so it is not in the DOM at load.
    // Counting immediately would race it and read zero every time -- which
    // looks exactly like "not configured" and silently skips the test.
    const appeared = await toggle
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    // NEXT_PUBLIC_CHAT_WEBHOOK_URL is read at build time, so a build made
    // without it renders no widget at all. That is a deliberate state -- a
    // preview, or a deploy with the chat off -- not a failure.
    test.skip(!appeared, 'built without NEXT_PUBLIC_CHAT_WEBHOOK_URL, so there is no widget');

    await expect(toggle.first()).toBeVisible();
  });

  test('reaches the workflow and answers from the catalogue', async ({ page }) => {
    test.skip(!LIVE, 'set CHAT_E2E=1 to call the live workflow');
    test.setTimeout(120_000);

    await page.goto('/');
    await page.locator(TOGGLE).first().click();

    const input = page.locator('textarea').first();
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.fill('What silver do you have?');
    await input.press('Enter');

    // The Peace Dollar is the only silver coin for sale, at $125. If the answer
    // names it, the whole chain worked: widget, webhook, agent, Airtable.
    const reply = page.locator('[class*="chat-message"]').filter({ hasText: /125|Peace/i });
    await expect(reply.first()).toBeVisible({ timeout: 90_000 });
  });
});
