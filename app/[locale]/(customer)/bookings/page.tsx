'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
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
  label: { is: string; en: string };
  description: { is: string; en: string };
}> = {
  PENDING: { 
    icon: Clock, 
    color: 'text-amber-600', 
    bg: 'bg-amber-50 border-amber-200',
    label: { is: 'Í bið', en: 'Pending' },
    description: { is: 'Bíður staðfestingar', en: 'Awaiting confirmation' }
  },
  CONFIRMED: { 
    icon: CheckCircle2, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50 border-blue-200',
    label: { is: 'Staðfest', en: 'Confirmed' },
    description: { is: 'Bókun staðfest', en: 'Booking confirmed' }
  },
  CHECKED_IN: { 
    icon: CarFront, 
    color: 'text-violet-600', 
    bg: 'bg-violet-50 border-violet-200',
    label: { is: 'Bíll í geymslu', en: 'Car Parked' },
    description: { is: 'Bíllinn er í geymslu', en: 'Your car is parked' }
  },
  IN_PROGRESS: { 
    icon: Sparkles, 
    color: 'text-cyan-600', 
    bg: 'bg-cyan-50 border-cyan-200',
    label: { is: 'Í vinnslu', en: 'In Progress' },
    description: { is: 'Þjónusta í vinnslu', en: 'Services in progress' }
  },
  READY: { 
    icon: CheckCircle2, 
    color: 'text-green-600', 
    bg: 'bg-green-50 border-green-200',
    label: { is: 'Tilbúið', en: 'Ready' },
    description: { is: 'Bíllinn er tilbúinn', en: 'Car is ready' }
  },
  CHECKED_OUT: { 
    icon: CheckCircle2, 
    color: 'text-slate-600', 
    bg: 'bg-slate-100 border-slate-200',
    label: { is: 'Lokið', en: 'Completed' },
    description: { is: 'Bókun lokið', en: 'Booking completed' }
  },
  CANCELLED: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200',
    label: { is: 'Afturkölluð', en: 'Cancelled' },
    description: { is: 'Bókun afturkölluð', en: 'Booking cancelled' }
  },
  NO_SHOW: { 
    icon: AlertCircle, 
    color: 'text-orange-600', 
    bg: 'bg-orange-50 border-orange-200',
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

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-slate-600">
            {locale === 'is' ? 'Hleð bókunum...' : 'Loading bookings...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {locale === 'is' ? 'Mínar bókanir' : 'My Bookings'}
              </h1>
              <p className="mt-1 text-slate-600">
                {locale === 'is' 
                  ? `${bookings.length} bókanir samtals`
                  : `${bookings.length} bookings total`}
              </p>
            </div>
            <Link
              href={`/${locale}/booking`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-500 transition-all hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              {locale === 'is' ? 'Ný bókun' : 'New Booking'}
            </Link>
          </div>

          {/* Filters & Search */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'is' ? 'Leita að bókun...' : 'Search bookings...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'all', label: { is: 'Allar', en: 'All' } },
                { id: 'active', label: { is: 'Virkar', en: 'Active' } },
                { id: 'completed', label: { is: 'Lokið', en: 'Completed' } },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as FilterType)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    filter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {tab.label[locale === 'is' ? 'is' : 'en']}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {filteredBookings.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-slate-200 text-center py-16">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
              <Car className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-slate-900">
              {searchQuery 
                ? (locale === 'is' ? 'Engar bókanir fundust' : 'No bookings found')
                : (locale === 'is' ? 'Engar bókanir' : 'No bookings yet')}
            </h3>
            <p className="mt-2 text-slate-600 max-w-sm mx-auto">
              {searchQuery
                ? (locale === 'is' ? 'Reyndu að breyta leitarskilyrðum' : 'Try adjusting your search')
                : (locale === 'is' 
                    ? 'Þú hefur engar bókanir ennþá. Bókaðu bílastæði í dag!'
                    : "You haven't made any bookings yet. Book a parking spot today!")}
            </p>
            {!searchQuery && (
              <Link 
                href={`/${locale}/booking`} 
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 transition-all"
              >
                <Plus className="h-4 w-4" />
                {locale === 'is' ? 'Bóka núna' : 'Book now'}
              </Link>
            )}
          </div>
        )}

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && filter !== 'completed' && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              {locale === 'is' ? 'Komandi bókanir' : 'Upcoming Bookings'}
            </h2>
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} locale={locale} formatDate={formatDate} formatTime={formatTime} />
              ))}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && filter !== 'active' && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              {locale === 'is' ? 'Fyrri bókanir' : 'Past Bookings'}
            </h2>
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} locale={locale} formatDate={formatDate} formatTime={formatTime} isPast />
              ))}
            </div>
          </div>
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
  isPast = false 
}: { 
  booking: Booking; 
  locale: string; 
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
  isPast?: boolean;
}) {
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <Link
      href={`/${locale}/bookings/${booking.id}`}
      className={cn(
        'group block bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:shadow-lg hover:border-slate-300',
        isPast && 'opacity-75 hover:opacity-100'
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* License Plate */}
          <div className="flex-shrink-0">
            <div className="h-14 px-4 rounded-xl bg-slate-900 flex items-center justify-center">
              <span className="font-mono font-bold text-white text-lg tracking-wider">
                {booking.vehicle.licensePlate}
              </span>
            </div>
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
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
                    statusConfig.bg,
                    statusConfig.color
                  )}>
                    <StatusIcon className="h-3.5 w-3.5" />
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
