'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  MapPin,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PlaneTakeoff,
  PlaneLanding,
  Plus,
  Search,
  ArrowUpRight,
  Sparkles,
  CarFront,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';

interface Booking {
  id: string;
  reference: string;
  status: string;
  dropOffTime: string;
  pickUpTime: string;
  totalPrice: number;
  departureFlightNumber?: string;
  arrivalFlightNumber?: string;
  vehicle: {
    licensePlate: string;
    make?: string;
    model?: string;
    vehicleType: {
      name: string;
      nameEn?: string;
    };
  };
  lot: {
    name: string;
    nameEn?: string;
  };
  addons?: {
    id: string;
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
  badgeBg: string;
  label: { is: string; en: string };
  description: { is: string; en: string };
}> = {
  PENDING: { 
    icon: Clock, 
    color: 'text-amber-600', 
    bg: 'bg-amber-50 border-amber-200',
    badgeBg: 'bg-amber-500',
    label: { is: 'Í bið', en: 'Pending' },
    description: { is: 'Bíður staðfestingar', en: 'Awaiting confirmation' }
  },
  CONFIRMED: { 
    icon: CheckCircle2, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50 border-blue-200',
    badgeBg: 'bg-blue-500',
    label: { is: 'Staðfest', en: 'Confirmed' },
    description: { is: 'Bókun staðfest', en: 'Booking confirmed' }
  },
  CHECKED_IN: { 
    icon: CarFront, 
    color: 'text-violet-600', 
    bg: 'bg-violet-50 border-violet-200',
    badgeBg: 'bg-violet-500',
    label: { is: 'Bíll í geymslu', en: 'Car Parked' },
    description: { is: 'Bíllinn er í geymslu', en: 'Your car is parked' }
  },
  IN_PROGRESS: { 
    icon: Sparkles, 
    color: 'text-cyan-600', 
    bg: 'bg-cyan-50 border-cyan-200',
    badgeBg: 'bg-cyan-500',
    label: { is: 'Í vinnslu', en: 'In Progress' },
    description: { is: 'Þjónusta í vinnslu', en: 'Services in progress' }
  },
  READY: { 
    icon: CheckCircle2, 
    color: 'text-green-600', 
    bg: 'bg-green-50 border-green-200',
    badgeBg: 'bg-green-500',
    label: { is: 'Tilbúið', en: 'Ready' },
    description: { is: 'Bíllinn er tilbúinn', en: 'Car is ready' }
  },
  CHECKED_OUT: { 
    icon: CheckCircle2, 
    color: 'text-slate-600', 
    bg: 'bg-slate-100 border-slate-200',
    badgeBg: 'bg-slate-400',
    label: { is: 'Lokið', en: 'Completed' },
    description: { is: 'Bókun lokið', en: 'Booking completed' }
  },
  CANCELLED: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200',
    badgeBg: 'bg-red-500',
    label: { is: 'Afturkölluð', en: 'Cancelled' },
    description: { is: 'Bókun afturkölluð', en: 'Booking cancelled' }
  },
  NO_SHOW: { 
    icon: AlertCircle, 
    color: 'text-orange-600', 
    bg: 'bg-orange-50 border-orange-200',
    badgeBg: 'bg-orange-500',
    label: { is: 'Mætti ekki', en: 'No Show' },
    description: { is: 'Viðskiptavinur mætti ekki', en: 'Customer did not show' }
  },
};

type FilterType = 'all' | 'active' | 'completed';

