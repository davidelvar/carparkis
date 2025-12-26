'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Search,
  Download,
  Eye,
  Calendar,
  Car,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  PlaneTakeoff,
  PlaneLanding,
  ArrowUpDown,
  Loader2,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Tag,
  Package,
} from 'lucide-react';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import AdminShell from '@/components/admin/AdminShell';

interface Booking {
  id: string;
  reference: string;
  status: string;
  user: { id: string; name: string | null; email: string; phone?: string | null };
  vehicle: { licensePlate: string; make?: string; model?: string; vehicleType?: { name: string; nameEn: string } };
  lot?: { id: string; name: string; nameEn: string };
  dropOffTime: string;
  pickUpTime: string;
  departureFlightNumber?: string;
  arrivalFlightNumber?: string;
  totalDays: number;
  basePrice: number;
  totalPrice: number;
  addonsTotal: number;
  createdAt: string;
  updatedAt: string;
  addons?: { service: { name: string; nameEn: string }; price: number }[];
  notes?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  PENDING: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  CONFIRMED: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
  CHECKED_IN: { color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', icon: PlaneTakeoff },
  IN_PROGRESS: { color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200', icon: Car },
  READY: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },
  CHECKED_OUT: { color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', icon: PlaneLanding },
  CANCELLED: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: X },
  NO_SHOW: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: AlertCircle },
};

const STATUS_LABELS: Record<string, { is: string; en: string }> = {
  PENDING: { is: 'Í bið', en: 'Pending' },
  CONFIRMED: { is: 'Staðfest', en: 'Confirmed' },
  CHECKED_IN: { is: 'Innritað', en: 'Checked In' },
  IN_PROGRESS: { is: 'Í vinnslu', en: 'In Progress' },
  READY: { is: 'Tilbúið', en: 'Ready' },
  CHECKED_OUT: { is: 'Útritað', en: 'Checked Out' },
  CANCELLED: { is: 'Afbókað', en: 'Cancelled' },
  NO_SHOW: { is: 'Mætti ekki', en: 'No Show' },
};

type SortField = 'createdAt' | 'dropOffTime' | 'pickUpTime' | 'totalPrice' | 'reference';
type SortOrder = 'asc' | 'desc';

