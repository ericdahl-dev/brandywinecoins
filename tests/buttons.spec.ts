import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Every label has to clear 4.5:1 against its own fill.
 *
 * Measured on rendered pixels rather than tokens, because the fills are not
 * flat: the primary is a three-stop gradient and the secondaries are a
 * translucent wash over a radial field, so a token-level check would grade
 * against a colour that is nowhere on screen.
 *
 * The method: read the label's computed colour, then screenshot the control
 * with the label hidden to get the fill it actually sits on, and take the fill's
 * worst pixel rather than its average. That is what caught white-on-gold --
 * white measures 4.6:1 against the bottom of the primary's gradient and 1.9:1
 * against the top, and the cap-heights sit at the top.
 */
function relativeLuminance([r, g, b]: number[]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

async function worstContrast(page: Page, link: Locator): Promise<number> {
  const label = await link.evaluate((el) => getComputedStyle(el).color);
  const rgb = label.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number);
  const labelLuma = relativeLuminance(rgb);

  // The control transitions colour over 180ms, so hiding the label and shooting
  // immediately catches it mid-fade -- which is what made the first version of
  // this test read the label as part of its own fill.
  await link.evaluate((el) => {
    el.style.setProperty('transition', 'none', 'important');
    el.style.setProperty('color', 'transparent', 'important');
  });
  const png = (await link.screenshot()).toString('base64');
  await link.evaluate((el) => {
    el.style.removeProperty('color');
    el.style.removeProperty('transition');
  });

  const fill = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const out: number[][] = [];
    // The band the glyphs occupy, not the whole control. WCAG grades text
    // against the background behind it; the primary's gradient runs on past the
    // baseline to a stop no letter reaches.
    const top = Math.round(canvas.height * 0.28);
    const bottom = Math.round(canvas.height * 0.75);
    for (let y = top; y < bottom; y++) {
      for (let x = 14; x < canvas.width - 14; x++) {
        const i = (y * canvas.width + x) * 4;
        out.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
    return out;
  }, png);

  return Math.min(...fill.map((px) => contrast(labelLuma, relativeLuminance(px))));
}

test.describe('button label contrast', () => {
  for (const name of ['About Us', 'Shop', 'Get in Touch']) {
    test(`${name} clears 4.5:1 against its own fill`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');

      const link = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name });
      const ratio = await worstContrast(page, link);

      expect(ratio, `${name} label is ${ratio.toFixed(2)}:1 at the worst pixel of its fill`)
        .toBeGreaterThanOrEqual(4.5);
    });
  }
});
