import { expect, test } from '@playwright/test';

/**
 * The widget mounts itself outside the React tree and floats over the page, so
 * the thing worth guarding is that it cannot disturb the composition beneath
 * it -- and that it actually reaches the workflow, which is a different system
 * on a different host.
 */
test.describe('the shop chat', () => {
  test('offers a way in without disturbing the page', async ({ page }) => {
    await page.goto('/');

    // The page still has to be the page. A widget that shifts the hero or adds
    // a horizontal scrollbar is worse than no widget.
    await expect(page.locator('footer')).toBeVisible();
    const spill = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(spill, `the page scrolls ${spill}px sideways with the chat mounted`).toBeLessThanOrEqual(0);

    const toggle = page.locator('.chat-window-toggle, [class*="chat-window-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 15_000 });
  });

  test('reaches the workflow and answers from the catalogue', async ({ page }) => {
    // Deliberately an end-to-end call: the widget, the webhook, the agent and
    // Airtable. A mock here would pass while the real path was broken, which is
    // exactly the failure this is meant to catch.
    test.setTimeout(120_000);
    await page.goto('/');

    await page.locator('.chat-window-toggle, [class*="chat-window-toggle"]').first().click();
    const input = page.locator('.chat-input textarea, textarea').first();
    await expect(input).toBeVisible({ timeout: 15_000 });

    await input.fill('What silver do you have?');
    await input.press('Enter');

    // The Peace Dollar is the only silver coin for sale, at $125. If the answer
    // mentions it, the whole chain worked.
    const reply = page.locator('[class*="chat-message"]').filter({ hasText: /125|Peace/i });
    await expect(reply.first()).toBeVisible({ timeout: 90_000 });
  });
});
