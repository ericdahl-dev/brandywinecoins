/**
 * Who the business is, in one place.
 *
 * The email was previously three independent literals -- ActionLink, the
 * structured data, and a test -- so changing it meant finding all three and
 * nothing failed if you missed one. The structured data was the worst place to
 * miss, because it would have kept advertising the old address to search engines
 * with no visible symptom.
 *
 * Facts only, and only ones that can be verified from the site. Street address,
 * telephone and opening hours are deliberately absent rather than invented:
 * fabricated NAP data is worse than missing NAP data for local search, and
 * Brandywine Coins has no premises to publish.
 */
export const BUSINESS = {
  name: 'Brandywine Coins',
  email: 'info@brandywinecoins.net',
  locality: 'Wilmington',
  region: 'DE',
  country: 'US',
  /** Profiles that establish the same identity elsewhere. */
  sameAs: ['https://www.ebay.com/usr/brandywine_coins'],
} as const;

export const CONTACT_EMAIL = BUSINESS.email;

/**
 * The subject travels with the link rather than being left to the sender.
 *
 * Everything arriving at `info@` is a website enquiry, but only if it says so:
 * a `mailto:` with no subject arrives blank, and Mike has to open each one to
 * find out what it is. Encoded, because a raw space in an href is not a valid
 * URI and Safari drops the parameter rather than fixing it.
 */
export const CONTACT_SUBJECT = `Inquiry from ${BUSINESS.name}`;
export const CONTACT_HREF = `mailto:${BUSINESS.email}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`;

/**
 * Structured data for the site.
 *
 * `Organization`, not `LocalBusiness`. LocalBusiness is the type for somewhere
 * customers physically visit, and it is what this used to claim -- with no street
 * address, because there is no premises. That is both an incomplete record and a
 * claim we cannot support, and it invites local-pack treatment for a business
 * with nowhere to go.
 *
 * `areaServed` keeps the Wilmington connection, which is real and is in the copy,
 * without asserting a storefront.
 */
export function organizationJsonLd({ url, description }: { url: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BUSINESS.name,
    description,
    url,
    email: BUSINESS.email,
    sameAs: [...BUSINESS.sameAs],
    areaServed: {
      '@type': 'City',
      name: BUSINESS.locality,
      containedInPlace: {
        '@type': 'State',
        name: BUSINESS.region,
      },
    },
  };
}
