import { expect, test } from '@playwright/test';

import { typeset } from '../lib/typeset';

const WJ = '⁠';
const THIN = ' ';
const DASH = `${WJ}${THIN}${WJ}—${THIN}`;

/**
 * The rules that let Mike type plain text and still get the page's typography.
 * Unit-level, so a rule can be pinned without standing a browser up -- Playwright
 * is only the runner here, there is no `page`.
 */
test.describe('typeset', () => {
  test('curls apostrophes in contractions and possessives', () => {
    expect(typeset("you're")).toBe('you’re');
    expect(typeset("Delaware's heritage")).toBe('Delaware’s heritage');
    expect(typeset("the collectors' choice")).toBe('the collectors’ choice');
  });

  test('leaves a leading quote alone, since it is a different mark', () => {
    expect(typeset("'tis")).toBe("'tis");
  });

  test('spaces an unspaced em dash and pins it against a line break', () => {
    expect(typeset('companies—but')).toBe(`companies${DASH}but`);
  });

  test('a hand-spaced dash comes out identical, not doubly spaced', () => {
    expect(typeset('companies — but')).toBe(`companies${DASH}but`);
    expect(typeset('companies  —  but')).toBe(`companies${DASH}but`);
  });

  test('is idempotent, so re-saving in the CMS cannot compound it', () => {
    const once = typeset('companies—but');
    expect(typeset(once)).toBe(once);
    expect(typeset(typeset(once))).toBe(once);
  });

  test('already-curly input is unchanged', () => {
    const done = typeset('Delaware’s');
    expect(done).toBe('Delaware’s');
  });

  test('leaves ordinary prose untouched', () => {
    const plain = 'Based in Wilmington, Delaware, we specialize in quality coins.';
    expect(typeset(plain)).toBe(plain);
  });

  test('renders Mike’s clause exactly as the page shipped it', () => {
    const stored =
      'response times may occasionally be a little slower than those of larger ' +
      "companies—but every customer receives our full attention and care.";
    expect(typeset(stored)).toContain(`companies${DASH}but`);
    // The sequence tests/plate-era checks asserted on the rendered page.
    expect(typeset(stored)).toContain('⁠ ⁠— ');
  });
});
