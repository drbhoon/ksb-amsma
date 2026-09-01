import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { siteUrl } from '@/lib/site-url';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'AMSMA — Aggregate & M sand Manufacturers Association',
    template: '%s · AMSMA',
  },
  description:
    "Knowledge, standards and responsible practice for India's aggregate and M sand sector.",
  metadataBase: new URL(siteUrl()),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'AMSMA',
    images: ['/assets/quarry-nesting-habitat-poster.jpg'],
  },
  icons: { icon: '/assets/brand/AMSMA_QuarryStrata_Option3_Primary.svg' },
  // Off until SITE_INDEXABLE=true. See app/robots.ts for why.
  robots: {
    index: process.env.SITE_INDEXABLE === 'true',
    follow: process.env.SITE_INDEXABLE === 'true',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
