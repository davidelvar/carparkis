import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import QuickBookingCard from '@/components/booking/QuickBookingCard';
import StatsBar from '@/components/home/StatsBar';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import ContactCTA from '@/components/home/ContactCTA';
import FAQContactLink from '@/components/home/FAQContactLink';
import LocationMap from '@/components/home/LocationMap';
import { cn } from '@/lib/utils';
import {
  Car,
  Plane,
  Shield,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Zap,
  Droplets,
  CreditCard,
  ArrowRight,
  Phone,
  Mail,
  PlaneTakeoff,
  PlaneLanding,
  Play,
  Users,
  Award,
  ChevronDown,
  Truck,
} from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carparkis.vercel.app';

  if (locale === 'is') {
    return {
      title: 'CarPark - Bílastæði við Keflavíkurflugvöll | Bókaðu núna',
      description: 'Öruggt og þægilegt bílastæði við Keflavíkurflugvöll. Bókaðu á netinu, veldu flugið þitt, og bættu við aukaþjónustu eins og bílþvotti, hleðslu rafbíla og innri þrif. Hagstæð verð og 24/7 öryggisvöktun.',
      keywords: [
        'bílastæði keflavíkurflugvöllur', 'flugvallarbílastæði', 'bílastæði keflavík',
        'langvarsstæði flugvöllur', 'örugg bílastæði', 'bílþvottur flugvöllur',
        'rafbíla hleðsla keflavík', 'carpark iceland', 'parking kef'
      ],
      openGraph: {
        title: 'CarPark - Bílastæði við Keflavíkurflugvöll',
        description: 'Öruggt og þægilegt bílastæði við Keflavíkurflugvöll. Bókaðu á netinu með aukaþjónustu.',
        url: `${siteUrl}/is`,
        locale: 'is_IS',
      },
      alternates: {
        canonical: `${siteUrl}/is`,
        languages: {
          'is': `${siteUrl}/is`,
          'en': `${siteUrl}/en`,
        },
      },
    };
  }

  return {
    title: 'CarPark - Airport Parking at Keflavík | Book Now',
    description: 'Secure and convenient parking at Keflavík Airport, Iceland. Book online, select your flight, and add services like car wash, EV charging, and interior cleaning. Competitive prices with 24/7 security.',
    keywords: [
      'keflavik airport parking', 'iceland airport parking', 'kef parking',
      'parking near keflavik airport', 'secure airport parking', 'long term parking iceland',
      'car wash airport', 'ev charging keflavik', 'carpark keflavik'
    ],
    openGraph: {
      title: 'CarPark - Airport Parking at Keflavík',
      description: 'Secure and convenient parking at Keflavík Airport with online booking and extra services.',
      url: `${siteUrl}/en`,
      locale: 'en_US',
    },
    alternates: {
      canonical: `${siteUrl}/en`,
      languages: {
        'is': `${siteUrl}/is`,
        'en': `${siteUrl}/en`,
      },
    },
  };
}

