import { expect, test } from '@playwright/test';

import { adminOnly, adminOrSelf, isAdmin } from '../cms/access';

/**
 * The rules behind who can see and change accounts.
 *
 * Unit-level: these decide access, and getting one backwards is the kind of
 * mistake that produces no error and no failing page. Playwright is only the
 * runner, there is no `page`.
 *
 * The collection wiring on top of these -- field-level access on `role`, and the
 * first-account bootstrap -- was verified against a running server; see the PR.
 */
const admin = { id: 1, role: 'admin' } as never;
const editor = { id: 2, role: 'editor' } as never;
const req = (user: unknown) => ({ req: { user } }) as never;

test.describe('access rules', () => {
  test('isAdmin only accepts the admin role', () => {
    expect(isAdmin({ id: 1, role: 'admin' } as never)).toBe(true);
    expect(isAdmin({ id: 2, role: 'editor' } as never)).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  test('adminOnly is closed to editors and to anonymous', () => {
    expect(adminOnly(req(admin))).toBe(true);
    expect(adminOnly(req(editor))).toBe(false);
    expect(adminOnly(req(null))).toBe(false);
  });

  test('adminOrSelf gives an admin everything', () => {
    expect(adminOrSelf(req(admin))).toBe(true);
  });

  test('adminOrSelf narrows an editor to their own row, rather than refusing', () => {
    // Returning a constraint instead of false is deliberate: an editor still has
    // to reach their own record to change their password.
    expect(adminOrSelf(req(editor))).toEqual({ id: { equals: 2 } });
  });

  test('adminOrSelf refuses anonymous outright', () => {
    expect(adminOrSelf(req(null))).toBe(false);
  });
});
