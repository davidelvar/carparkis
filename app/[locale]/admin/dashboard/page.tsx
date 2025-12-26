'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Calendar,
  Car,
  DollarSign,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  PlaneTakeoff,
  PlaneLanding,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import AdminShell from '@/components/admin/AdminShell';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';

interface DashboardData {
  stats: {
    totalBookings: number;
    bookingsThisMonth: number;
    bookingTrend: number;
    totalRevenue: number;
    revenueThisMonth: number;
    revenueTrend: number;
    activeBookings: number;
    totalCapacity: number;
    occupancyRate: number;
    todayArrivals: number;
    todayDepartures: number;
    pendingBookings: number;
  };
  charts: {
    revenueByDay: { date: string; revenue: number }[];
    bookingsByStatus: { status: string; count: number }[];
  };
  recentBookings: {
    id: string;
    reference: string;
    customerName: string;
    licensePlate: string;
    vehicle: string;
    status: string;
    dropOffTime: string;
    pickUpTime: string;
    totalPrice: number;
    createdAt: string;
  }[];
  topServices: {
    name: string;
    nameEn: string;
    count: number;
    revenue: number;
  }[];
  occupancyForecast: {
    date: string;
    day: number;
    bookings: number;
    occupancy: number;
    capacity: number;
    arrivals: number;
    departures: number;
  }[];
}

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  CHECKED_IN: '#8b5cf6',
  IN_PROGRESS: '#06b6d4',
  READY: '#22c55e',
  CHECKED_OUT: '#64748b',
  CANCELLED: '#ef4444',
  NO_SHOW: '#f97316',
};

