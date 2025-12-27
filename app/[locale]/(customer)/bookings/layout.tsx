import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === 'is' ? 'Mínar bókanir' : 'My Bookings',
    description: locale === 'is' 
      ? 'Skoðaðu og breyttu bókunum þínum. Sjáðu stöðu, dagsetningar og bættu við aukaþjónustu.'
      : 'View and manage your parking bookings. Check status, dates, and add extra services.',
    openGraph: {
      title: locale === 'is' ? 'Mínar bókanir | CarPark' : 'My Bookings | CarPark',
      description: locale === 'is' 
        ? 'Skoðaðu allar bókanir þínar hjá CarPark.'
        : 'View all your CarPark bookings.',
    },
  };
}

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
