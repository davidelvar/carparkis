'use client';

import { useState, useEffect, use } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  Users,
  User,
  Edit2,
  Trash2,
  Car,
  Clock,
  CreditCard,
  MapPin,
  Plane,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  X,
  ExternalLink,
  Hash,
} from 'lucide-react';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import AdminShell from '@/components/admin/AdminShell';
import { Switch } from '@/components/ui/Switch';

interface Vehicle {
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
}

interface Booking {
  id: string;
  reference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'COMPLETED' | 'CANCELLED';
  dropOffTime: string;
  pickUpTime: string;
  totalPrice: number;
  totalDays: number;
  vehicle: Vehicle;
  lot: {
    name: string;
  };
  departureFlightNumber: string | null;
  arrivalFlightNumber: string | null;
  createdAt: string;
}

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'CUSTOMER';
  phone: string | null;
  kennitala: string | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
  bookings: Booking[];
  vehicles: Vehicle[];
  _count: {
    bookings: number;
  };
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  OPERATOR: 'bg-blue-100 text-blue-800 border-blue-200',
  CUSTOMER: 'bg-slate-100 text-slate-700 border-slate-200',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  ADMIN: <Shield className="h-4 w-4" />,
  OPERATOR: <Users className="h-4 w-4" />,
  CUSTOMER: <User className="h-4 w-4" />,
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; labelIs: string; labelEn: string }> = {
  PENDING: { color: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3.5 w-3.5" />, labelIs: 'Í bið', labelEn: 'Pending' },
  CONFIRMED: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle2 className="h-3.5 w-3.5" />, labelIs: 'Staðfest', labelEn: 'Confirmed' },
  CHECKED_IN: { color: 'bg-indigo-100 text-indigo-800', icon: <MapPin className="h-3.5 w-3.5" />, labelIs: 'Innritað', labelEn: 'Checked In' },
  CHECKED_OUT: { color: 'bg-cyan-100 text-cyan-800', icon: <Car className="h-3.5 w-3.5" />, labelIs: 'Útritað', labelEn: 'Checked Out' },
  COMPLETED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3.5 w-3.5" />, labelIs: 'Lokið', labelEn: 'Completed' },
  CANCELLED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3.5 w-3.5" />, labelIs: 'Aflýst', labelEn: 'Cancelled' },
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'CUSTOMER' as 'ADMIN' | 'OPERATOR' | 'CUSTOMER',
    phone: '',
    kennitala: '',
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${id}?include=bookings,vehicles`);
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        setFormData({
          name: data.data.name || '',
          role: data.data.role,
          phone: data.data.phone || '',
          kennitala: data.data.kennitala || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        fetchUser();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(locale === 'is' ? 'Ertu viss um að þú viljir eyða þessum notanda?' : 'Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        router.push(`/${locale}/admin/users`);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Stats calculations
  const stats = user ? {
    totalBookings: user._count.bookings,
    completedBookings: user.bookings.filter(b => b.status === 'COMPLETED').length,
    activeBookings: user.bookings.filter(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).length,
    totalSpent: user.bookings.filter(b => b.status !== 'CANCELLED').reduce((sum, b) => sum + b.totalPrice, 0),
    vehicleCount: user.vehicles.length,
  } : null;

  if (isLoading) {
    return (
      <AdminShell title={locale === 'is' ? 'Notandi' : 'User'}>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell title={locale === 'is' ? 'Notandi' : 'User'}>
        <div className="text-center py-24">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">{locale === 'is' ? 'Notandi fannst ekki' : 'User not found'}</p>
          <button onClick={() => router.push(`/${locale}/admin/users`)} className="btn-primary mt-4">
            {locale === 'is' ? 'Til baka' : 'Go back'}
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={user.name || user.email}>
      <div className="space-y-6">
        {/* Back button and actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/${locale}/admin/users`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === 'is' ? 'Til baka í notendur' : 'Back to users'}
          </button>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2">
                  <Edit2 className="h-4 w-4" />
                  {locale === 'is' ? 'Breyta' : 'Edit'}
                </button>
                <button onClick={handleDelete} className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {locale === 'is' ? 'Eyða' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Profile Card */}
        <div className="card p-6">
          {isEditing ? (
            /* Edit Form */
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{locale === 'is' ? 'Breyta notanda' : 'Edit User'}</h2>
                  <p className="text-slate-500">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{locale === 'is' ? 'Nafn' : 'Name'}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder={locale === 'is' ? 'Fullt nafn' : 'Full name'}
                  />
                </div>
                <div>
                  <label className="label">{locale === 'is' ? 'Hlutverk' : 'Role'}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'OPERATOR' | 'CUSTOMER' })}
                    className="input"
                  >
                    <option value="CUSTOMER">{locale === 'is' ? 'Viðskiptavinur' : 'Customer'}</option>
                    <option value="OPERATOR">{locale === 'is' ? 'Rekstraraðili' : 'Operator'}</option>
                    <option value="ADMIN">{locale === 'is' ? 'Stjórnandi' : 'Admin'}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{locale === 'is' ? 'Sími' : 'Phone'}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+354 xxx xxxx"
                  />
                </div>
                <div>
                  <label className="label">{locale === 'is' ? 'Kennitala' : 'National ID'}</label>
                  <input
                    type="text"
                    value={formData.kennitala}
                    onChange={(e) => setFormData({ ...formData, kennitala: e.target.value })}
                    className="input"
                    placeholder="000000-0000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setIsEditing(false)} className="btn-secondary" disabled={isSaving}>
                  {locale === 'is' ? 'Hætta við' : 'Cancel'}
                </button>
                <button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={isSaving}>
                  {isSaving ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {locale === 'is' ? 'Vista' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar and basic info */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{user.name || '-'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
                      ROLE_COLORS[user.role]
                    )}>
                      {ROLE_ICONS[user.role]}
                      {user.role === 'ADMIN' ? (locale === 'is' ? 'Stjórnandi' : 'Admin')
                        : user.role === 'OPERATOR' ? (locale === 'is' ? 'Rekstraraðili' : 'Operator')
                        : (locale === 'is' ? 'Viðskiptavinur' : 'Customer')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="flex-1 space-y-3 md:border-l md:border-slate-200 md:pl-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">{locale === 'is' ? 'Netfang' : 'Email'}</p>
                    <p className="font-medium text-slate-900 break-all">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                    <Phone className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{locale === 'is' ? 'Sími' : 'Phone'}</p>
                    <p className="font-medium text-slate-900">{user.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Hash className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{locale === 'is' ? 'Kennitala' : 'National ID'}</p>
                    <p className="font-medium text-slate-900">{user.kennitala || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                    <Calendar className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{locale === 'is' ? 'Skráður' : 'Joined'}</p>
                    <p className="font-medium text-slate-900">{formatDate(user.createdAt, locale)}</p>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="card p-4 text-center">
              <div className="inline-flex p-2.5 bg-blue-100 rounded-xl mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalBookings}</p>
              <p className="text-xs text-slate-500">{locale === 'is' ? 'Bókanir' : 'Bookings'}</p>
            </div>
            <div className="card p-4 text-center">
              <div className="inline-flex p-2.5 bg-green-100 rounded-xl mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.completedBookings}</p>
              <p className="text-xs text-slate-500">{locale === 'is' ? 'Lokið' : 'Completed'}</p>
            </div>
            <div className="card p-4 text-center">
              <div className="inline-flex p-2.5 bg-amber-100 rounded-xl mb-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.activeBookings}</p>
              <p className="text-xs text-slate-500">{locale === 'is' ? 'Virkar' : 'Active'}</p>
            </div>
            <div className="card p-4 text-center">
              <div className="inline-flex p-2.5 bg-primary-100 rounded-xl mb-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">{formatPrice(stats.totalSpent, locale)}</p>
              <p className="text-xs text-slate-500">{locale === 'is' ? 'Heildarupphæð' : 'Total Spent'}</p>
            </div>
            <div className="card p-4 text-center col-span-2 sm:col-span-1">
              <div className="inline-flex p-2.5 bg-slate-100 rounded-xl mb-2">
                <Car className="h-5 w-5 text-slate-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.vehicleCount}</p>
              <p className="text-xs text-slate-500">{locale === 'is' ? 'Ökutæki' : 'Vehicles'}</p>
            </div>
          </div>
        )}

        {/* Bookings List */}
        <div className="card overflow-hidden -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              {locale === 'is' ? 'Bókanir' : 'Bookings'}
            </h3>
            <span className="text-sm text-slate-500">{user.bookings.length} {locale === 'is' ? 'bókanir' : 'bookings'}</span>
          </div>
          
          {user.bookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">{locale === 'is' ? 'Engar bókanir' : 'No bookings yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {user.bookings.map((booking) => {
                const statusConfig = STATUS_CONFIG[booking.status];
                return (
                  <div
                    key={booking.id}
                    onClick={() => router.push(`/${locale}/admin/bookings/${booking.id}`)}
                    className="px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer">

                    <div className="flex items-center gap-4">
                      {/* Reference and status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold text-primary-600">{booking.reference}</span>
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            statusConfig.color
                          )}>
                            {statusConfig.icon}
                            {locale === 'is' ? statusConfig.labelIs : statusConfig.labelEn}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Car className="h-3.5 w-3.5" />
                            {booking.vehicle.licensePlate}
                            {booking.vehicle.make && ` • ${booking.vehicle.make} ${booking.vehicle.model || ''}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {booking.lot.name}
                          </span>
                          {booking.departureFlightNumber && (
                            <span className="flex items-center gap-1">
                              <Plane className="h-3.5 w-3.5" />
                              {booking.departureFlightNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(booking.dropOffTime, locale)} → {formatDate(booking.pickUpTime, locale)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.totalDays} {locale === 'is' ? 'dagar' : 'days'}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatPrice(booking.totalPrice, locale)}</p>
                      </div>

                      {/* Arrow */}
                      <div className="text-slate-400">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vehicles List */}
        {user.vehicles.length > 0 && (
          <div className="card overflow-hidden -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Car className="h-5 w-5 text-primary-600" />
                {locale === 'is' ? 'Ökutæki' : 'Vehicles'}
              </h3>
              <span className="text-sm text-slate-500">{user.vehicles.length} {locale === 'is' ? 'ökutæki' : 'vehicles'}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {user.vehicles.map((vehicle) => (
                <div key={vehicle.id} className="px-4 sm:px-5 py-4 flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <Car className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{vehicle.licensePlate}</p>
                    <p className="text-sm text-slate-500">
                      {vehicle.make} {vehicle.model} {vehicle.color && `• ${vehicle.color}`}
                    </p>
                  </div>
                  {vehicle.vehicleType && (
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                      {locale === 'is' ? vehicle.vehicleType.name : vehicle.vehicleType.nameEn}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
