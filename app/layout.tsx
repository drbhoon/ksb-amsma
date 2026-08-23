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
    "India's national voice for the aggregate industry — advancing knowledge, sustainability, and responsible practice for the infrastructure of tomorrow.",
  metadataBase: new URL(siteUrl()),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'AMSMA',
  },
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
