'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Car,
  Zap,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Package,
  Droplets,
  Snowflake,
  Brush,
  Armchair,
  Wrench,
  Sun,
  Wind,
  Battery,
  Plug,
  Flame,
  Star,
  Heart,
  Truck,
  Folder,
  Calendar,
  Percent,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

// Icon map
const ICON_MAP: Record<string, LucideIcon> = {
  charging: Zap,
  cleaning: Sparkles,
  deep_cleaning: Brush,
  leather: Armchair,
  detailing: Wrench,
  coating: Shield,
  polishing: Sun,
  droplets: Droplets,
  wind: Wind,
  battery: Battery,
  plug: Plug,
  snowflake: Snowflake,
  flame: Flame,
  star: Star,
  heart: Heart,
  clock: Clock,
  package: Package,
  car: Car,
  truck: Truck,
  folder: Folder,
};

interface VehicleType {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  description?: string;
  descriptionEn?: string;
}

interface ParkingPrice {
  vehicleType: VehicleType;
  baseFee: number;
  pricePerDay: number;
  weeklyDiscount?: number | null;
  monthlyDiscount?: number | null;
}

interface ServiceCategory {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  icon?: string | null;
}

interface ServicePricing {
  vehicleType: VehicleType;
  price: number;
}

interface Service {
  id: string;
  name: string;
  nameEn: string;
  description?: string | null;
  descriptionEn?: string | null;
  icon?: string | null;
  category?: ServiceCategory | null;
  pricing: ServicePricing[];
}

interface PricingData {
  lot: { id: string; name: string; nameEn: string };
  parking: ParkingPrice[];
  services: Service[];
  categories: ServiceCategory[];
}

