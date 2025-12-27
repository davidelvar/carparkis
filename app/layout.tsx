import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carparkis.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CarPark - Bílastæði við Keflavíkurflugvöll | Airport Parking',
    template: '%s | CarPark',
  },
  description: 'Öruggt og þægilegt bílastæði við Keflavíkurflugvöll. Bókaðu á netinu, skráðu flugið og bættu við þjónustu. Secure parking at Keflavík Airport with online booking.',
  keywords: [
    'bílastæði', 'keflavíkurflugvöllur', 'flugvallarbílastæði', 'parking keflavik',
    'airport parking iceland', 'kef parking', 'bílastæði keflavík', 'carpark iceland',
    'langvarsstæði flugvöllur', 'örugg bílastæði', 'bílþvottur flugvöllur',
    'rafbíla hleðsla keflavík', 'iceland airport parking'
  ],
  authors: [{ name: 'CarPark' }],
  creator: 'CarPark',
  publisher: 'CarPark',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'is_IS',
    alternateLocale: 'en_US',
    url: siteUrl,
    siteName: 'CarPark',
    title: 'CarPark - Bílastæði við Keflavíkurflugvöll',
    description: 'Öruggt og þægilegt bílastæði við Keflavíkurflugvöll. Bókaðu á netinu með aukaþjónustu.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CarPark - Bílastæði við Keflavíkurflugvöll',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarPark - Airport Parking at Keflavík',
    description: 'Secure and convenient parking at Keflavík Airport. Book online today!',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'is': `${siteUrl}/is`,
      'en': `${siteUrl}/en`,
    },
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