// JSON-LD structured data for SEO
function JsonLd({ locale }: { locale: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carparkis.vercel.app';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#organization`,
    name: 'CarPark',
    alternateName: 'CarPark Keflavík',
    description: locale === 'is' 
      ? 'Öruggt og þægilegt bílastæði við Keflavíkurflugvöll'
      : 'Secure and convenient parking at Keflavík Airport',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    image: `${siteUrl}/images/og-image.jpg`,
    telephone: '+354-XXX-XXXX', // Update with actual phone
    email: 'info@carpark.is', // Update with actual email
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Keflavíkurflugvöllur',
      addressLocality: 'Keflavík',
      postalCode: '235',
      addressCountry: 'IS',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 63.985,
      longitude: -22.605,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    priceRange: '$$',
    currenciesAccepted: 'ISK',
    paymentAccepted: 'Credit Card',
    areaServed: {
      '@type': 'Place',
      name: 'Keflavík International Airport',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: locale === 'is' ? 'Bílastæðaþjónusta' : 'Parking Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: locale === 'is' ? 'Bílastæði' : 'Parking',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: locale === 'is' ? 'Bílþvottur' : 'Car Wash',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: locale === 'is' ? 'Rafbílahleðsla' : 'EV Charging',
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default function HomePage() {
  const t = useTranslations('booking');
  const locale = useLocale();

  const features = [
    {
      icon: Shield,
      title: locale === 'is' ? '24/7 Öryggisgæsla' : '24/7 Security',
      description: locale === 'is'
        ? 'Öryggismyndavélar og vaktþjónusta allan sólarhringinn.'
        : 'Round-the-clock surveillance and security patrols.',
      color: 'bg-emerald-500',
    },
    {
      icon: Truck,
      title: locale === 'is' ? 'Ókeypis skutla' : 'Free Shuttle',
      description: locale === 'is'
        ? '5 mínútna akstur til flugstöðvar með ókeypis skutluþjónustu.'
        : '5 minute drive to terminal with complimentary shuttle.',
      color: 'bg-blue-500',
    },
    {
      icon: Plane,
      title: locale === 'is' ? 'Flugtengt' : 'Flight-Connected',
      description: locale === 'is'
        ? 'Veldu flugið þitt beint úr KEF flugtíðum.'
        : 'Select your flight directly from KEF schedules.',
      color: 'bg-violet-500',
    },
    {
      icon: Zap,
      title: locale === 'is' ? 'Rafbílahleðsla' : 'EV Charging',
      description: locale === 'is'
        ? 'Bíllinn þinn fullhlaðinn þegar þú kemur aftur.'
        : 'Your car fully charged when you return.',
      color: 'bg-amber-500',
    },
    {
      icon: Droplets,
      title: locale === 'is' ? 'Bílaþvottur' : 'Car Wash',
      description: locale === 'is'
        ? 'Komdu heim í hreinum bíl. Innri og ytri þrif.'
        : 'Return to a clean car. Interior and exterior.',
      color: 'bg-cyan-500',
    },
    {
      icon: Sparkles,
      title: locale === 'is' ? 'Innri þrif' : 'Interior Cleaning',
      description: locale === 'is'
        ? 'Ryksugað, þrifið og borið á innréttingu.'
        : 'Vacuumed, cleaned and interior detailed.',
      color: 'bg-sky-500',
    },
  ];

  const steps = [
    {
      number: '01',
      icon: Car,
      title: locale === 'is' ? 'Sláðu inn bílnúmer' : 'Enter License Plate',
      description: locale === 'is'
        ? 'Við sækjum upplýsingar sjálfkrafa frá Samgöngustofu.'
        : 'We automatically fetch info from the registry.',
    },
    {
      number: '02',
      icon: Plane,
      title: locale === 'is' ? 'Veldu flugin þín' : 'Select Your Flights',
      description: locale === 'is'
        ? 'Veldu dagsetningar beint úr KEF flugtíðum.'
        : 'Pick dates directly from KEF flight schedules.',
    },
    {
      number: '03',
      icon: Sparkles,
      title: locale === 'is' ? 'Bættu við þjónustu' : 'Add Services',
      description: locale === 'is'
        ? 'Þvottur, hleðsla eða vetrarþjónusta.'
        : 'Wash, charging, or winter service.',
    },
    {
      number: '04',
      icon: CreditCard,
      title: locale === 'is' ? 'Greiddu örugglega' : 'Pay Securely',
      description: locale === 'is'
        ? 'Örugg greiðsla og staðfesting í tölvupósti.'
        : 'Secure payment with email confirmation.',
    },
  ];

  const faqs = [
    {
      q: locale === 'is' ? 'Hversu langt er í flugstöðina?' : 'How far is the terminal?',
      a: locale === 'is'
        ? 'Um 5 mínútna akstur. Við bjóðum upp á ókeypis skutluþjónustu sem gengur reglulega.'
        : 'About 5 minutes drive. We offer a free shuttle service that runs regularly.',
    },
    {
      q: locale === 'is' ? 'Get ég afbókað?' : 'Can I cancel my booking?',
      a: locale === 'is'
        ? 'Já, ókeypis afbókun allt að 24 klukkustundum fyrir brottför. Þú færð fulla endurgreiðslu.'
        : 'Yes, free cancellation up to 24 hours before departure. You get a full refund.',
    },
    {
      q: locale === 'is' ? 'Hvað ef flugið seinkar?' : 'What if my flight is delayed?',
      a: locale === 'is'
        ? 'Engar áhyggjur! Við fylgjumst með flugi þínu og bíðum eftir þér, án aukagjalda.'
        : 'No worries! We monitor your flight and wait for you at no extra charge.',
    },
    {
      q: locale === 'is' ? 'Er bílastæðið öruggt?' : 'Is the parking lot secure?',
      a: locale === 'is'
        ? 'Já, með öryggismyndavélum, girðingum og vaktþjónustu 24/7. Bíllinn þinn er í góðum höndum.'
        : 'Yes, with CCTV cameras, fencing, and security patrols 24/7. Your car is in safe hands.',
    },
  ];

  return (
    <>
      <JsonLd locale={locale} />
      <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#255da0]">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-[#1e4f8a] opacity-50" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-[#0f2442] opacity-30" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full bg-white/5" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
            {/* Left - Hero Text */}
            <div className="text-center lg:text-left lg:pr-4 xl:pr-8 px-1 lg:px-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 sm:py-2.5 mb-6 sm:mb-8">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs sm:text-sm font-medium text-white/90">{locale === 'is' ? 'Opið 24/7' : 'Open 24/7'}</span>
                </div>
                <div className="h-3 sm:h-4 w-px bg-white/20" />
                <span className="text-xs sm:text-sm text-white/70">Keflavík</span>
              </div>

              <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                {locale === 'is' ? (
                  <>
                    Bílastæði við<br />
                    <span className="text-accent-400">Keflavíkurflugvöll</span>
                  </>
                ) : (
                  <>
                    Parking at<br />
                    <span className="text-accent-400">Keflavík Airport</span>
                  </>
                )}
              </h1>

              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/70 max-w-lg mx-auto lg:mx-0">
                {locale === 'is'
                  ? 'Bókaðu öruggt bílastæði á mínútu. Ókeypis skutla til flugstöðvar, 24/7 öryggiseftirlit og aukaþjónusta eins og bílaþvottur og rafbílahleðsla.'
                  : 'Book secure parking in a minute. Free shuttle to terminal, 24/7 security monitoring, and add-ons like car wash and EV charging.'}
              </p>

              {/* CTA Buttons */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
                <Link
                  href={`/${locale}/booking`}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 sm:py-3.5 text-base font-semibold text-[#255da0] shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
                >
                  {locale === 'is' ? 'Bóka núna' : 'Book Now'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-6 py-3 sm:py-3.5 text-base font-semibold text-white transition-all hover:bg-white/20"
                >
                  {locale === 'is' ? 'Hvernig virkar þetta?' : 'How it works'}
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-6 sm:mt-10 flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 justify-center lg:justify-start">
                {[
                  { icon: CheckCircle2, text: locale === 'is' ? 'Engin bókunargjöld' : 'No booking fees' },
                  { icon: CheckCircle2, text: locale === 'is' ? 'Ókeypis afbókun' : 'Free cancellation' },
                  { icon: CheckCircle2, text: locale === 'is' ? 'Ókeypis skutla' : 'Free shuttle' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/60">
                    <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Quick booking card */}
            <div className="relative w-full max-w-md mx-auto lg:max-w-none px-1">
              <QuickBookingCard />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <StatsBar />

      {/* Features Section */}
      <section id="features" className="py-32 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-600 shadow-sm mb-6">
              <Sparkles className="h-4 w-4" />
              {locale === 'is' ? 'Þjónusta okkar' : 'Our Services'}
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
              {locale === 'is' ? 'Meira en bara bílastæði' : 'More Than Just Parking'}
            </h2>
            <p className="mt-6 text-xl text-slate-600">
              {locale === 'is'
                ? 'Við tryggjum að ferðin þín byrji og endi eins vel og mögulegt er.'
                : 'We ensure your journey starts and ends as smoothly as possible.'}
            </p>
          </div>

          {/* Feature Cards - Full color backgrounds */}
          <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  'group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-[1.02] hover:shadow-2xl',
                  feature.color
                )}
              >
                {/* Large icon in background */}
                <div className="absolute -right-6 -bottom-6 opacity-20 transition-transform group-hover:scale-110">
                  <feature.icon className="h-40 w-40 text-white" strokeWidth={1} />
                </div>
                
                {/* Content */}
                <div className="relative">
                  {/* Small icon */}
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="mt-4 text-lg font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/80 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - Modern cards */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-16">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">
              {locale === 'is' ? 'Hvernig virkar þetta' : 'How it works'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              {locale === 'is' ? 'Bókaðu á minna en mínútu' : 'Book in less than a minute'}
            </h2>
          </div>

          {/* Steps grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div 
                  className="group bg-slate-50 rounded-2xl p-6 hover:bg-primary-600 transition-all duration-300 h-full"
                >
                  {/* Top row: Step number and Icon */}
                  <div className="flex items-start justify-between">
                    <span className="text-6xl font-black text-slate-200 group-hover:text-white/20 transition-colors">
                      {step.number}
                    </span>
                    <div className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 group-hover:bg-white transition-colors">
                      <step.icon className="h-6 w-6 text-white group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-white transition-colors">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 group-hover:text-white/80 transition-colors leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector - centered in the gap (hidden on last item and mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-6 items-center justify-center">
                    <ChevronRight className="h-6 w-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - with live Google rating */}
      <TestimonialsSection />

      {/* FAQ Section - Accordion style */}
      <section id="faq" className="py-32 bg-white scroll-mt-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 mb-6">
              <Users className="h-4 w-4" />
              {locale === 'is' ? 'Algengar spurningar' : 'FAQ'}
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
              {locale === 'is' ? 'Spurningar og svör' : 'Questions & Answers'}
            </h2>
            <p className="mt-6 text-xl text-slate-600">
              {locale === 'is'
                ? 'Finndu svör við algengustu spurningum'
                : 'Find answers to common questions'}
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-lg hover:border-slate-300 transition-all overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-sm font-bold">
                      {index + 1}
                    </span>
                    {faq.q}
                  </h3>
                  <p className="mt-4 text-slate-600 leading-relaxed pl-11">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>

          <FAQContactLink />
        </div>
      </section>

      {/* Final CTA - Clean modern */}
      <ContactCTA />

      {/* Location Map */}
      <LocationMap />
    </div>
    </>
  );
}
