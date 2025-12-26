'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Sparkles,
  Car,
  Droplets,
  Zap,
  Snowflake,
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Brush,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { BookingData } from '@/app/[locale]/(customer)/booking/page';

interface AddonsStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ServiceData {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  code: string;
  icon: string | null;
  isActive: boolean;
  lotServices: {
    id: string;
    price: number;
    isAvailable: boolean;
    pricePerKwh: number | null;
    vehicleType: {
      id: string;
      code: string;
    };
    lot: {
      id: string;
      code: string;
    };
  }[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  car: Car,
  droplets: Droplets,
  sparkles: Sparkles,
  zap: Zap,
  snowflake: Snowflake,
  shield: Shield,
  brush: Brush,
  'shield-check': ShieldCheck,
  warehouse: Warehouse,
};

export default function AddonsStep({ data, onUpdate, onNext, onBack }: AddonsStepProps) {
  const t = useTranslations('booking');
  const locale = useLocale();
  
  const [services, setServices] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      const result = await response.json();
      
      if (result.success) {
        // Filter to active services that have pricing for the selected vehicle type
        const available = result.data.filter((s: ServiceData) => 
          s.isActive && s.lotServices.some(ls => 
            ls.isAvailable && ls.vehicleType.code === data.vehicleTypeId
          )
        );
        setServices(available);
      } else {
        setError(locale === 'is' ? 'Villa við að sækja þjónustur' : 'Failed to load services');
      }
    } catch (err) {
      setError(locale === 'is' ? 'Villa við að sækja þjónustur' : 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const getServicePrice = (service: ServiceData): number => {
    const lotService = service.lotServices.find(ls => 
      ls.isAvailable && ls.vehicleType.code === data.vehicleTypeId
    );
    return lotService?.price || 0;
  };

  const isPerDay = (service: ServiceData): boolean => {
    // Services like covered parking are charged per day
    return ['covered_parking', 'premium_spot'].includes(service.code);
  };

  const isEvOnly = (service: ServiceData): boolean => {
    return ['ev_charge', 'ev_charging'].includes(service.code);
  };

  const toggleAddon = (serviceId: string) => {
    const current = data.selectedAddons;
    const updated = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];
    onUpdate({ selectedAddons: updated });
  };

  const selectedTotal = services
    .filter((s) => data.selectedAddons.includes(s.id))
    .reduce((sum, s) => sum + getServicePrice(s), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{t('step3')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('selectAddons')}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-50 p-4 text-danger-700 text-sm">
          {error}
        </div>
      )}

      {/* Add-ons Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => {
          const isSelected = data.selectedAddons.includes(service.id);
          const Icon = ICON_MAP[service.icon || ''] || Sparkles;
          const price = getServicePrice(service);

          // Hide EV charging if not electric
          if (isEvOnly(service) && !data.vehicleInfo?.isElectric) {
            return null;
          }

          const displayName = locale === 'is' ? service.name : (service.nameEn || service.name);
          const displayDesc = locale === 'is' ? service.description : (service.descriptionEn || service.description);

          return (
            <button
              key={service.id}
              onClick={() => toggleAddon(service.id)}
              className={cn(
                'relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all',
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                  isSelected
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-slate-300'
                )}
              >
                {isSelected && <Check className="h-4 w-4" />}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isSelected ? 'text-primary-600' : 'text-slate-400'
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium',
                      isSelected ? 'text-primary-900' : 'text-slate-900'
                    )}
                  >
                    {displayName}
                  </span>
                </div>
                {displayDesc && (
                  <p className="mt-1 text-xs text-slate-500">{displayDesc}</p>
                )}
                <p className="mt-1 text-sm text-slate-600">
                  {formatPrice(price, locale)}
                  {isPerDay(service) && (
                    <span className="text-slate-400">
                      {' '}
                      / {locale === 'is' ? 'dag' : 'day'}
                    </span>
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* No services available */}
      {services.length === 0 && !error && (
        <p className="text-center text-sm text-slate-500 py-8">
          {locale === 'is' ? 'Engin aukaþjónusta í boði' : 'No add-on services available'}
        </p>
      )}

      {/* Selected Summary */}
      {data.selectedAddons.length > 0 && (
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {locale === 'is' ? 'Valin þjónusta:' : 'Selected services:'}
            </span>
            <span className="font-semibold text-slate-900">
              {formatPrice(selectedTotal, locale)}
            </span>
          </div>
        </div>
      )}

      {/* No selection message */}
      {data.selectedAddons.length === 0 && services.length > 0 && (
        <p className="text-center text-sm text-slate-500 py-4">{t('noAddons')}</p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeft className="h-4 w-4" />
          {locale === 'is' ? 'Til baka' : 'Back'}
        </button>
        <button onClick={onNext} className="btn-primary btn-lg">
          {t('next')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