export default function AdminBookingsPage() {
  const locale = useLocale();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Date filter logic
  const getDateFilterRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        return { start: today, end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) };
      case 'month':
        return { start: today, end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) };
      default:
        return null;
    }
  };

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter((booking) => {
      const matchesSearch =
        booking.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.departureFlightNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.arrivalFlightNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

      const dateRange = getDateFilterRange();
      let matchesDate = true;
      if (dateRange) {
        const dropOff = new Date(booking.dropOffTime);
        matchesDate = dropOff >= dateRange.start && dropOff < dateRange.end;
      }

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'dropOffTime':
          aVal = new Date(a.dropOffTime).getTime();
          bVal = new Date(b.dropOffTime).getTime();
          break;
        case 'pickUpTime':
          aVal = new Date(a.pickUpTime).getTime();
          bVal = new Date(b.pickUpTime).getTime();
          break;
        case 'totalPrice':
          aVal = a.totalPrice;
          bVal = b.totalPrice;
          break;
        case 'reference':
          aVal = a.reference;
          bVal = b.reference;
          break;
        default:
          return 0;
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    today: bookings.filter(b => {
      const today = new Date();
      const dropOff = new Date(b.dropOffTime);
      return dropOff.toDateString() === today.toDateString();
    }).length,
    revenue: bookings
      .filter(b => ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY', 'CHECKED_OUT'].includes(b.status))
      .reduce((sum, b) => sum + b.totalPrice, 0),
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const statuses = Object.keys(STATUS_CONFIG);

  return (
    <AdminShell title={locale === 'is' ? 'Bókanir' : 'Bookings'}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Heildar' : 'Total'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Í bið' : 'Pending'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <PlaneTakeoff className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Í dag' : 'Today'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{formatPrice(stats.revenue, locale)}</p>
                <p className="text-sm text-slate-500">{locale === 'is' ? 'Tekjur' : 'Revenue'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={locale === 'is' ? 'Leita að bókun, bílnúmeri, viðskiptavini...' : 'Search booking, license plate, customer...'}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="input w-full sm:w-auto sm:min-w-[160px]"
          >
            <option value="all">{locale === 'is' ? 'Allar stöður' : 'All Status'}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status][locale === 'is' ? 'is' : 'en']}
              </option>
            ))}
          </select>
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value as any); setCurrentPage(1); }}
            className="input w-full sm:w-auto sm:min-w-[160px]"
          >
            <option value="all">{locale === 'is' ? 'Allar dagsetningar' : 'All Dates'}</option>
            <option value="today">{locale === 'is' ? 'Í dag' : 'Today'}</option>
            <option value="week">{locale === 'is' ? 'Næstu 7 dagar' : 'Next 7 days'}</option>
            <option value="month">{locale === 'is' ? 'Næstu 30 dagar' : 'Next 30 days'}</option>
          </select>
          <button
            onClick={fetchBookings}
            className="btn-secondary flex items-center justify-center gap-2 shrink-0"
            title={locale === 'is' ? 'Endurhlaða' : 'Refresh'}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2 shrink-0">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{locale === 'is' ? 'Flytja út' : 'Export'}</span>
          </button>
        </div>

        {/* Active Filters */}
        {(statusFilter !== 'all' || dateFilter !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">{locale === 'is' ? 'Síur:' : 'Filters:'}</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-sm">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-red-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-sm">
                {STATUS_LABELS[statusFilter][locale === 'is' ? 'is' : 'en']}
                <button onClick={() => setStatusFilter('all')} className="hover:text-red-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {dateFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-sm">
                {dateFilter === 'today' ? (locale === 'is' ? 'Í dag' : 'Today') :
                 dateFilter === 'week' ? (locale === 'is' ? 'Næstu 7 dagar' : 'Next 7 days') :
                 (locale === 'is' ? 'Næstu 30 dagar' : 'Next 30 days')}
                <button onClick={() => setDateFilter('all')} className="hover:text-red-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {locale === 'is' ? 'Hreinsa allt' : 'Clear all'}
            </button>
          </div>
        )}

        {/* Bookings Table */}
        <div className="card p-0 overflow-hidden -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
              <p className="text-slate-500">{locale === 'is' ? 'Hleður bókunum...' : 'Loading bookings...'}</p>
            </div>
          ) : paginatedBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium">{locale === 'is' ? 'Engar bókanir fundust' : 'No bookings found'}</p>
              <p className="text-sm text-slate-400 mt-1">{locale === 'is' ? 'Prófaðu að breyta leitarskilyrðum' : 'Try adjusting your filters'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 sm:px-5 py-3">
                      <button
                        onClick={() => handleSort('reference')}
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        {locale === 'is' ? 'Bókun' : 'Booking'}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="hidden md:table-cell text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Viðskiptavinur' : 'Customer'}
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Bíll' : 'Vehicle'}
                    </th>
                    <th className="hidden sm:table-cell text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      <button
                        onClick={() => handleSort('dropOffTime')}
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        {locale === 'is' ? 'Tímabil' : 'Period'}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      {locale === 'is' ? 'Staða' : 'Status'}
                    </th>
                    <th className="hidden sm:table-cell text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      <button
                        onClick={() => handleSort('totalPrice')}
                        className="flex items-center gap-1 ml-auto hover:text-slate-900"
                      >
                        {locale === 'is' ? 'Verð' : 'Price'}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 sm:px-5 py-3">
                      {locale === 'is' ? 'Aðgerð' : 'Action'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBookings.map((booking) => {
                    const StatusIcon = STATUS_CONFIG[booking.status]?.icon || Clock;
                    return (
                      <tr
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 sm:px-5 py-4">
                          <div className="font-mono font-semibold text-primary-600">
                            {booking.reference}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {formatDate(booking.createdAt, locale)}
                          </div>
                          {/* Mobile: Show customer info here */}
                          <div className="md:hidden mt-1 text-sm text-slate-600">
                            {booking.user.name || booking.user.email.split('@')[0]}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {booking.user.name || booking.user.email.split('@')[0]}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {booking.user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                              <Car className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-mono font-semibold text-slate-900">
                                {booking.vehicle.licensePlate}
                              </p>
                              {(booking.vehicle.make || booking.vehicle.model) && (
                                <p className="text-xs text-slate-400">
                                  {[booking.vehicle.make, booking.vehicle.model].filter(Boolean).join(' ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <PlaneTakeoff className="h-3.5 w-3.5 text-green-500" />
                              <span>{new Date(booking.dropOffTime).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'short' })}</span>
                              {booking.departureFlightNumber && (
                                <span className="text-xs text-slate-400">{booking.departureFlightNumber}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <PlaneLanding className="h-3.5 w-3.5 text-blue-500" />
                              <span>{new Date(booking.pickUpTime).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'short' })}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {booking.totalDays} {booking.totalDays === 1 ? (locale === 'is' ? 'dagur' : 'day') : (locale === 'is' ? 'dagar' : 'days')}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
                            STATUS_CONFIG[booking.status]?.bg,
                            STATUS_CONFIG[booking.status]?.color
                          )}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{STATUS_LABELS[booking.status]?.[locale === 'is' ? 'is' : 'en']}</span>
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4 text-right">
                          <p className="font-semibold text-slate-900">
                            {formatPrice(booking.totalPrice, locale)}
                          </p>
                          {booking.addonsTotal > 0 && (
                            <p className="text-xs text-slate-400">
                              +{formatPrice(booking.addonsTotal, locale)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 sm:px-5 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/${locale}/admin/bookings/${booking.id}`);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title={locale === 'is' ? 'Skoða' : 'View'}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50">
              <div className="text-sm text-slate-600">
                {locale === 'is'
                  ? `Sýni ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredBookings.length)} af ${filteredBookings.length}`
                  : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredBookings.length)} of ${filteredBookings.length}`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Panel */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 font-mono">{selectedBooking.reference}</h2>
                <p className="text-sm text-slate-500">{formatDate(selectedBooking.createdAt, locale)}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              {(() => {
                const StatusIcon = STATUS_CONFIG[selectedBooking.status]?.icon || Clock;
                return (
                  <div className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border',
                    STATUS_CONFIG[selectedBooking.status]?.bg,
                    STATUS_CONFIG[selectedBooking.status]?.color
                  )}>
                    <StatusIcon className="h-4 w-4" />
                    {STATUS_LABELS[selectedBooking.status]?.[locale === 'is' ? 'is' : 'en']}
                  </div>
                );
              })()}

              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {locale === 'is' ? 'Viðskiptavinur' : 'Customer'}
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {selectedBooking.user.name || (locale === 'is' ? 'Ekkert nafn' : 'No name')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${selectedBooking.user.email}`} className="text-primary-600 hover:underline">
                      {selectedBooking.user.email}
                    </a>
                  </div>
                  {selectedBooking.user.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <a href={`tel:${selectedBooking.user.phone}`} className="text-primary-600 hover:underline">
                        {selectedBooking.user.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {locale === 'is' ? 'Ökutæki' : 'Vehicle'}
                </h3>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
                      <Car className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-lg text-slate-900">
                        {selectedBooking.vehicle.licensePlate}
                      </p>
                      {(selectedBooking.vehicle.make || selectedBooking.vehicle.model) && (
                        <p className="text-sm text-slate-500">
                          {[selectedBooking.vehicle.make, selectedBooking.vehicle.model].filter(Boolean).join(' ')}
                        </p>
                      )}
                      {selectedBooking.vehicle.vehicleType && (
                        <p className="text-xs text-slate-400 mt-1">
                          {locale === 'is' ? selectedBooking.vehicle.vehicleType.name : selectedBooking.vehicle.vehicleType.nameEn}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parking Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {locale === 'is' ? 'Bílastæði' : 'Parking Details'}
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                  {selectedBooking.lot && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">
                        {locale === 'is' ? selectedBooking.lot.name : selectedBooking.lot.nameEn}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <PlaneTakeoff className="h-3.5 w-3.5 text-green-500" />
                        {locale === 'is' ? 'Koma' : 'Drop-off'}
                      </div>
                      <p className="font-semibold">
                        {new Date(selectedBooking.dropOffTime).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { 
                          weekday: 'short', day: 'numeric', month: 'short' 
                        })}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(selectedBooking.dropOffTime).toLocaleTimeString(locale === 'is' ? 'is-IS' : 'en-GB', { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                      {selectedBooking.departureFlightNumber && (
                        <p className="text-xs text-primary-600 font-medium mt-1">
                          ✈ {selectedBooking.departureFlightNumber}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <PlaneLanding className="h-3.5 w-3.5 text-blue-500" />
                        {locale === 'is' ? 'Sækja' : 'Pick-up'}
                      </div>
                      <p className="font-semibold">
                        {new Date(selectedBooking.pickUpTime).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { 
                          weekday: 'short', day: 'numeric', month: 'short' 
                        })}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(selectedBooking.pickUpTime).toLocaleTimeString(locale === 'is' ? 'is-IS' : 'en-GB', { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                      {selectedBooking.arrivalFlightNumber && (
                        <p className="text-xs text-primary-600 font-medium mt-1">
                          ✈ {selectedBooking.arrivalFlightNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">{selectedBooking.totalDays}</span>{' '}
                      {selectedBooking.totalDays === 1 ? (locale === 'is' ? 'dagur' : 'day') : (locale === 'is' ? 'dagar' : 'days')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {locale === 'is' ? 'Aukaþjónusta' : 'Add-ons'}
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    {selectedBooking.addons.map((addon, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400" />
                          <span>{locale === 'is' ? addon.service.name : addon.service.nameEn}</span>
                        </div>
                        <span className="font-medium">{formatPrice(addon.price, locale)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Summary */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {locale === 'is' ? 'Verð' : 'Pricing'}
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{locale === 'is' ? 'Bílastæði' : 'Parking'}</span>
                    <span className="font-medium">{formatPrice(selectedBooking.basePrice || (selectedBooking.totalPrice - selectedBooking.addonsTotal), locale)}</span>
                  </div>
                  {selectedBooking.addonsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{locale === 'is' ? 'Aukaþjónusta' : 'Add-ons'}</span>
                      <span className="font-medium">{formatPrice(selectedBooking.addonsTotal, locale)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200 flex justify-between">
                    <span className="font-semibold text-slate-900">{locale === 'is' ? 'Samtals' : 'Total'}</span>
                    <span className="font-bold text-lg text-primary-600">{formatPrice(selectedBooking.totalPrice, locale)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {locale === 'is' ? 'Athugasemdir' : 'Notes'}
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800">{selectedBooking.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => router.push(`/${locale}/admin/bookings/${selectedBooking.id}`)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {locale === 'is' ? 'Opna bókun' : 'View Full Details'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
