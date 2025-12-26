import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'KEF Bílastæði | Airport Parking',
    template: '%s | KEF Bílastæði',
  },
  description: 'Öruggt og þægilegt bílastæði við Keflavíkurflugvöll. Secure and convenient parking at Keflavík Airport.',
  keywords: ['parking', 'airport', 'keflavik', 'iceland', 'bílastæði', 'flugvöllur'],
  authors: [{ name: 'KEF Parking' }],
  openGraph: {
    type: 'website',
    locale: 'is_IS',
    alternateLocale: 'en_US',
    siteName: 'KEF Bílastæði',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="is" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