const statusLabels: Record<string, { is: string; en: string }> = {
  PENDING: { is: 'Í bið', en: 'Pending' },
  CONFIRMED: { is: 'Staðfest', en: 'Confirmed' },
  CHECKED_IN: { is: 'Innritað', en: 'Checked In' },
  IN_PROGRESS: { is: 'Í vinnslu', en: 'In Progress' },
  READY: { is: 'Tilbúið', en: 'Ready' },
  CHECKED_OUT: { is: 'Útritað', en: 'Checked Out' },
  CANCELLED: { is: 'Afbókað', en: 'Cancelled' },
  NO_SHOW: { is: 'Mætti ekki', en: 'No Show' },
};

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const locale = useLocale();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(locale === 'is' ? 'Villa við að sækja gögn' : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <AdminShell title={t('dashboard')}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-slate-500">{locale === 'is' ? 'Hleð gögnum...' : 'Loading data...'}</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (error || !data) {
    return (
      <AdminShell title={t('dashboard')}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">{error}</p>
            <button
              onClick={fetchDashboard}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <RefreshCw className="h-4 w-4" />
              {locale === 'is' ? 'Reyna aftur' : 'Try again'}
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  const { stats, charts, recentBookings, topServices, occupancyForecast } = data;

  return (
    <AdminShell title={t('dashboard')}>
      <div className="space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Calendar}
            label={locale === 'is' ? 'Bókanir í þessum mánuði' : 'Bookings This Month'}
            value={stats.bookingsThisMonth.toLocaleString()}
            subValue={`${stats.totalBookings.toLocaleString()} ${locale === 'is' ? 'alls' : 'total'}`}
            trend={stats.bookingTrend}
          />
          <StatCard
            icon={DollarSign}
            label={locale === 'is' ? 'Tekjur í þessum mánuði' : 'Revenue This Month'}
            value={formatPrice(stats.revenueThisMonth, locale)}
            subValue={`${formatPrice(stats.totalRevenue, locale)} ${locale === 'is' ? 'alls' : 'total'}`}
            trend={stats.revenueTrend}
          />
          <StatCard
            icon={Car}
            label={locale === 'is' ? 'Bílar á staðnum' : 'Cars On Site'}
            value={stats.activeBookings.toString()}
            subValue={`${stats.occupancyRate}% ${locale === 'is' ? 'nýting' : 'occupancy'}`}
            trend={null}
            highlight={stats.occupancyRate > 80}
          />
          <StatCard
            icon={AlertCircle}
            label={locale === 'is' ? 'Þarfnast athygli' : 'Needs Attention'}
            value={stats.pendingBookings.toString()}
            subValue={locale === 'is' ? 'bókanir í bið' : 'pending bookings'}
            trend={null}
            alert={stats.pendingBookings > 0}
          />
        </div>

        {/* Today's Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  {locale === 'is' ? 'Komu í dag' : "Today's Arrivals"}
                </p>
                <p className="text-4xl font-bold mt-2">{stats.todayArrivals}</p>
                <p className="text-green-100 text-sm mt-1">
                  {locale === 'is' ? 'bílar sem skila af sér' : 'cars dropping off'}
                </p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <PlaneTakeoff className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  {locale === 'is' ? 'Fara í dag' : "Today's Departures"}
                </p>
                <p className="text-4xl font-bold mt-2">{stats.todayDepartures}</p>
                <p className="text-blue-100 text-sm mt-1">
                  {locale === 'is' ? 'bílar sem sækja' : 'cars picking up'}
                </p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <PlaneLanding className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Occupancy Forecast */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">
                {locale === 'is' ? 'Nýtingarspá næstu 30 daga' : 'Occupancy Forecast - Next 30 Days'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {locale === 'is' ? `Hámark: ${stats.totalCapacity} bílastæði` : `Capacity: ${stats.totalCapacity} spaces`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />
                <span className="text-slate-600">{locale === 'is' ? 'Nýting' : 'Occupancy'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">{locale === 'is' ? 'Koma' : 'Check-in'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600">{locale === 'is' ? 'Fara' : 'Check-out'}</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancyForecast} margin={{ left: -10, right: 30, top: 10 }}>
                <defs>
                  <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#255da0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#255da0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickMargin={8}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.getDate().toString();
                  }}
                  interval={2}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                  width={45}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  fontSize={12}
                  width={35}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const date = new Date(label);
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[160px]">
                        <p className="font-medium text-slate-900 mb-2">
                          {date.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">{locale === 'is' ? 'Nýting' : 'Occupancy'}</span>
                            <span className="font-semibold text-primary-600">{data?.occupancy}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500">{locale === 'is' ? 'Bílar á stað' : 'Cars on site'}</span>
                            <span className="font-semibold text-slate-700">{data?.bookings}</span>
                          </div>
                          <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between gap-4">
                            <span className="text-emerald-600">{locale === 'is' ? 'Koma' : 'Arriving'}</span>
                            <span className="font-semibold text-emerald-600">+{data?.arrivals}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-blue-600">{locale === 'is' ? 'Fara' : 'Departing'}</span>
                            <span className="font-semibold text-blue-600">-{data?.departures}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine yAxisId="left" y={80} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#255da0"
                  strokeWidth={2}
                  fill="url(#occupancyGradient)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="arrivals"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="departures"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Peak days indicator */}
          {occupancyForecast.some(d => d.occupancy >= 80) && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600 mb-2">
                {locale === 'is' ? 'Háanýtingardagar (80%+):' : 'High occupancy days (80%+):'}
              </p>
              <div className="flex flex-wrap gap-2">
                {occupancyForecast
                  .filter(d => d.occupancy >= 80)
                  .slice(0, 10)
                  .map((d) => (
                    <span
                      key={d.date}
                      className={cn(
                        'px-2 py-1 rounded-md text-xs font-medium',
                        d.occupancy >= 90
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      )}
                    >
                      {new Date(d.date).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })} ({d.occupancy}%)
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">
                {locale === 'is' ? 'Tekjur síðustu 7 daga' : 'Revenue Last 7 Days'}
              </h3>
              <div className="text-sm text-slate-500">
                {formatPrice(charts.revenueByDay.reduce((sum, d) => sum + d.revenue, 0), locale)}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenueByDay} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={8} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} width={50} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value, locale), locale === 'is' ? 'Tekjur' : 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#255da0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-6">
              {locale === 'is' ? 'Staða bókana' : 'Booking Status'}
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.bookingsByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {charts.bookingsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      statusLabels[name]?.[locale === 'is' ? 'is' : 'en'] || name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {charts.bookingsByStatus.slice(0, 4).map((item) => (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: statusColors[item.status] }}
                    />
                    <span className="text-slate-600">
                      {statusLabels[item.status]?.[locale === 'is' ? 'is' : 'en'] || item.status}
                    </span>
                  </div>
                  <span className="font-medium text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bookings & Top Services */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                {locale === 'is' ? 'Nýlegar bókanir' : 'Recent Bookings'}
              </h3>
              <Link
                href={`/${locale}/admin/bookings`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                {locale === 'is' ? 'Sjá allar' : 'View all'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {locale === 'is' ? 'Engar bókanir enn' : 'No bookings yet'}
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/${locale}/admin/bookings/${booking.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {booking.reference}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${statusColors[booking.status]}20`,
                            color: statusColors[booking.status],
                          }}
                        >
                          {statusLabels[booking.status]?.[locale === 'is' ? 'is' : 'en']}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate mt-0.5">
                        {booking.customerName} • {booking.licensePlate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {formatPrice(booking.totalPrice, locale)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(booking.createdAt).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Top Services */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-6">
              {locale === 'is' ? 'Vinsæl þjónusta' : 'Popular Services'}
            </h3>
            {topServices.length === 0 ? (
              <p className="text-slate-500 text-sm">
                {locale === 'is' ? 'Engin þjónusta enn' : 'No services yet'}
              </p>
            ) : (
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {locale === 'is' ? service.name : service.nameEn}
                      </p>
                      <p className="text-sm text-slate-500">
                        {service.count} {locale === 'is' ? 'bókanir' : 'bookings'}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatPrice(service.revenue, locale)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            {locale === 'is' ? 'Flýtiaðgerðir' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href={`/${locale}/admin/bookings`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
            >
              <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {locale === 'is' ? 'Bókanir' : 'Bookings'}
              </span>
            </Link>
            <Link
              href={`/${locale}/admin/pricing`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
            >
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {locale === 'is' ? 'Verð' : 'Pricing'}
              </span>
            </Link>
            <Link
              href={`/${locale}/admin/services`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
            >
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {locale === 'is' ? 'Þjónusta' : 'Services'}
              </span>
            </Link>
            <Link
              href={`/${locale}/admin/users`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {locale === 'is' ? 'Notendur' : 'Users'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  highlight,
  alert,
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  trend?: number | null;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border p-5',
      alert ? 'border-amber-200 bg-amber-50' : 'border-slate-200'
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center',
          alert ? 'bg-amber-100' : highlight ? 'bg-green-100' : 'bg-primary-100'
        )}>
          <Icon className={cn(
            'h-5 w-5',
            alert ? 'text-amber-600' : highlight ? 'text-green-600' : 'text-primary-600'
          )} />
        </div>
        {trend !== null && trend !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full',
            trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {trend >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
        {subValue && (
          <p className="text-xs text-slate-400 mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
}
