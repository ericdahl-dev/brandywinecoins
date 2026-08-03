import type { CollectionConfig } from 'payload';

import { adminOnly, adminOnlyField, adminOrSelf, isAdmin } from '../access';
import { resetPasswordHTML, resetPasswordSubject } from '../email/resetPassword';
import type { User } from '../payload-types';

/**
 * The two people who can sign in. Auth-enabled, so this is what the admin panel
 * logs in against.
 *
 * Self-registration is off: the first account came from the admin's one-time
 * setup screen, and after that only an admin makes accounts. A public landing
 * page has no reason to accept signups.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => resetPasswordHTML({ token: args?.token ?? '' }),
      generateEmailSubject: () => resetPasswordSubject(),
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'updatedAt'],
    // Hidden from the sidebar for an editor. This is presentation only -- the
    // access rules below are what actually enforce anything, and a hidden
    // collection is still reachable by URL without them.
    hidden: ({ user }) => !isAdmin(user as User | null),
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    // Not adminOnly: an editor has to reach their own record to change their
    // password. See the note in cms/access.ts.
    read: adminOrSelf,
    update: adminOrSelf,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data;

        // Bootstrapping. `role` defaults to editor, and both creating users and
        // changing roles are admin-only, so on an empty database the first-user
        // setup screen would produce an account that can never be promoted and
        // never promote anyone. Whoever stands the site up is the admin.
        const { totalDocs } = await req.payload.count({ collection: 'users', req });
        if (totalDocs === 0) return { ...data, role: 'admin' };

        return data;
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin — full access, including accounts', value: 'admin' },
        { label: 'Editor — site copy only', value: 'editor' },
      ],
      access: {
        // Without this an editor could open their own account, which they are
        // allowed to do, and promote themselves. Row-level access is not enough
        // on a field that decides row-level access.
        create: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        description: 'Only an admin can change this.',
      },
    },
  ],
};
