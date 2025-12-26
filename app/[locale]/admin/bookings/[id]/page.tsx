'use client';

import { useState, useEffect, use } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  Edit2,
  Trash2,
  Car,
  Clock,
  CreditCard,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  X,
  ExternalLink,
  PlaneTakeoff,
  PlaneLanding,
  Package,
  FileText,
  RefreshCw,
  Loader2,
  DollarSign,
  Hash,
} from 'lucide-react';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import AdminShell from '@/components/admin/AdminShell';

interface Booking {
  id: string;
  reference: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  vehicle: {
    id: string;
    licensePlate: string;
    make: string | null;
    model: string | null;
    color: string | null;
    vehicleType: {
      name: string;
      nameEn: string;
      code: string;
    } | null;
  };
  lot: {
    id: string;
    name: string;
    nameEn: string;
  } | null;
  dropOffTime: string;
  pickUpTime: string;
  actualDropOff: string | null;
  actualPickUp: string | null;
  departureFlightNumber: string | null;
  arrivalFlightNumber: string | null;
  spotNumber: string | null;
  totalDays: number;
  basePrice: number;
  addonsTotal: number;
  totalPrice: number;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  addons: {
    id: string;
    price: number;
    service: {
      name: string;
      nameEn: string;
    };
  }[];
  payment: {
    id: string;
    status: string;
    method: string | null;
    paidAt: string | null;
    amount: number;
  } | null;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; labelIs: string; labelEn: string }> = {
  PENDING: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock, labelIs: 'Í bið', labelEn: 'Pending' },
  CONFIRMED: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2, labelIs: 'Staðfest', labelEn: 'Confirmed' },
  CHECKED_IN: { color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', icon: PlaneTakeoff, labelIs: 'Innritað', labelEn: 'Checked In' },
  IN_PROGRESS: { color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200', icon: Car, labelIs: 'Í vinnslu', labelEn: 'In Progress' },
  READY: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle2, labelIs: 'Tilbúið', labelEn: 'Ready' },
  CHECKED_OUT: { color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', icon: PlaneLanding, labelIs: 'Útritað', labelEn: 'Checked Out' },
  CANCELLED: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: X, labelIs: 'Afbókað', labelEn: 'Cancelled' },
  NO_SHOW: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: AlertCircle, labelIs: 'Mætti ekki', labelEn: 'No Show' },
};

