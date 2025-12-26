'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Car,
  MapPin,
  Loader2,
  Download,
  Mail,
  Copy,
  Check,
  Zap,
  PlaneTakeoff,
  PlaneLanding,
  Phone,
  CalendarDays,
  Clock,
  CreditCard,
  ArrowRight,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { formatPrice, calculateDays, cn } from '@/lib/utils';
import { useSiteSettings } from '@/lib/settings/context';
import type { BookingWithRelations } from '@/types';

export default function ConfirmationPage() {
  const t = useTranslations('booking');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const status = searchParams.get('status'); // 'success', 'failed', or null
  const { settings } = useSiteSettings();

  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);

  useEffect(() => {
    if (ref) {
      fetch(`/api/bookings?ref=${ref}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setBooking(data.data);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [ref]);

  const copyReference = () => {
    if (booking?.reference) {
      navigator.clipboard.writeText(booking.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const retryPayment = async () => {
    if (!booking) return;
    setRetryingPayment(true);
    
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, locale }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.redirectUrl) {
        window.location.href = result.data.redirectUrl;
      } else {
        alert(locale === 'is' ? 'Villa við greiðslu' : 'Payment error');
      }
    } catch (error) {
      console.error('Payment retry error:', error);
      alert(locale === 'is' ? 'Villa við greiðslu' : 'Payment error');
    } finally {
      setRetryingPayment(false);
    }
  };

  const formatFullDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'is' ? 'is-IS' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'is' ? 'is-IS' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-slate-600">
            {locale === 'is' ? 'Hleð bókun...' : 'Loading booking...'}
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <Car className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {locale === 'is' ? 'Bókun fannst ekki' : 'Booking not found'}
          </h2>
          <p className="text-slate-600 mb-6">
            {locale === 'is' 
              ? 'Við fundum ekki bókun með þessu tilvísunarnúmeri.' 
              : 'We couldn\'t find a booking with this reference.'}
          </p>
          <Link href={`/${locale}/booking`} className="btn-primary">
            {locale === 'is' ? 'Bóka nýja ferð' : 'Book a new trip'}
          </Link>
        </div>
      </div>
    );
  }

  const totalDays = calculateDays(booking.dropOffTime, booking.pickUpTime);
  
  // Determine if payment failed
  const paymentFailed = status === 'failed' || booking.status === 'PENDING';
  const paymentSuccess = booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Changes based on payment status */}
      {paymentFailed ? (
        // Payment Failed/Pending Hero
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white mb-6"
            >
              <CreditCard className="h-12 w-12 text-amber-600" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                {locale === 'is' ? 'Greiðsla ókláruð' : 'Payment Incomplete'}
              </h1>
              <p className="text-amber-100 text-lg mb-6">
                {locale === 'is' 
                  ? 'Bókunin þín er vistuð en greiðslan hefur ekki verið móttekin' 
                  : 'Your booking is saved but payment has not been received'}
              </p>
              
              {/* Reference Number */}
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 mb-6">
                <div className="text-left">
                  <p className="text-xs text-amber-200 uppercase tracking-wider">
                    {locale === 'is' ? 'Bókunarnúmer' : 'Booking Reference'}
                  </p>
                  <p className="text-2xl sm:text-3xl font-mono font-bold tracking-wider">
                    {booking.reference}
                  </p>
                </div>
                <button
                  onClick={copyReference}
                  className={cn(
                    'p-3 rounded-xl transition-all',
                    copied ? 'bg-white text-amber-600' : 'bg-white/20 hover:bg-white/30'
                  )}
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>

              {/* Retry Payment Button */}
              <button
                onClick={retryPayment}
                disabled={retryingPayment}
                className="inline-flex items-center gap-3 bg-white text-amber-600 hover:bg-amber-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {retryingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {locale === 'is' ? 'Augnablik...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    {locale === 'is' ? 'Ljúka greiðslu' : 'Complete Payment'}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      ) : (
        // Payment Success Hero
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white mb-6"
            >
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                {locale === 'is' ? 'Takk fyrir bókunina!' : 'Thank you for booking!'}
              </h1>
              <p className="text-green-100 text-lg mb-6">
                {locale === 'is' 
                  ? 'Staðfestingarpóstur hefur verið sendur á netfangið þitt' 
                  : 'A confirmation email has been sent to your email'}
              </p>
              
              {/* Reference Number */}
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
                <div className="text-left">
                  <p className="text-xs text-green-200 uppercase tracking-wider">
                    {locale === 'is' ? 'Bókunarnúmer' : 'Booking Reference'}
                  </p>
                  <p className="text-2xl sm:text-3xl font-mono font-bold tracking-wider">
                    {booking.reference}
                  </p>
                </div>
                <button
                  onClick={copyReference}
                  className={cn(
                    'p-3 rounded-xl transition-all',
                    copied ? 'bg-white text-green-600' : 'bg-white/20 hover:bg-white/30'
                  )}
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 -mt-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Vehicle Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
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
                    {booking.vehicle.licensePlate.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  {booking.vehicle.make} {booking.vehicle.model}
                </p>
                <p className="text-sm text-slate-500">
                  {booking.vehicle.year}
                  {booking.vehicle.color && ` · ${booking.vehicle.color}`}
                </p>
                {booking.vehicle.isElectric && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <Zap className="h-3 w-3" />
                    {locale === 'is' ? 'Rafbíll' : 'Electric'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              {/* Drop-off */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <PlaneTakeoff className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                      {locale === 'is' ? 'Brottför' : 'Drop-off'}
                    </p>
                    {booking.departureFlightNumber && (
                      <p className="text-sm text-slate-500 font-mono">{booking.departureFlightNumber}</p>
                    )}
                  </div>
                </div>
                <p className="text-lg font-semibold text-slate-900 capitalize">
                  {formatFullDate(booking.dropOffTime)}
                </p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {formatTime(booking.dropOffTime)}
                </p>
              </div>

              {/* Pick-up */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <PlaneLanding className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {locale === 'is' ? 'Koma' : 'Pick-up'}
                    </p>
                    {booking.arrivalFlightNumber && (
                      <p className="text-sm text-slate-500 font-mono">{booking.arrivalFlightNumber}</p>
                    )}
                  </div>
                </div>
                <p className="text-lg font-semibold text-slate-900 capitalize">
                  {formatFullDate(booking.pickUpTime)}
                </p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {formatTime(booking.pickUpTime)}
                </p>
              </div>
            </div>
            
            {/* Duration Banner */}
            <div className="bg-slate-50 px-6 py-3 flex items-center justify-center gap-2 text-slate-600">
              <CalendarDays className="h-4 w-4" />
              <span className="font-medium">
                {totalDays} {totalDays === 1 ? (locale === 'is' ? 'dagur' : 'day') : (locale === 'is' ? 'dagar' : 'days')} 
                {' '}{locale === 'is' ? 'bílastæði' : 'parking'}
              </span>
            </div>
          </div>

          {/* Location & Price Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Location */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {locale === 'is' ? 'Staðsetning' : 'Location'}
                  </p>
                  <p className="font-semibold text-slate-900">{booking.lot.name}</p>
                  {booking.lot.address && (
                    <p className="text-sm text-slate-500">{booking.lot.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Total Price */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-200 uppercase tracking-wider mb-1">
                    {locale === 'is' ? 'Samtals greitt' : 'Total Paid'}
                  </p>
                  <p className="text-3xl font-bold">{formatPrice(booking.totalPrice, locale)}</p>
                  <p className="text-xs text-primary-200">{locale === 'is' ? 'með VSK' : 'incl. VAT'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Add-ons */}
          {booking.addons.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {locale === 'is' ? 'Viðbótarþjónusta' : 'Add-on Services'}
              </p>
              <div className="flex flex-wrap gap-2">
                {booking.addons.map((addon) => (
                  <span
                    key={addon.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-medium"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {locale === 'is' ? addon.service.name : (addon.service.nameEn || addon.service.name)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {booking.lot.instructions && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 flex-shrink-0">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900 mb-2">
                    {locale === 'is' ? 'Leiðbeiningar' : 'Instructions'}
                  </p>
                  <p className="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed">
                    {locale === 'is'
                      ? booking.lot.instructions
                      : (booking.lot.instructionsEn || booking.lot.instructions)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid sm:grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
              <Download className="h-5 w-5" />
              {locale === 'is' ? 'Sækja staðfestingu' : 'Download Confirmation'}
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
              <Mail className="h-5 w-5" />
              {locale === 'is' ? 'Senda afrit' : 'Email Copy'}
            </button>
          </div>

          {/* Support */}
          <div className="bg-slate-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Phone className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {locale === 'is' ? 'Þarft aðstoð?' : 'Need help?'}
                </p>
                <p className="text-sm text-slate-500">
                  {locale === 'is' ? 'Við erum til taks allan sólarhringinn' : 'We\'re available 24/7'}
                </p>
              </div>
            </div>
            <a 
              href={`tel:${settings.contactPhone}`}
              className="btn-primary whitespace-nowrap"
            >
              <Phone className="h-4 w-4" />
              {settings.contactPhone}
            </a>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-4">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              {locale === 'is' ? 'Til baka á forsíðu' : 'Back to home'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