export default function BookingsPage() {
  const locale = useLocale();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const response = await fetch('/api/bookings');
      const result = await response.json();
      
      if (result.success) {
        setBookings(result.data);
      } else {
        setError(locale === 'is' ? 'Villa við að sækja bókanir' : 'Failed to load bookings');
      }
    } catch (err) {
      setError(locale === 'is' ? 'Villa við að sækja bókanir' : 'Failed to load bookings');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    // Filter by status
    if (filter === 'active' && ['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(booking.status)) {
      return false;
    }
    if (filter === 'completed' && !['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(booking.status)) {
      return false;
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.reference.toLowerCase().includes(query) ||
        booking.vehicle.licensePlate.toLowerCase().includes(query) ||
        booking.vehicle.make?.toLowerCase().includes(query) ||
        booking.vehicle.model?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Split into upcoming and past
  const now = new Date();
  const upcomingBookings = filteredBookings.filter(b => 
    new Date(b.pickUpTime) >= now && !['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(b.status)
  ).sort((a, b) => new Date(a.dropOffTime).getTime() - new Date(b.dropOffTime).getTime());
  
  const pastBookings = filteredBookings.filter(b => 
    new Date(b.pickUpTime) < now || ['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(b.status)
  ).sort((a, b) => new Date(b.dropOffTime).getTime() - new Date(a.dropOffTime).getTime());

  // Stats
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => !['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(b.status)).length,
    upcoming: upcomingBookings.length,
    completed: bookings.filter(b => b.status === 'CHECKED_OUT').length,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(locale === 'is' ? 'is-IS' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate days until/since
  const getDaysText = (dropOffTime: string) => {
    const dropOff = new Date(dropOffTime);
    const diffTime = dropOff.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return locale === 'is' ? 'Í dag' : 'Today';
    if (diffDays === 1) return locale === 'is' ? 'Á morgun' : 'Tomorrow';
    if (diffDays > 1) return locale === 'is' ? `Eftir ${diffDays} daga` : `In ${diffDays} days`;
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
          <p className="mt-4 text-slate-600 font-medium">
            {locale === 'is' ? 'Hleð bókunum...' : 'Loading bookings...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {locale === 'is' ? 'Mínar bókanir' : 'My Bookings'}
              </h1>
              <p className="mt-1 text-slate-500">
                {locale === 'is' 
                  ? `${stats.active} virkar bókanir`
                  : `${stats.active} active bookings`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchBookings(true)}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                title={locale === 'is' ? 'Endurhlaða' : 'Refresh'}
              >
                <RefreshCw className={cn('h-5 w-5 text-slate-600', isRefreshing && 'animate-spin')} />
              </button>
              <Link
                href={`/${locale}/booking`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-500 transition-all hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                {locale === 'is' ? 'Ný bókun' : 'New Booking'}
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <Calendar className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{stats.total}</p>
                  <p className="text-xs text-slate-500">{locale === 'is' ? 'Samtals' : 'Total'}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-900">{stats.active}</p>
                  <p className="text-xs text-blue-700">{locale === 'is' ? 'Virkar' : 'Active'}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <PlaneTakeoff className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-green-900">{stats.upcoming}</p>
                  <p className="text-xs text-green-700">{locale === 'is' ? 'Framundan' : 'Upcoming'}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{stats.completed}</p>
                  <p className="text-xs text-slate-500">{locale === 'is' ? 'Lokið' : 'Completed'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'is' ? 'Leita (númer, bílnúmer...)' : 'Search (ref, license plate...)'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'all', label: { is: 'Allar', en: 'All' }, count: stats.total },
                { id: 'active', label: { is: 'Virkar', en: 'Active' }, count: stats.active },
                { id: 'completed', label: { is: 'Lokið', en: 'Past' }, count: stats.completed },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as FilterType)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    filter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {tab.label[locale === 'is' ? 'is' : 'en']}
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-md',
                    filter === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-600'
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm mb-6 flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {filteredBookings.length === 0 && !error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 text-center py-16"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shadow-inner"
            >
              <Car className="h-10 w-10 text-slate-400" />
            </motion.div>
            <h3 className="mt-6 text-xl font-semibold text-slate-900">
              {searchQuery 
                ? (locale === 'is' ? 'Engar bókanir fundust' : 'No bookings found')
                : (locale === 'is' ? 'Engar bókanir' : 'No bookings yet')}
            </h3>
            <p className="mt-2 text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? (locale === 'is' ? 'Reyndu að breyta leitarskilyrðum' : 'Try adjusting your search')
                : (locale === 'is' 
                    ? 'Þú hefur engar bókanir ennþá. Bókaðu bílastæði í dag!'
                    : "You haven't made any bookings yet. Book a parking spot today!")}
            </p>
            {!searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link 
                  href={`/${locale}/booking`} 
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  {locale === 'is' ? 'Bóka núna' : 'Book now'}
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && filter !== 'completed' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {locale === 'is' ? 'Komandi bókanir' : 'Upcoming Bookings'}
            </h2>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {upcomingBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BookingCard 
                      booking={booking} 
                      locale={locale} 
                      formatDate={formatDate} 
                      formatTime={formatTime}
                      daysText={getDaysText(booking.dropOffTime)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && filter !== 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {locale === 'is' ? 'Fyrri bókanir' : 'Past Bookings'}
            </h2>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {pastBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BookingCard 
                      booking={booking} 
                      locale={locale} 
                      formatDate={formatDate} 
                      formatTime={formatTime}
                      isPast 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ 
  booking, 
  locale, 
  formatDate, 
  formatTime,
  isPast = false,
  daysText
}: { 
  booking: Booking; 
  locale: string; 
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
  isPast?: boolean;
  daysText?: string;
}) {
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <Link
      href={`/${locale}/bookings/${booking.id}`}
      className={cn(
        'group block bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5',
        isPast && 'opacity-75 hover:opacity-100'
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* License Plate */}
          <div className="flex-shrink-0">
            <div className="h-14 px-4 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
              <span className="font-mono font-bold text-white text-lg tracking-wider">
                {booking.vehicle.licensePlate}
              </span>
            </div>
            {/* Days indicator badge */}
            {daysText && (
              <div className="mt-2 text-center">
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-md',
                  daysText.includes('Today') || daysText.includes('dag') 
                    ? 'bg-green-100 text-green-700' 
                    : daysText.includes('Tomorrow') || daysText.includes('á morgun')
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                )}>
                  {daysText}
                </span>
              </div>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                {/* Reference & Status */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono font-semibold text-primary-600">
                    {booking.reference}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white',
                    statusConfig.badgeBg
                  )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    {statusConfig.label[locale as 'is' | 'en']}
                  </span>
                </div>

                {/* Vehicle */}
                <p className="mt-1 text-sm text-slate-600">
                  {booking.vehicle.make} {booking.vehicle.model}
                </p>
              </div>

              {/* Price & Arrow */}
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-slate-900">
                  {formatPrice(booking.totalPrice, locale)}
                </p>
                <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-primary-500 transition-colors ml-auto mt-1" />
              </div>
            </div>

            {/* Dates & Details */}
            <div className="mt-4 flex items-center gap-6 flex-wrap text-sm">
              {/* Drop Off */}
              <div className="flex items-center gap-2 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <PlaneTakeoff className="h-4 w-4 text-green-500" />
                  <span className="font-medium">{formatDate(booking.dropOffTime)}</span>
                </div>
                <span className="text-slate-400">{formatTime(booking.dropOffTime)}</span>
              </div>

              <span className="text-slate-300">→</span>

              {/* Pick Up */}
              <div className="flex items-center gap-2 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <PlaneLanding className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{formatDate(booking.pickUpTime)}</span>
                </div>
                <span className="text-slate-400">{formatTime(booking.pickUpTime)}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="h-4 w-4" />
                <span>
                  {locale === 'is' ? booking.lot.name : (booking.lot.nameEn || booking.lot.name)}
                </span>
              </div>
            </div>

            {/* Addons indicator */}
            {booking.addons && booking.addons.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-slate-500">
                  {booking.addons.length} {locale === 'is' ? 'þjónustur' : 'services'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
