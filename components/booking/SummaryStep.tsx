'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Car,
  Plane,
  Calendar,
  Sparkles,
  ArrowLeft,
  Loader2,
  CreditCard,
  CheckCircle2,
  PlaneTakeoff,
  PlaneLanding,
  Clock,
  Shield,
  MapPin,
  Info,
  Zap,
  Droplets,
  Snowflake,
  ChevronRight,
  Lock,
  CalendarDays,
  Check,
  Wallet,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { formatPrice, formatDateTime, calculateDays, cn } from '@/lib/utils';
import type { BookingData } from '@/app/[locale]/(customer)/booking/page';
import { useSession } from 'next-auth/react';

interface SummaryStepProps {
  data: BookingData;
  onBack: () => void;
  onUpdate: (data: Partial<BookingData>) => void;
}

interface ServiceData {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  lotServices: {
    price: number;
    vehicleType: {
      code: string;
    };
  }[];
}

// Base parking prices (base fee + daily rate)
const BASE_FEE = 7000;
const DAILY_RATE = 600;

// Service icons
const serviceIcons: Record<string, typeof Zap> = {
  ev_charge: Zap,
  wash_basic: Droplets,
  wash_premium: Droplets,
  winter_service: Snowflake,
};

// Payment method type
type PaymentMethod = 'rapyd' | 'netgiro';

interface PaymentSettings {
  rapydEnabled: boolean;
  netgiroEnabled: boolean;
}

