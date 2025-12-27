'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  RefreshCw,
  Zap,
  Shield,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { useSiteSettings } from '@/lib/settings/context';

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
  const { settings } = useSiteSettings();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const fetchBooking = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  };

  const copyReference = () => {
    if (booking?.reference) {
      navigator.clipboard.writeText(booking.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadReceipt = () => {
    if (booking) {
      // Open receipt in new window for printing/saving as PDF
      window.open(`/api/bookings/${booking.id}/receipt?locale=${locale}`, '_blank');
    }
  };

  const handleSendEmail = async () => {
    if (!booking) return;
    
    setIsSendingEmail(true);
    setActionMessage(null);
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setActionMessage({
          type: 'success',
          text: locale === 'is' 
            ? 'Staðfesting send í tölvupóst!' 
            : 'Confirmation email sent!'
        });
      } else {
        setActionMessage({
          type: 'error',
          text: result.error || (locale === 'is' ? 'Villa við að senda tölvupóst' : 'Failed to send email')
        });
      }
    } catch {
      setActionMessage({
        type: 'error',
        text: locale === 'is' ? 'Villa við að senda tölvupóst' : 'Failed to send email'
      });
    } finally {
      setIsSendingEmail(false);
      // Clear message after 5 seconds
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    
    setIsCancelling(true);
    setActionMessage(null);
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setActionMessage({
          type: 'success',
          text: locale === 'is' 
            ? 'Bókun hefur verið afturkölluð' 
            : 'Booking has been cancelled'
        });
        // Refresh booking to show updated status
        fetchBooking(true);
      } else {
        setActionMessage({
          type: 'error',
          text: result.error || (locale === 'is' ? 'Villa við að afturkalla bókun' : 'Failed to cancel booking')
        });
      }
    } catch {
      setActionMessage({
        type: 'error',
        text: locale === 'is' ? 'Villa við að afturkalla bókun' : 'Failed to cancel booking'
      });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
      // Clear message after 5 seconds
      setTimeout(() => setActionMessage(null), 5000);
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
          <p className="mt-4 text-slate-600 font-medium">
            {locale === 'is' ? 'Hleð bókun...' : 'Loading booking...'}
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="h-20 w-20 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            {locale === 'is' ? 'Bókun fannst ekki' : 'Booking not found'}
          </h2>
          <p className="mt-2 text-slate-600">{error}</p>
          <Link 
            href={`/${locale}/bookings`} 
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/25"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === 'is' ? 'Til baka' : 'Go back'}
          </Link>
        </motion.div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const isActive = !['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(booking.status);

  // Calculate time remaining/since
  const getTimeText = () => {
    const now = new Date();
    const dropOff = new Date(booking.dropOffTime);
    const pickUp = new Date(booking.pickUpTime);
    
    if (booking.status === 'CHECKED_IN' || booking.status === 'IN_PROGRESS') {
      const diffTime = pickUp.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return locale === 'is' ? `${diffDays} dagar eftir` : `${diffDays} days left`;
      }
    }
    
    if (['PENDING', 'CONFIRMED'].includes(booking.status)) {
      const diffTime = dropOff.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return locale === 'is' ? 'Í dag' : 'Today';
      if (diffDays === 1) return locale === 'is' ? 'Á morgun' : 'Tomorrow';
      if (diffDays > 1) return locale === 'is' ? `Eftir ${diffDays} daga` : `In ${diffDays} days`;
    }
    
    return null;
  };

  const timeText = getTimeText();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Status Banner */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('relative overflow-hidden', statusConfig.bg)}
      >
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
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <StatusIcon className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">
                      {statusConfig.label[locale as 'is' | 'en']}
                    </h1>
                    {timeText && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
                        {timeText}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 text-sm">
                    {statusConfig.description[locale as 'is' | 'en']}
                  </p>
                </div>
              </div>
            </div>

            {/* Reference & Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchBooking(true)}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors disabled:opacity-50"
                title={locale === 'is' ? 'Endurhlaða' : 'Refresh'}
              >
                <RefreshCw className={cn('h-5 w-5 text-white', isRefreshing && 'animate-spin')} />
              </button>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-white/70 text-sm hidden sm:inline">{t('bookingReference')}:</span>
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
      </motion.div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  {locale === 'is' ? 'Ökutæki' : 'Vehicle'}
                </h2>
                <div className="flex items-center gap-4">
                  <div className="h-16 px-5 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                    <span className="font-mono font-bold text-white text-xl tracking-wider">
                      {booking.vehicle.licensePlate}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">
                      {booking.vehicle.make} {booking.vehicle.model}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-slate-500">
                        {booking.vehicle.year && `${booking.vehicle.year} • `}
                        {locale === 'is' 
                          ? booking.vehicle.vehicleType.name 
                          : (booking.vehicle.vehicleType.nameEn || booking.vehicle.vehicleType.name)}
                      </p>
                      {booking.vehicle.isElectric && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                          <Zap className="h-3 w-3" />
                          {locale === 'is' ? 'Rafbíll' : 'Electric'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Schedule Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
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
                      <div className="ml-[52px] mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-sm">
                        ✈️ {booking.departureFlightNumber}
                      </div>
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
                      <div className="ml-[52px] mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-sm">
                        ✈️ {booking.arrivalFlightNumber}
                      </div>
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
            </motion.div>

            {/* Services Card */}
            {booking.addons.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {locale === 'is' ? 'Viðbótarþjónustur' : 'Additional Services'}
                  </h2>
                  <div className="space-y-3">
                    {booking.addons.map((addon) => {
                      const addonStatus = ADDON_STATUS_CONFIG[addon.status] || ADDON_STATUS_CONFIG.PENDING;
                      return (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
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
              </motion.div>
            )}

            {/* Location Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {locale === 'is' ? 'Staðsetning' : 'Location'}
                </h2>
                {(() => {
                  const displayAddress = settings.address || booking.lot.address || '';
                  return (
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-lg">
                          {locale === 'is' ? settings.siteName : settings.siteNameEn}
                        </p>
                        {displayAddress && (
                          <p className="text-slate-600">{displayAddress}</p>
                        )}
                        {displayAddress && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-sm text-primary-600 font-medium hover:text-primary-500 transition-colors"
                          >
                            <Navigation className="h-4 w-4" />
                            {locale === 'is' ? 'Opna í kortum' : 'Open in Maps'}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {booking.lot.instructions && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
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
            </motion.div>

            {/* Notes */}
            {booking.notes && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="p-6">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {locale === 'is' ? 'Athugasemdir' : 'Notes'}
                  </h2>
                  <p className="text-slate-600">{booking.notes}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
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
                {/* Action Message */}
                {actionMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'p-3 rounded-lg text-sm font-medium flex items-center gap-2',
                      actionMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    )}
                  >
                    {actionMessage.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    {actionMessage.text}
                  </motion.div>
                )}

                <button 
                  onClick={handleDownloadReceipt}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <Download className="h-4 w-4" />
                  {locale === 'is' ? 'Sækja kvittun' : 'Download receipt'}
                </button>
                <button 
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {isSendingEmail 
                    ? (locale === 'is' ? 'Sendi...' : 'Sending...') 
                    : (locale === 'is' ? 'Senda í tölvupóst' : 'Email confirmation')}
                </button>
                {isActive && (
                  <button 
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 hover:border-red-300 transition-all"
                  >
                    <XCircle className="h-4 w-4" />
                    {locale === 'is' ? 'Afturkalla bókun' : 'Cancel booking'}
                  </button>
                )}
              </div>
            </motion.div>

            {/* Support Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900 rounded-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white">
                    {locale === 'is' ? 'Þarftu aðstoð?' : 'Need help?'}
                  </h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  {locale === 'is' 
                    ? 'Við erum tilbúin að aðstoða þig allan sólarhringinn.'
                    : 'We\'re here to help you 24/7.'}
                </p>
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-medium text-sm hover:bg-slate-100 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {settings.contactPhone}
                </a>
              </div>
            </motion.div>

            {/* Book Again */}
            {!isActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href={`/${locale}/booking`}
                  className="block w-full text-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5"
                >
                  <RotateCcw className="h-4 w-4 inline mr-2" />
                  {locale === 'is' ? 'Bóka aftur' : 'Book again'}
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !isCancelling && setShowCancelDialog(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {locale === 'is' ? 'Afturkalla bókun?' : 'Cancel booking?'}
              </h3>
              <p className="mt-2 text-slate-600">
                {locale === 'is' 
                  ? 'Ertu viss um að þú viljir afturkalla þessa bókun? Ekki er hægt að afturkalla þessa aðgerð.'
                  : 'Are you sure you want to cancel this booking? This action cannot be undone.'}
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{locale === 'is' ? 'Bókunarnúmer' : 'Reference'}</span>
                <span className="font-mono font-bold text-slate-900">{booking.reference}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {locale === 'is' ? 'Hætta við' : 'Go back'}
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {locale === 'is' ? 'Afturkalla...' : 'Cancelling...'}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    {locale === 'is' ? 'Afturkalla' : 'Cancel booking'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
