import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === 'is' ? 'Minn reikningur' : 'My Account',
    description: locale === 'is' 
      ? 'Stillingar reiknings, persónuvernd og upplýsingar um þig.'
      : 'Account settings, privacy, and your personal information.',
    robots: {
      index: false, // Don't index account pages
      follow: false,
    },
  };
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