export default function SummaryStep({ data, onBack, onUpdate }: SummaryStepProps) {
  const t = useTranslations('booking');
  const tv = useTranslations('vehicle');
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [guestInfoError, setGuestInfoError] = useState<string | null>(null);
  const [emailExistsError, setEmailExistsError] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('rapyd');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    rapydEnabled: true,
    netgiroEnabled: false,
  });

  // Check if email already exists when user finishes typing
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setIsCheckingEmail(true);
    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const result = await response.json();
      if (result.success && result.exists) {
        setEmailExistsError(true);
      } else {
        setEmailExistsError(false);
      }
    } catch (error) {
      console.error('Email check error:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings?public=true');
      const result = await response.json();
      if (result.success && result.data) {
        const rapydEnabled = result.data.rapydEnabled !== false;
        const netgiroEnabled = result.data.netgiroEnabled === true;
        setPaymentSettings({ rapydEnabled, netgiroEnabled });
        // Set default to first available method
        if (rapydEnabled) {
          setSelectedPaymentMethod('rapyd');
        } else if (netgiroEnabled) {
          setSelectedPaymentMethod('netgiro');
        }
      }
    } catch (err) {
      console.error('Failed to fetch payment settings:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      const result = await response.json();
      if (result.success) {
        setServices(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceInfo = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return { name: serviceId, price: 0, code: '' };
    
    const name = locale === 'is' ? service.name : (service.nameEn || service.name);
    const lotService = service.lotServices.find(ls => ls.vehicleType.code === data.vehicleTypeId);
    const price = lotService?.price || 0;
    
    return { name, price, code: service.code };
  };

  // Calculate pricing
  const totalDays = calculateDays(data.dropOffTime, data.pickUpTime);
  const baseTotal = BASE_FEE + (DAILY_RATE * totalDays);
  const addonsTotal = data.selectedAddons.reduce(
    (sum, id) => sum + getServiceInfo(id).price,
    0
  );
  const totalPrice = baseTotal + addonsTotal;

  // Format dates for display
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString(locale === 'is' ? 'is-IS' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = async () => {
    // Validate guest info if not logged in
    if (status !== 'loading' && !session) {
      if (!data.guestName || !data.guestEmail || !data.guestPhone) {
        setGuestInfoError(
          locale === 'is' 
            ? 'Vinsamlegast fylltu út öll tengiliðaupplýsingar' 
            : 'Please fill in all contact information'
        );
        // Scroll to guest info section
        document.querySelector('[data-guest-info]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.guestEmail)) {
        setGuestInfoError(
          locale === 'is' 
            ? 'Vinsamlegast sláðu inn gilt netfang' 
            : 'Please enter a valid email address'
        );
        return;
      }

      // Check if email already exists (block submission)
      if (emailExistsError) {
        document.querySelector('[data-guest-info]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      setGuestInfoError(null);
    }

    if (!agreedToTerms) {
      setShowTermsError(true);
      // Scroll to terms section
      document.getElementById('terms-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create the booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          locale, // Include user's language preference for email notifications
          totalDays,
          basePricePerDay: DAILY_RATE,
          baseTotal,
          addonsTotal,
          totalPrice,
        }),
      });

      const bookingResult = await bookingResponse.json();

      if (!bookingResult.success) {
        alert(bookingResult.error || 'Booking failed');
        return;
      }

      const bookingId = bookingResult.data.id;
      const bookingRef = bookingResult.data.reference;

      // Clear saved booking draft from localStorage
      try {
        localStorage.removeItem('kef-booking-draft');
      } catch (e) {
        // Ignore
      }

      // Step 2: Create payment checkout session
      const checkoutResponse = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, locale, provider: selectedPaymentMethod }),
      });

      const checkoutResult = await checkoutResponse.json();

      if (checkoutResult.success && checkoutResult.data) {
        const { provider, redirectUrl, checkoutUrl, formData } = checkoutResult.data;

        if (provider === 'netgiro' && checkoutUrl && formData) {
          // Netgiro uses form POST redirect
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = checkoutUrl;
          form.style.display = 'none';

          // Add all form fields
          Object.entries(formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value as string;
            form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();
        } else if (redirectUrl) {
          // Rapyd/other providers use redirect URL
          window.location.href = redirectUrl;
        } else {
          // If payment gateway not configured, go to confirmation page
          console.warn('Payment checkout not available, redirecting to confirmation');
          router.push(`/${locale}/booking/confirmation?ref=${bookingRef}`);
        }
      } else {
        // If payment gateway not configured, go to confirmation page
        // (for development/testing without payment)
        console.warn('Payment checkout not available, redirecting to confirmation');
        router.push(`/${locale}/booking/confirmation?ref=${bookingRef}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button - top */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">{locale === 'is' ? 'Til baka' : 'Back'}</span>
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {locale === 'is' ? 'Staðfesta bókun' : 'Confirm Booking'}
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                {locale === 'is' ? 'Yfirfarðu og greiddu' : 'Review and pay'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Lock className="h-4 w-4" />
              <span>{locale === 'is' ? 'Örugg greiðsla' : 'Secure checkout'}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Vehicle Section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <Car className="h-4 w-4" />
              {locale === 'is' ? 'Ökutæki' : 'Vehicle'}
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
              {/* Icelandic License Plate */}
              <div className="flex overflow-hidden rounded-lg border-2 border-slate-400 shadow-lg">
                <div className="bg-[#0048e0] px-2.5 py-2 flex flex-col items-center justify-center min-w-[32px]">
                  <div className="w-6 h-4 relative overflow-hidden rounded-[2px] border border-white/30">
                    <div className="absolute inset-0 bg-[#02529C]" />
                    <div className="absolute top-0 bottom-0 left-[30%] w-[20%] bg-white -translate-x-1/2" />
                    <div className="absolute left-0 right-0 top-1/2 h-[28%] bg-white -translate-y-1/2" />
                    <div className="absolute top-0 bottom-0 left-[30%] w-[10%] bg-[#DC1E35] -translate-x-1/2" />
                    <div className="absolute left-0 right-0 top-1/2 h-[14%] bg-[#DC1E35] -translate-y-1/2" />
                  </div>
                  <span className="text-[8px] font-bold text-white mt-1 tracking-tight">IS</span>
                </div>
                <div className="bg-white px-5 py-2 flex items-center">
                  <span className="text-2xl font-bold tracking-[0.25em] text-[#0048e0] font-mono uppercase">
                    {data.licensePlate.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="flex-1">
                <p className="font-semibold text-slate-900">
                  {data.vehicleInfo?.make} {data.vehicleInfo?.model}
                </p>
                <p className="text-sm text-slate-500">
                  {data.vehicleInfo?.year}
                  {data.vehicleInfo?.color && ` · ${data.vehicleInfo.color}`}
                </p>
              </div>
              
              {data.vehicleInfo?.isElectric && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  {locale === 'is' ? 'Rafbíll' : 'EV'}
                </span>
              )}
            </div>
          </div>

          {/* Schedule Section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <CalendarDays className="h-4 w-4" />
              {locale === 'is' ? 'Tímasetningar' : 'Schedule'}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Drop-off */}
              <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <PlaneTakeoff className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {locale === 'is' ? 'Brottför' : 'Drop-off'}
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900 capitalize">
                  {formatDisplayDate(data.dropOffTime)}
                </p>
                <p className="text-2xl font-bold text-green-600 font-mono">
                  {formatTime(data.dropOffTime)}
                </p>
                {data.departureFlightNumber && (
                  <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                    <Plane className="h-3 w-3" />
                    {data.departureFlightNumber}
                  </p>
                )}
              </div>

              {/* Pick-up */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <PlaneLanding className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">
                    {locale === 'is' ? 'Koma' : 'Pick-up'}
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900 capitalize">
                  {formatDisplayDate(data.pickUpTime)}
                </p>
                <p className="text-2xl font-bold text-blue-600 font-mono">
                  {formatTime(data.pickUpTime)}
                </p>
                {data.arrivalFlightNumber && (
                  <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                    <Plane className="h-3 w-3" />
                    {data.arrivalFlightNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="mt-3 flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-medium">
                <Clock className="h-4 w-4" />
                {totalDays} {totalDays === 1 ? (locale === 'is' ? 'dagur' : 'day') : (locale === 'is' ? 'dagar' : 'days')}
              </span>
            </div>
          </div>

          {/* Add-ons Section */}
          {data.selectedAddons.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                <Sparkles className="h-4 w-4" />
                {locale === 'is' ? 'Viðbætur' : 'Add-ons'}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.selectedAddons.map((id) => {
                  const { name, code } = getServiceInfo(id);
                  const Icon = serviceIcons[code] || Sparkles;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-medium"
                    >
                      <Icon className="h-4 w-4" />
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200" />

          {/* Price Breakdown */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <CreditCard className="h-4 w-4" />
              {locale === 'is' ? 'Verðyfirlit' : 'Price Breakdown'}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">{locale === 'is' ? 'Grunngjald' : 'Base fee'}</span>
                <span className="font-medium">{formatPrice(BASE_FEE, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {totalDays} {totalDays === 1 ? (locale === 'is' ? 'dagur' : 'day') : (locale === 'is' ? 'dagar' : 'days')} × {formatPrice(DAILY_RATE, locale)}
                </span>
                <span className="font-medium">{formatPrice(DAILY_RATE * totalDays, locale)}</span>
              </div>
              {data.selectedAddons.map((id) => {
                const { name, price } = getServiceInfo(id);
                return (
                  <div key={id} className="flex justify-between">
                    <span className="text-slate-600">{name}</span>
                    <span className="font-medium">{formatPrice(price, locale)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 -mx-6 px-6 py-5 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-primary-200 text-sm">{locale === 'is' ? 'Samtals' : 'Total'}</p>
                <p className="text-xs text-primary-300">{locale === 'is' ? 'VSK innifalinn' : 'VAT included'}</p>
              </div>
              <p className="text-2xl sm:text-4xl font-bold">{formatPrice(totalPrice, locale)}</p>
            </div>
          </div>

          {/* Terms & Payment */}
          <div className="space-y-4">
            {/* Guest Contact Info - only shown if not logged in */}
            {status !== 'loading' && !session && (
              <div className="space-y-4" data-guest-info>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <User className="h-4 w-4" />
                  {locale === 'is' ? 'Tengiliðaupplýsingar' : 'Contact Information'}
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                  <p className="text-sm text-slate-600 mb-4">
                    {locale === 'is' 
                      ? 'Fylltu út tengiliðaupplýsingar til að fá staðfestingu bókunar.' 
                      : 'Please enter your contact details to receive your booking confirmation.'}
                  </p>
                  
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {locale === 'is' ? 'Nafn' : 'Full Name'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        value={data.guestName || ''}
                        onChange={(e) => onUpdate({ guestName: e.target.value })}
                        placeholder={locale === 'is' ? 'Jón Jónsson' : 'John Smith'}
                        className={cn(
                          'w-full pl-11 pr-4 py-3 rounded-xl border transition-all',
                          guestInfoError && !data.guestName
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
                        )}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {locale === 'is' ? 'Netfang' : 'Email Address'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        value={data.guestEmail || ''}
                        onChange={(e) => {
                          onUpdate({ guestEmail: e.target.value });
                          setEmailExistsError(false); // Reset error on change
                        }}
                        onBlur={(e) => checkEmailExists(e.target.value)}
                        placeholder={locale === 'is' ? 'jon@example.is' : 'john@example.com'}
                        className={cn(
                          'w-full pl-11 pr-4 py-3 rounded-xl border transition-all',
                          emailExistsError
                            ? 'border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-200'
                            : guestInfoError && !data.guestEmail
                              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                              : 'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
                        )}
                      />
                      {isCheckingEmail && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
                      )}
                    </div>
                    
                    {/* Email exists warning */}
                    {emailExistsError && (
                      <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-sm text-amber-800 font-medium mb-2">
                          {locale === 'is' 
                            ? 'Þetta netfang er þegar skráð!' 
                            : 'This email is already registered!'}
                        </p>
                        <p className="text-xs text-amber-700 mb-3">
                          {locale === 'is'
                            ? 'Vinsamlegast skráðu þig inn til að halda áfram með bókunina, eða notaðu annað netfang.'
                            : 'Please log in to continue with your booking, or use a different email address.'}
                        </p>
                        <a
                          href={`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/booking`)}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                        >
                          <Lock className="h-4 w-4" />
                          {locale === 'is' ? 'Skrá inn' : 'Log in'}
                        </a>
                      </div>
                    )}
                    
                    {!emailExistsError && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        {locale === 'is' 
                          ? 'Við sendum staðfestingu á þetta netfang'
                          : 'We\'ll send your confirmation to this email'}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {locale === 'is' ? 'Símanúmer' : 'Phone Number'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="tel"
                        value={data.guestPhone || ''}
                        onChange={(e) => onUpdate({ guestPhone: e.target.value })}
                        placeholder={locale === 'is' ? '+354 XXX XXXX' : '+354 XXX XXXX'}
                        className={cn(
                          'w-full pl-11 pr-4 py-3 rounded-xl border transition-all',
                          guestInfoError && !data.guestPhone
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
                        )}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      {locale === 'is' 
                        ? 'Við notum þetta til að hafa samband ef þörf krefur'
                        : 'We\'ll use this to contact you if needed'}
                    </p>
                  </div>

                  {guestInfoError && (
                    <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      {guestInfoError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Payment method selection */}
            {(paymentSettings.rapydEnabled || paymentSettings.netgiroEnabled) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {locale === 'is' ? 'Greiðslumáti' : 'Payment Method'}
                </h4>
                <div className="grid gap-2">
                  {paymentSettings.rapydEnabled && (
                    <label 
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        selectedPaymentMethod === 'rapyd'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="rapyd"
                        checked={selectedPaymentMethod === 'rapyd'}
                        onChange={() => setSelectedPaymentMethod('rapyd')}
                        className="sr-only"
                      />
                      <div className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all flex-shrink-0',
                        selectedPaymentMethod === 'rapyd'
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-slate-300'
                      )}>
                        {selectedPaymentMethod === 'rapyd' && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-slate-600" />
                          <span className="font-medium text-slate-900">
                            {locale === 'is' ? 'Debet-/kreditkort' : 'Credit/Debit Card'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Visa, Mastercard, American Express
                        </p>
                      </div>
                    </label>
                  )}
                  
                  {paymentSettings.netgiroEnabled && (
                    <label 
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        selectedPaymentMethod === 'netgiro'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="netgiro"
                        checked={selectedPaymentMethod === 'netgiro'}
                        onChange={() => setSelectedPaymentMethod('netgiro')}
                        className="sr-only"
                      />
                      <div className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all flex-shrink-0',
                        selectedPaymentMethod === 'netgiro'
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-slate-300'
                      )}>
                        {selectedPaymentMethod === 'netgiro' && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-slate-600" />
                          <span className="font-medium text-slate-900">Netgíró</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {locale === 'is' ? 'Greiða með Netgíró' : 'Pay with Netgíró'}
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Terms checkbox */}
            <div id="terms-section">
              <label 
                className={cn(
                  'flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all',
                  agreedToTerms
                    ? 'border-green-500 bg-green-50'
                    : showTermsError
                      ? 'border-red-500 bg-red-50 animate-shake'
                      : 'border-slate-200 hover:border-slate-300'
                )}
                onClick={() => setShowTermsError(false)}
              >
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all flex-shrink-0',
                  agreedToTerms
                    ? 'border-green-500 bg-green-500 text-white'
                    : showTermsError
                      ? 'border-red-500'
                      : 'border-slate-300'
                )}>
                  {agreedToTerms && <Check className="h-4 w-4" />}
                </div>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    setShowTermsError(false);
                  }}
                  className="sr-only"
                />
                <span className={cn(
                  'text-sm',
                  agreedToTerms ? 'text-green-800' : showTermsError ? 'text-red-700' : 'text-slate-600'
                )}>
                  {locale === 'is' ? 'Ég samþykki ' : 'I agree to the '}
                  <a 
                    href={`/${locale}/terms`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 underline font-medium hover:text-primary-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {locale === 'is' ? 'skilmála þjónustunnar' : 'terms of service'}
                  </a>
                </span>
              </label>
              
              {showTermsError && (
                <p className="text-sm text-red-600 flex items-center gap-2 mt-2 px-1">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  {locale === 'is' 
                    ? 'Vinsamlegast samþykktu skilmálana til að halda áfram' 
                    : 'Please accept the terms to continue'}
                </p>
              )}
            </div>

            {/* Pay button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'w-full flex items-center justify-center gap-3 rounded-2xl px-6 py-5 text-lg font-bold transition-all',
                isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-500 shadow-xl shadow-primary-600/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  {locale === 'is' ? 'Augnablik...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  {locale === 'is' ? 'Greiða örugglega' : 'Pay Securely'} · {formatPrice(totalPrice, locale)}
                </>
              )}
            </button>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 pt-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Shield className="h-4 w-4 text-green-500" />
                {locale === 'is' ? 'SSL dulkóðun' : 'SSL Encrypted'}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {locale === 'is' ? 'Örugg greiðsla' : 'Secure Payment'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex gap-4">
        <Info className="h-6 w-6 text-amber-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-amber-900 mb-2">
            {locale === 'is' ? 'Gott að vita' : 'Good to know'}
          </p>
          <ul className="space-y-1.5 text-sm text-amber-800">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
              {locale === 'is' 
                ? 'Mættu 15-20 mínútum áður en flugið fer'
                : 'Arrive 15-20 minutes before your flight'}
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
              {locale === 'is'
                ? 'Ókeypis skutla að flugstöðinni'
                : 'Free shuttle to the terminal'}
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
              {locale === 'is'
                ? 'Hægt að breyta bókun án kostnaðar'
                : 'Free booking modifications'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
