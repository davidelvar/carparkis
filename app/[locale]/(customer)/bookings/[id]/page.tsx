'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Car,
  Calendar,
  MapPin,
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PlaneTakeoff,
  PlaneLanding,
  Sparkles,
  Download,
  Mail,
  Copy,
  Check,
  CarFront,
  ExternalLink,
  Phone,
  Navigation,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';

interface Booking {
  id: string;
  reference: string;
  status: string;
  dropOffTime: string;
  pickUpTime: string;
  totalDays: number;
  basePricePerDay: number;
  baseTotal: number;
  addonsTotal: number;
  totalPrice: number;
  departureFlightNumber?: string;
  arrivalFlightNumber?: string;
  notes?: string;
  spotNumber?: string;
  createdAt: string;
  vehicle: {
    licensePlate: string;
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    isElectric: boolean;
    vehicleType: {
      name: string;
      nameEn?: string;
    };
  };
  lot: {
    name: string;
    nameEn?: string;
    address?: string;
    instructions?: string;
    instructionsEn?: string;
  };
  addons: {
    id: string;
    price: number;
    status: string;
    service: {
      name: string;
      nameEn?: string;
    };
  }[];
}

const STATUS_CONFIG: Record<string, { 
  icon: React.ElementType; 
  color: string; 
  bg: string;
  label: { is: string; en: string };
  description: { is: string; en: string };
}> = {
  PENDING: { 
    icon: Clock, 
    color: 'text-amber-600', 
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    label: { is: 'Í bið', en: 'Pending' },
    description: { is: 'Bókun þín bíður staðfestingar', en: 'Your booking is awaiting confirmation' }
  },
  CONFIRMED: { 
    icon: CheckCircle2, 
    color: 'text-blue-600', 
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    label: { is: 'Staðfest', en: 'Confirmed' },
    description: { is: 'Bókun þín er staðfest og tilbúin', en: 'Your booking is confirmed and ready' }
  },
  CHECKED_IN: { 
    icon: CarFront, 
    color: 'text-violet-600', 
    bg: 'bg-gradient-to-r from-violet-500 to-purple-500',
    label: { is: 'Bíll í geymslu', en: 'Car Parked' },
    description: { is: 'Bíllinn þinn er öruggur í geymslu okkar', en: 'Your car is safely parked with us' }
  },
  IN_PROGRESS: { 
    icon: Sparkles, 
    color: 'text-cyan-600', 
    bg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    label: { is: 'Í vinnslu', en: 'In Progress' },
    description: { is: 'Við erum að vinna í þjónustum þínum', en: 'We are working on your services' }
  },
  READY: { 
    icon: CheckCircle2, 
    color: 'text-green-600', 
    bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    label: { is: 'Tilbúið', en: 'Ready' },
    description: { is: 'Bíllinn þinn er tilbúinn til afhendingar!', en: 'Your car is ready for pickup!' }
  },
  CHECKED_OUT: { 
    icon: CheckCircle2, 
    color: 'text-slate-600', 
    bg: 'bg-gradient-to-r from-slate-500 to-slate-600',
    label: { is: 'Lokið', en: 'Completed' },
    description: { is: 'Bókun lokið. Takk fyrir viðskiptin!', en: 'Booking complete. Thank you!' }
  },
  CANCELLED: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-gradient-to-r from-red-500 to-rose-500',
    label: { is: 'Afturkölluð', en: 'Cancelled' },
    description: { is: 'Þessi bókun hefur verið afturkölluð', en: 'This booking has been cancelled' }
  },
  NO_SHOW: { 
    icon: AlertCircle, 
    color: 'text-orange-600', 
    bg: 'bg-gradient-to-r from-orange-500 to-red-500',
    label: { is: 'Mætti ekki', en: 'No Show' },
    description: { is: 'Viðskiptavinur mætti ekki', en: 'Customer did not show up' }
  },
};

const ADDON_STATUS_CONFIG: Record<string, { label: { is: string; en: string }; color: string; bg: string }> = {
  PENDING: { label: { is: 'Í bið', en: 'Pending' }, color: 'text-amber-700', bg: 'bg-amber-50' },
  IN_PROGRESS: { label: { is: 'Í vinnslu', en: 'In Progress' }, color: 'text-blue-700', bg: 'bg-blue-50' },
  COMPLETED: { label: { is: 'Lokið', en: 'Done' }, color: 'text-green-700', bg: 'bg-green-50' },
  SKIPPED: { label: { is: 'Sleppt', en: 'Skipped' }, color: 'text-slate-500', bg: 'bg-slate-100' },
};

