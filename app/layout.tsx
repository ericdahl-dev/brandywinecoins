import type { Metadata } from 'next';
import { Cormorant_Garamond, Cormorant_SC } from 'next/font/google';
import './globals.css';

// Body/display serif.
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

// The real small-caps cut. Cormorant Garamond ships no `smcp` feature, so
// `font-variant-caps: small-caps` on it only yields synthesised (scaled)
// capitals. Loading the SC family is what lets the display lines hold
// unbroken, selectable text instead of the comp's per-letter <span> hack.
const cormorantSC = Cormorant_SC({
  variable: '--font-cormorant-sc',
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
    <html lang="en" className={`${cormorant.variable} ${cormorantSC.variable}`}>
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
