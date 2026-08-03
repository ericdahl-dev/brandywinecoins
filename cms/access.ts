import type { Access, FieldAccess } from 'payload';

import type { User } from './payload-types';

/**
 * Two roles, because there are two people.
 *
 * `admin` runs the site. `editor` writes the copy and nothing else. The split is
 * not about secrecy -- Mike owns the business, there is nothing on this site he
 * is not entitled to see. It is that an account he cannot act on is noise in his
 * sidebar, and that nobody should be one misclick from deleting the other
 * person's login.
 */
export const isAdmin = (user: User | null | undefined): boolean => user?.role === 'admin';

export const adminOnly: Access = ({ req }) => isAdmin(req.user as User | null);

export const adminOnlyField: FieldAccess = ({ req }) => isAdmin(req.user as User | null);

/**
 * Admins see everyone; everyone else sees only themselves.
 *
 * Returning a query constraint rather than `false` matters: an editor still has
 * to reach their own record to change their password or email, and Payload's
 * account view reads and writes through this same collection. Locking the
 * collection to admins outright would leave Mike unable to manage his own login.
 */
export const adminOrSelf: Access = ({ req }) => {
  const user = req.user as User | null;
  if (!user) return false;
  if (isAdmin(user)) return true;
  return { id: { equals: user.id } };
};
