import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

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
    default: 'AMSMA — Aggregate Manufacturers & Suppliers Members Association of India',
    template: '%s · AMSMA',
  },
  description:
    "India's national voice for the aggregate industry — advancing knowledge, sustainability, and responsible practice for the infrastructure of tomorrow.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://amsma.org.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'AMSMA',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