export default function PricingPage() {
  const locale = useLocale();
  const [data, setData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPricing();
  }, []);

  const getIcon = (iconName?: string | null): LucideIcon => {
    if (!iconName) return Package;
    return ICON_MAP[iconName] || Package;
  };

  const getVehicleIcon = (code: string) => {
    switch (code) {
      case 'small':
        return '🚗';
      case 'medium':
        return '🚙';
      case 'large':
        return '🚐';
      case 'xlarge':
        return '🚌';
      default:
        return '🚗';
    }
  };

  // Group services by category
  const servicesByCategory = data?.services.reduce((acc, service) => {
    const categoryId = service.category?.id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category: service.category,
        services: [],
      };
    }
    acc[categoryId].services.push(service);
    return acc;
  }, {} as Record<string, { category: ServiceCategory | null | undefined; services: Service[] }>) || {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-100 to-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 mb-6">
            <Shield className="h-4 w-4" />
            {locale === 'is' ? 'Gegnsæjar verðskrár' : 'Transparent Pricing'}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900">
            {locale === 'is' ? 'Verðskrá' : 'Pricing'}
          </h1>
          <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
            {locale === 'is'
              ? 'Einfalt og gegnsætt verðlag fyrir bílastæði og aukaþjónustur'
              : 'Simple and transparent pricing for parking and add-on services'}
          </p>
        </div>
      </section>

      {/* Parking Prices */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              {locale === 'is' ? 'Bílastæðaverð' : 'Parking Rates'}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {locale === 'is'
                ? 'Verð eftir stærð ökutækis'
                : 'Prices based on vehicle size'}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data?.parking.map((price) => (
              <div
                key={price.vehicleType.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-primary-200 transition-all"
              >
                <div className="text-4xl mb-4">{getVehicleIcon(price.vehicleType.code)}</div>
                <h3 className="text-xl font-bold text-slate-900">
                  {locale === 'is' ? price.vehicleType.name : price.vehicleType.nameEn}
                </h3>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-600">
                      {locale === 'is' ? 'Grunngjald' : 'Base fee'}
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatPrice(price.baseFee, locale)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-600">
                      {locale === 'is' ? 'Daggjald' : 'Per day'}
                    </span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatPrice(price.pricePerDay, locale)}
                    </span>
                  </div>
                  {price.weeklyDiscount && price.weeklyDiscount > 0 && (
                    <div className="flex items-center justify-between text-green-600 text-sm">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {locale === 'is' ? '7+ dagar' : '7+ days'}
                      </span>
                      <span className="font-medium">-{price.weeklyDiscount}%</span>
                    </div>
                  )}
                  {price.monthlyDiscount && price.monthlyDiscount > 0 && (
                    <div className="flex items-center justify-between text-green-600 text-sm">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {locale === 'is' ? '30+ dagar' : '30+ days'}
                      </span>
                      <span className="font-medium">-{price.monthlyDiscount}%</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    {locale === 'is' 
                      ? `Dæmi: 7 dagar = ${formatPrice(price.baseFee + price.pricePerDay * 7, locale)}`
                      : `Example: 7 days = ${formatPrice(price.baseFee + price.pricePerDay * 7, locale)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              {locale === 'is' ? 'Innifalið í verði' : 'Included in price'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Shield, text: locale === 'is' ? '24/7 öryggiseftirlit' : '24/7 security' },
                { icon: Car, text: locale === 'is' ? 'Flutningur til flugvallar' : 'Airport transfer' },
                { icon: Clock, text: locale === 'is' ? 'Sveigjanlegir tímar' : 'Flexible times' },
                { icon: CheckCircle2, text: locale === 'is' ? 'Engin falin gjöld' : 'No hidden fees' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <feature.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-slate-700">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              {locale === 'is' ? 'Aukaþjónustur' : 'Add-on Services'}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {locale === 'is'
                ? 'Bættu við þjónustu meðan bíllinn bíður'
                : 'Add services while your car waits'}
            </p>
          </div>

          {/* Vehicle Type Filter */}
          {data?.parking && data.parking.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button
                onClick={() => setSelectedVehicleType('all')}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  selectedVehicleType === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {locale === 'is' ? 'Allar stærðir' : 'All sizes'}
              </button>
              {data.parking.map((p) => (
                <button
                  key={p.vehicleType.id}
                  onClick={() => setSelectedVehicleType(p.vehicleType.id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedVehicleType === p.vehicleType.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {getVehicleIcon(p.vehicleType.code)} {locale === 'is' ? p.vehicleType.name : p.vehicleType.nameEn}
                </button>
              ))}
            </div>
          )}

          {/* Services by Category */}
          <div className="space-y-12">
            {Object.entries(servicesByCategory).map(([categoryId, { category, services }]) => (
              <div key={categoryId}>
                {category && (
                  <div className="flex items-center gap-3 mb-6">
                    {(() => {
                      const IconComponent = getIcon(category.icon);
                      return (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                          <IconComponent className="h-5 w-5 text-primary-600" />
                        </div>
                      );
                    })()}
                    <h3 className="text-xl font-bold text-slate-900">
                      {locale === 'is' ? category.name : category.nameEn}
                    </h3>
                  </div>
                )}
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => {
                    const filteredPricing = selectedVehicleType === 'all'
                      ? service.pricing
                      : service.pricing.filter(p => p.vehicleType.id === selectedVehicleType);
                    
                    const minPrice = Math.min(...service.pricing.map(p => p.price));
                    const maxPrice = Math.max(...service.pricing.map(p => p.price));
                    const displayPrice = selectedVehicleType === 'all'
                      ? minPrice === maxPrice
                        ? formatPrice(minPrice, locale)
                        : `${formatPrice(minPrice, locale)} - ${formatPrice(maxPrice, locale)}`
                      : filteredPricing.length > 0
                        ? formatPrice(filteredPricing[0].price, locale)
                        : formatPrice(minPrice, locale);

                    const IconComponent = getIcon(service.icon || service.category?.icon);

                    return (
                      <div
                        key={service.id}
                        className="bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5 text-primary-600" />
                              <h4 className="font-semibold text-slate-900">
                                {locale === 'is' ? service.name : service.nameEn}
                              </h4>
                            </div>
                            {(service.description || service.descriptionEn) && (
                              <p className="mt-2 text-sm text-slate-600">
                                {locale === 'is' ? service.description : service.descriptionEn}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600">
                              {displayPrice}
                            </p>
                            {selectedVehicleType === 'all' && minPrice !== maxPrice && (
                              <p className="text-xs text-slate-500">
                                {locale === 'is' ? 'eftir stærð' : 'by size'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            {locale === 'is' ? 'Tilbúinn að bóka?' : 'Ready to book?'}
          </h2>
          <p className="mt-4 text-lg text-white/80">
            {locale === 'is'
              ? 'Bókaðu bílastæði á nokkrum sekúndum'
              : 'Book your parking spot in seconds'}
          </p>
          <Link
            href={`/${locale}/booking`}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-primary-600 shadow-lg hover:bg-slate-50 transition-all"
          >
            {locale === 'is' ? 'Bóka núna' : 'Book now'}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
