import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === 'is' ? 'Innskráning' : 'Sign In',
    description: locale === 'is' 
      ? 'Skráðu þig inn til að skoða bókanir og bóka bílastæði.'
      : 'Sign in to view your bookings and book parking.',
    robots: {
      index: false, // Don't index login pages
      follow: true,
    },
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