const PAYMENT_STATUS: Record<string, { color: string; labelIs: string; labelEn: string }> = {
  PENDING: { color: 'text-amber-600 bg-amber-50', labelIs: 'Ógreitt', labelEn: 'Pending' },
  PAID: { color: 'text-green-600 bg-green-50', labelIs: 'Greitt', labelEn: 'Paid' },
  FAILED: { color: 'text-red-600 bg-red-50', labelIs: 'Mistókst', labelEn: 'Failed' },
  REFUNDED: { color: 'text-slate-600 bg-slate-50', labelIs: 'Endurgreitt', labelEn: 'Refunded' },
};

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    spotNumber: '',
    internalNotes: '',
  });

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${id}`);
      const data = await response.json();
      if (data.success) {
        setBooking(data.data);
        setEditData({
          status: data.data.status,
          spotNumber: data.data.spotNumber || '',
          internalNotes: data.data.internalNotes || '',
        });
      } else {
        setError(data.error || 'Failed to fetch booking');
      }
    } catch (err) {
      setError('Failed to fetch booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!booking) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const data = await response.json();
      if (data.success) {
        setBooking({ ...booking, ...data.data });
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to save booking:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!booking || !confirm(locale === 'is' ? 'Ertu viss um að þú viljir afturkalla þessa bókun?' : 'Are you sure you want to cancel this booking?')) return;
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/${locale}/admin/bookings`);
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  if (isLoading) {
    return (
      <AdminShell title={locale === 'is' ? 'Hleður...' : 'Loading...'}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </AdminShell>
    );
  }

  if (error || !booking) {
    return (
      <AdminShell title={locale === 'is' ? 'Villa' : 'Error'}>
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {locale === 'is' ? 'Bókun fannst ekki' : 'Booking not found'}
          </h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/${locale}/admin/bookings`)}
            className="btn-primary"
          >
            {locale === 'is' ? 'Til baka í bókanir' : 'Back to bookings'}
          </button>
        </div>
      </AdminShell>
    );
  }

  const StatusIcon = STATUS_CONFIG[booking.status]?.icon || Clock;

  return (
    <AdminShell title={booking.reference}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/${locale}/admin/bookings`)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-mono">{booking.reference}</h1>
              <p className="text-sm text-slate-500">
                {locale === 'is' ? 'Stofnað' : 'Created'} {formatDate(booking.createdAt, locale)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBooking}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{locale === 'is' ? 'Endurhlaða' : 'Refresh'}</span>
            </button>
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  {locale === 'is' ? 'Hætta við' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {locale === 'is' ? 'Vista' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{locale === 'is' ? 'Breyta' : 'Edit'}</span>
                </button>
                {booking.status !== 'CANCELLED' && (
                  <button
                    onClick={handleCancel}
                    className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{locale === 'is' ? 'Afturkalla' : 'Cancel'}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg border', STATUS_CONFIG[booking.status]?.bg)}>
                <StatusIcon className={cn('h-5 w-5', STATUS_CONFIG[booking.status]?.color)} />
              </div>
              <div>
                <p className={cn('font-semibold', STATUS_CONFIG[booking.status]?.color)}>
                  {STATUS_CONFIG[booking.status]?.[locale === 'is' ? 'labelIs' : 'labelEn']}
                </p>
                <p className="text-xs text-slate-500">{locale === 'is' ? 'Staða' : 'Status'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{booking.totalDays}</p>
                <p className="text-xs text-slate-500">{booking.totalDays === 1 ? (locale === 'is' ? 'Dagur' : 'Day') : (locale === 'is' ? 'Dagar' : 'Days')}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{formatPrice(booking.totalPrice, locale)}</p>
                <p className="text-xs text-slate-500">{locale === 'is' ? 'Samtals' : 'Total'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', booking.payment?.status === 'PAID' ? 'bg-green-100' : 'bg-amber-100')}>
                <CreditCard className={cn('h-5 w-5', booking.payment?.status === 'PAID' ? 'text-green-600' : 'text-amber-600')} />
              </div>
              <div>
                <p className={cn('font-semibold', booking.payment?.status === 'PAID' ? 'text-green-600' : 'text-amber-600')}>
                  {PAYMENT_STATUS[booking.payment?.status || 'PENDING']?.[locale === 'is' ? 'labelIs' : 'labelEn']}
                </p>
                <p className="text-xs text-slate-500">{locale === 'is' ? 'Greiðsla' : 'Payment'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {locale === 'is' ? 'Viðskiptavinur' : 'Customer'}
                </h2>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="font-semibold text-lg text-slate-900">
                      {booking.user.name || (locale === 'is' ? 'Ekkert nafn' : 'No name')}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <a href={`mailto:${booking.user.email}`} className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                        <Mail className="h-4 w-4" />
                        {booking.user.email}
                      </a>
                      {booking.user.phone && (
                        <a href={`tel:${booking.user.phone}`} className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                          <Phone className="h-4 w-4" />
                          {booking.user.phone}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => router.push(`/${locale}/admin/users/${booking.user.id}`)}
                      className="text-sm text-slate-500 hover:text-primary-600 flex items-center gap-1 mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {locale === 'is' ? 'Skoða notanda' : 'View user profile'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  {locale === 'is' ? 'Ökutæki' : 'Vehicle'}
                </h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                    <Car className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-2xl text-slate-900">{booking.vehicle.licensePlate}</p>
                    {(booking.vehicle.make || booking.vehicle.model) && (
                      <p className="text-slate-500">
                        {[booking.vehicle.make, booking.vehicle.model].filter(Boolean).join(' ')}
                        {booking.vehicle.color && ` • ${booking.vehicle.color}`}
                      </p>
                    )}
                    {booking.vehicle.vehicleType && (
                      <p className="text-xs text-slate-400 mt-1">
                        {locale === 'is' ? booking.vehicle.vehicleType.name : booking.vehicle.vehicleType.nameEn}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Parking Details */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {locale === 'is' ? 'Bílastæði' : 'Parking Details'}
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {booking.lot && (
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">
                        {locale === 'is' ? booking.lot.name : booking.lot.nameEn}
                      </p>
                      {booking.spotNumber && (
                        <p className="text-sm text-slate-500">
                          {locale === 'is' ? 'Stæði' : 'Spot'} #{booking.spotNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <PlaneTakeoff className="h-4 w-4" />
                      <span className="text-sm font-medium">{locale === 'is' ? 'Koma' : 'Drop-off'}</span>
                    </div>
                    <p className="font-semibold text-lg">
                      {new Date(booking.dropOffTime).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { 
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                    <p className="text-slate-600">
                      {new Date(booking.dropOffTime).toLocaleTimeString(locale === 'is' ? 'is-IS' : 'en-GB', { 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                    {booking.departureFlightNumber && (
                      <p className="text-sm text-green-700 font-medium mt-2">
                        ✈ {booking.departureFlightNumber}
                      </p>
                    )}
                    {booking.actualDropOff && (
                      <p className="text-xs text-slate-500 mt-2">
                        {locale === 'is' ? 'Raunveruleg koma:' : 'Actual:'} {formatDate(booking.actualDropOff, locale)}
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <PlaneLanding className="h-4 w-4" />
                      <span className="text-sm font-medium">{locale === 'is' ? 'Sækja' : 'Pick-up'}</span>
                    </div>
                    <p className="font-semibold text-lg">
                      {new Date(booking.pickUpTime).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { 
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                    <p className="text-slate-600">
                      {new Date(booking.pickUpTime).toLocaleTimeString(locale === 'is' ? 'is-IS' : 'en-GB', { 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                    {booking.arrivalFlightNumber && (
                      <p className="text-sm text-blue-700 font-medium mt-2">
                        ✈ {booking.arrivalFlightNumber}
                      </p>
                    )}
                    {booking.actualPickUp && (
                      <p className="text-xs text-slate-500 mt-2">
                        {locale === 'is' ? 'Raunveruleg sótt:' : 'Actual:'} {formatDate(booking.actualPickUp, locale)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Add-ons */}
            {booking.addons && booking.addons.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {locale === 'is' ? 'Aukaþjónusta' : 'Add-ons'}
                  </h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {booking.addons.map((addon) => (
                    <div key={addon.id} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-slate-700">
                        {locale === 'is' ? addon.service.name : addon.service.nameEn}
                      </span>
                      <span className="font-medium">{formatPrice(addon.price, locale)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Edit Status */}
            {isEditing && (
              <div className="card p-5 space-y-4 border-primary-200 bg-primary-50/30">
                <h3 className="font-semibold text-slate-900">{locale === 'is' ? 'Breyta bókun' : 'Edit Booking'}</h3>
                
                <div>
                  <label className="label">{locale === 'is' ? 'Staða' : 'Status'}</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="input w-full"
                  >
                    {Object.keys(STATUS_CONFIG).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_CONFIG[status][locale === 'is' ? 'labelIs' : 'labelEn']}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">{locale === 'is' ? 'Stæðisnúmer' : 'Spot Number'}</label>
                  <input
                    type="text"
                    value={editData.spotNumber}
                    onChange={(e) => setEditData({ ...editData, spotNumber: e.target.value })}
                    className="input w-full"
                    placeholder="A-123"
                  />
                </div>

                <div>
                  <label className="label">{locale === 'is' ? 'Innri athugasemdir' : 'Internal Notes'}</label>
                  <textarea
                    value={editData.internalNotes}
                    onChange={(e) => setEditData({ ...editData, internalNotes: e.target.value })}
                    className="input w-full"
                    rows={3}
                    placeholder={locale === 'is' ? 'Athugasemdir fyrir starfsfólk...' : 'Notes for staff...'}
                  />
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {locale === 'is' ? 'Verðsamantekt' : 'Price Summary'}
                </h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{locale === 'is' ? 'Bílastæði' : 'Parking'} ({booking.totalDays} {booking.totalDays === 1 ? (locale === 'is' ? 'dagur' : 'day') : (locale === 'is' ? 'dagar' : 'days')})</span>
                  <span>{formatPrice(booking.basePrice || (booking.totalPrice - booking.addonsTotal), locale)}</span>
                </div>
                {booking.addonsTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{locale === 'is' ? 'Aukaþjónusta' : 'Add-ons'}</span>
                    <span>{formatPrice(booking.addonsTotal, locale)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 flex justify-between">
                  <span className="font-semibold">{locale === 'is' ? 'Samtals' : 'Total'}</span>
                  <span className="font-bold text-lg text-primary-600">{formatPrice(booking.totalPrice, locale)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {booking.payment && (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {locale === 'is' ? 'Greiðsluupplýsingar' : 'Payment Info'}
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{locale === 'is' ? 'Staða' : 'Status'}</span>
                    <span className={cn('px-2 py-1 rounded text-xs font-medium', PAYMENT_STATUS[booking.payment.status]?.color)}>
                      {PAYMENT_STATUS[booking.payment.status]?.[locale === 'is' ? 'labelIs' : 'labelEn']}
                    </span>
                  </div>
                  {booking.payment.method && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{locale === 'is' ? 'Greiðslumáti' : 'Method'}</span>
                      <span>{booking.payment.method}</span>
                    </div>
                  )}
                  {booking.payment.paidAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{locale === 'is' ? 'Greitt' : 'Paid'}</span>
                      <span>{formatDate(booking.payment.paidAt, locale)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Internal Notes */}
            {booking.internalNotes && !isEditing && (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-amber-50">
                  <h2 className="font-semibold text-amber-800 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {locale === 'is' ? 'Innri athugasemdir' : 'Internal Notes'}
                  </h2>
                </div>
                <div className="p-5 bg-amber-50/50">
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{booking.internalNotes}</p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="card p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {locale === 'is' ? 'Lýsigögn' : 'Metadata'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{locale === 'is' ? 'Bókunarnúmer' : 'Booking ID'}</span>
                  <span className="font-mono text-xs text-slate-600">{booking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{locale === 'is' ? 'Stofnað' : 'Created'}</span>
                  <span>{formatDate(booking.createdAt, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{locale === 'is' ? 'Uppfært' : 'Updated'}</span>
                  <span>{formatDate(booking.updatedAt, locale)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
