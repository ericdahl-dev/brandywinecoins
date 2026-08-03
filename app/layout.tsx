import type { Metadata } from 'next';
import { Cormorant_Garamond, Cinzel } from 'next/font/google';
import './globals.css';

// Display and UI face. The brand's marks are set in Trajan Pro; Cinzel is the
// open equivalent, and like Trajan it has no lowercase -- the lowercase
// codepoints carry small capitals. That is what produces the artwork's
// "B(RANDYWIN)E" look from ordinary title-case text, so the display lines stay
// unbroken and selectable instead of needing per-letter font-size spans.
const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

// Reading face. Cinzel is capitals-only and unusable for prose, so body copy
// keeps a text serif.
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

const SITE_URL = 'https://bwcoins.ericdahl.dev';
const DESCRIPTION =
  'Brandywine Coins is a rare coin dealer in Wilmington, Delaware. US and world ' +
  'coins across every grade and price point. Our collection opens soon.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Brandywine Coins — Rare Coin Dealer in Wilmington, Delaware',
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Brandywine Coins',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Brandywine Coins',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brandywine Coins',
    description: DESCRIPTION,
  },
};

// Must track --ink-navy in globals.css. Next wants this at build time, so it
// cannot read the custom property; keep the two in step by hand.
export const viewport = {
  themeColor: '#03070F',
};

// Only claims that can be verified from the existing site. Street address,
// telephone and openingHours are intentionally absent rather than invented --
// fabricated NAP data is worse than missing NAP data for local search.
const localBusiness = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Brandywine Coins',
  description: DESCRIPTION,
  url: SITE_URL,
  email: 'info@brandywinecoins.net',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Wilmington',
    addressRegion: 'DE',
    addressCountry: 'US',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
        />
      </body>
    </html>
  );
}
