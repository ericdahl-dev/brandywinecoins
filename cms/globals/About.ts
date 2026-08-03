import type { GlobalConfig } from 'payload';

/**
 * The #about copy. A global rather than a collection: there is one of it.
 *
 * Plain text throughout, no rich text. What gets stored is what Mike typed;
 * lib/typeset.ts applies the page's typography at render, so straight
 * apostrophes and a hand-spaced em dash both come out right and neither is his
 * problem. See #41.
 *
 * Nothing here feeds display type. The "About Us" heading is set in Cinzel,
 * whose small caps only replace lowercase codepoints, so an all-caps value would
 * break it -- which is why the heading stays in the component and is not a field.
 * The pull quote is italic Cormorant, ordinary prose, and safe to expose.
 */
export const About: GlobalConfig = {
  slug: 'about',
  admin: {
    description:
      'The About section. Write plainly: straight apostrophes and a plain em ' +
      'dash are fine, the site sets them correctly when it renders.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      async ({ req }) => {
        // The page stays statically rendered and this drops the cached copy the
        // moment Mike saves, so an edit is visible without waiting out a
        // revalidate window or redeploying.
        //
        // Imported here rather than at module scope because this config is also
        // loaded by the Payload CLI, outside Next.
        //
        // Guarded because the hook fires there too. `payload migrate` seeds this
        // global, and revalidatePath throws "static generation store missing"
        // with no request to attach to. Nothing is cached during a migration, so
        // there is nothing to invalidate and failing is the wrong response.
        try {
          const { revalidatePath } = await import('next/cache');
          revalidatePath('/');
        } catch (err) {
          req.payload.logger.info(
            `about: skipped revalidate outside a request context (${
              err instanceof Error ? err.message : String(err)
            })`,
          );
        }
      },
    ],
  },
  fields: [
    {
      name: 'body',
      type: 'textarea',
      required: true,
      admin: {
        rows: 18,
        description:
          'The whole section, as one piece. Leave a blank line between ' +
          'paragraphs.',
      },
    },
    {
      name: 'signoff',
      type: 'text',
      admin: {
        description:
          'The closing line. It currently ends without a full stop, deliberately.',
      },
    },
    {
      name: 'pullQuote',
      type: 'text',
      admin: {
        description:
          'The gold line under the section. Should be about the business, not ' +
          'about history.',
      },
    },
  ],
};
