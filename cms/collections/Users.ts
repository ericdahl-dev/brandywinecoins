import type { CollectionConfig } from 'payload';

/**
 * Editors. Auth-enabled, so this is what the admin panel logs in against.
 *
 * Self-registration is off: the first user is created through the admin's
 * one-time setup screen, and after that accounts are made by an existing editor.
 * A public landing page has no reason to accept signups.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'updatedAt'],
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [],
};