export default function BookingDetailPage() {
  const t = useTranslations('booking');
  const locale = useLocale();
  const params = useParams();
  const id = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${id}`);
      const result = await response.json();

      if (result.success) {
        setBooking(result.data);
      } else {
        setError(locale === 'is' ? 'Bókun fannst ekki' : 'Booking not found');
      }
    } catch (err) {
      setError(locale === 'is' ? 'Villa við að sækja bókun' : 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const copyReference = () => {
    if (booking?.reference) {
      navigator.clipboard.writeText(booking.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(locale === 'is' ? 'is-IS' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-slate-600">
            {locale === 'is' ? 'Hleð bókun...' : 'Loading booking...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            {locale === 'is' ? 'Bókun fannst ekki' : 'Booking not found'}
          </h2>
          <p className="mt-2 text-slate-600">{error}</p>
          <Link 
            href={`/${locale}/bookings`} 
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-500 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === 'is' ? 'Til baka' : 'Go back'}
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const isActive = !['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(booking.status);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Status Banner */}
      <div className={cn('relative overflow-hidden', statusConfig.bg)}>
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <Link
            href={`/${locale}/bookings`}
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === 'is' ? 'Til baka í bókanir' : 'Back to bookings'}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <StatusIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {statusConfig.label[locale as 'is' | 'en']}
                  </h1>
                  <p className="text-white/80 text-sm">
                    {statusConfig.description[locale as 'is' | 'en']}
                  </p>
                </div>
              </div>
            </div>

            {/* Reference */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <span className="text-white/70 text-sm">{t('bookingReference')}:</span>
              <span className="font-mono font-bold text-white text-lg">
                {booking.reference}
              </span>
              <button
                onClick={copyReference}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title={locale === 'is' ? 'Afrita' : 'Copy'}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <Copy className="h-4 w-4 text-white/70" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  {locale === 'is' ? 'Ökutæki' : 'Vehicle'}
                </h2>
                <div className="flex items-center gap-4">
                  <div className="h-16 px-5 rounded-xl bg-slate-900 flex items-center justify-center">
                    <span className="font-mono font-bold text-white text-xl tracking-wider">
                      {booking.vehicle.licensePlate}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">
                      {booking.vehicle.make} {booking.vehicle.model}
                    </p>
                    <p className="text-sm text-slate-500">
                      {booking.vehicle.year && `${booking.vehicle.year} • `}
                      {locale === 'is' 
                        ? booking.vehicle.vehicleType.name 
                        : (booking.vehicle.vehicleType.nameEn || booking.vehicle.vehicleType.name)}
                      {booking.vehicle.isElectric && ' • ⚡ Rafbíll'}
                    </p>
                  </div>
                </div>
                {booking.spotNumber && (
                  <div className="mt-4 p-3 rounded-xl bg-primary-50 border border-primary-100">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-xs text-primary-600 font-medium">
                          {locale === 'is' ? 'Bílastæði númer' : 'Parking Spot'}
                        </p>
                        <p className="font-bold text-primary-900 text-lg">{booking.spotNumber}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  {locale === 'is' ? 'Tímaáætlun' : 'Schedule'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Drop Off */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <PlaneTakeoff className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">
                          {locale === 'is' ? 'Koma / Drop-off' : 'Drop-off'}
                        </p>
                        <p className="font-semibold text-slate-900">{formatTime(booking.dropOffTime)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 ml-[52px]">{formatDate(booking.dropOffTime)}</p>
                    {booking.departureFlightNumber && (
                      <p className="text-sm text-slate-500 ml-[52px] mt-1">
                        ✈️ {booking.departureFlightNumber}
                      </p>
                    )}
                  </div>

                  {/* Pick Up */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <PlaneLanding className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">
                          {locale === 'is' ? 'Sækja / Pick-up' : 'Pick-up'}
                        </p>
                        <p className="font-semibold text-slate-900">{formatTime(booking.pickUpTime)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 ml-[52px]">{formatDate(booking.pickUpTime)}</p>
                    {booking.arrivalFlightNumber && (
                      <p className="text-sm text-slate-500 ml-[52px] mt-1">
                        ✈️ {booking.arrivalFlightNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {booking.totalDays} {booking.totalDays === 1 ? t('day') : t('days')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Card */}
            {booking.addons.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    {locale === 'is' ? 'Viðbótarþjónustur' : 'Additional Services'}
                  </h2>
                  <div className="space-y-3">
                    {booking.addons.map((addon) => {
                      const addonStatus = ADDON_STATUS_CONFIG[addon.status] || ADDON_STATUS_CONFIG.PENDING;
                      return (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Sparkles className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {locale === 'is' 
                                  ? addon.service.name 
                                  : (addon.service.nameEn || addon.service.name)}
                              </p>
                              <span className={cn(
                                'inline-flex text-xs font-medium px-2 py-0.5 rounded',
                                addonStatus.bg,
                                addonStatus.color
                              )}>
                                {addonStatus.label[locale as 'is' | 'en']}
                              </span>
                            </div>
                          </div>
                          <span className="font-semibold text-slate-900">
                            {formatPrice(addon.price, locale)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Location Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  {locale === 'is' ? 'Staðsetning' : 'Location'}
                </h2>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">
                      {locale === 'is' ? booking.lot.name : (booking.lot.nameEn || booking.lot.name)}
                    </p>
                    {booking.lot.address && (
                      <p className="text-slate-600">{booking.lot.address}</p>
                    )}
                    {booking.lot.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.lot.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 text-sm text-primary-600 font-medium hover:text-primary-500"
                      >
                        <Navigation className="h-4 w-4" />
                        {locale === 'is' ? 'Opna í kortum' : 'Open in Maps'}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {booking.lot.instructions && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-sm font-medium text-amber-800 mb-1">
                      {locale === 'is' ? 'Leiðbeiningar' : 'Instructions'}
                    </p>
                    <p className="text-sm text-amber-700 whitespace-pre-wrap">
                      {locale === 'is'
                        ? booking.lot.instructions
                        : (booking.lot.instructionsEn || booking.lot.instructions)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    {locale === 'is' ? 'Athugasemdir' : 'Notes'}
                  </h2>
                  <p className="text-slate-600">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  {locale === 'is' ? 'Verðyfirlit' : 'Price Summary'}
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {locale === 'is' ? 'Bílastæði' : 'Parking'} ({booking.totalDays} {booking.totalDays === 1 ? t('day') : t('days')})
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatPrice(booking.baseTotal, locale)}
                    </span>
                  </div>
                  {booking.addonsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {locale === 'is' ? 'Þjónustur' : 'Services'}
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatPrice(booking.addonsTotal, locale)}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-900">{t('total')}</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary-600">
                          {formatPrice(booking.totalPrice, locale)}
                        </span>
                        <p className="text-xs text-slate-500">{t('vat')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
                  <Download className="h-4 w-4" />
                  {locale === 'is' ? 'Sækja kvittun' : 'Download receipt'}
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
                  <Mail className="h-4 w-4" />
                  {locale === 'is' ? 'Senda í tölvupóst' : 'Email confirmation'}
                </button>
                {isActive && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors">
                    <XCircle className="h-4 w-4" />
                    {locale === 'is' ? 'Afturkalla bókun' : 'Cancel booking'}
                  </button>
                )}
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden">
              <div className="p-6">
                <h3 className="font-semibold text-white mb-2">
                  {locale === 'is' ? 'Þarftu aðstoð?' : 'Need help?'}
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  {locale === 'is' 
                    ? 'Við erum tilbúin að aðstoða þig.'
                    : 'We\'re here to help you.'}
                </p>
                <a
                  href="tel:+3545555555"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-medium text-sm hover:bg-slate-100 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  +354 555 5555
                </a>
              </div>
            </div>

            {/* Book Again */}
            {!isActive && (
              <Link
                href={`/${locale}/booking`}
                className="block w-full text-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 transition-all"
              >
                <RotateCcw className="h-4 w-4 inline mr-2" />
                {locale === 'is' ? 'Bóka aftur' : 'Book again'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
