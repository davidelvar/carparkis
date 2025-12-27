import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === 'is' ? 'Bóka bílastæði' : 'Book Parking',
    description: locale === 'is' 
      ? 'Bókaðu bílastæði við Keflavíkurflugvöll. Veldu tíma, skráðu bílnúmer og bættu við þjónustu eins og bílþvotti og hleðslu.'
      : 'Book parking at Keflavík Airport. Choose your dates, enter your license plate, and add services like car wash and EV charging.',
    openGraph: {
      title: locale === 'is' ? 'Bóka bílastæði | CarPark' : 'Book Parking | CarPark',
      description: locale === 'is' 
        ? 'Bókaðu bílastæði við Keflavíkurflugvöll á netinu.'
        : 'Book parking at Keflavík Airport online.',
    },
  };
}

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
