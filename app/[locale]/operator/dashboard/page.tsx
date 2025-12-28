'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Car,
  PlaneLanding,
  PlaneTakeoff,
  Wrench,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  X,
  Check,
  MoreHorizontal,
  Play,
  Pause,
  Ban,
  Sparkles,
  ChevronDown,
  Filter,
  CalendarDays,
  ArrowRight,
  Loader2,
  ClipboardCheck,
  CarFront,
  Settings,
  LogOut,
  Globe,
  Plus,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
} from 'recharts';
import { cn, formatTime, formatPrice } from '@/lib/utils';
import type { BookingWithRelations } from '@/types';
import { AddonStatus } from '@prisma/client';
import Logo from '@/components/ui/Logo';
import { useRouter, usePathname } from 'next/navigation';
import ManualBookingModal from '@/components/operator/ManualBookingModal';

interface DashboardStats {
  todayArrivals: number;
  todayDepartures: number;
  carsOnSite: number;
  pendingServices: number;
  upcomingBookings: number;
  totalCapacity: number;
}

interface OccupancyForecast {
  date: string;
  day: number;
  bookings: number;
  occupancy: number;
  capacity: number;
  arrivals: number;
  departures: number;
}

type TabType = 'arrivals' | 'departures' | 'onsite' | 'services' | 'upcoming';

const STATUS_CONFIG: Record<string, { label: { is: string; en: string }; color: string; bg: string }> = {
  PENDING: { label: { is: 'Í bið', en: 'Pending' }, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  CONFIRMED: { label: { is: 'Staðfest', en: 'Confirmed' }, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  CHECKED_IN: { label: { is: 'Innritað', en: 'Checked In' }, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  IN_PROGRESS: { label: { is: 'Í vinnslu', en: 'In Progress' }, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
  READY: { label: { is: 'Tilbúið', en: 'Ready' }, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  CHECKED_OUT: { label: { is: 'Útritað', en: 'Checked Out' }, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  CANCELLED: { label: { is: 'Afbókað', en: 'Cancelled' }, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  NO_SHOW: { label: { is: 'Mætti ekki', en: 'No Show' }, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
};

const ADDON_STATUS_CONFIG: Record<string, { label: { is: string; en: string }; color: string; bg: string }> = {
  PENDING: { label: { is: 'Í bið', en: 'Pending' }, color: 'text-amber-700', bg: 'bg-amber-50' },
  IN_PROGRESS: { label: { is: 'Í vinnslu', en: 'In Progress' }, color: 'text-blue-700', bg: 'bg-blue-50' },
  COMPLETED: { label: { is: 'Lokið', en: 'Completed' }, color: 'text-green-700', bg: 'bg-green-50' },
  SKIPPED: { label: { is: 'Sleppt', en: 'Skipped' }, color: 'text-slate-500', bg: 'bg-slate-100' },
};

// Flight status type from API
interface FlightStatusData {
  flightNumber: string;
  scheduledTime: string;
  estimatedTime?: string;
  actualTime?: string;
  status: string;
  destination?: string;
  airline?: string;
  isDelayed: boolean;
  delayMinutes?: number;
  fetchedAt: string;
}

export default function OperatorDashboard() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [stats, setStats] = useState<DashboardStats>({
    todayArrivals: 0,
    todayDepartures: 0,
    carsOnSite: 0,
    pendingServices: 0,
    upcomingBookings: 0,
    totalCapacity: 100,
  });
  const [occupancyForecast, setOccupancyForecast] = useState<OccupancyForecast[]>([]);
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('arrivals');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [flightStatuses, setFlightStatuses] = useState<Record<string, FlightStatusData>>({});
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Initialize time on client-side only to prevent hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch flight statuses for today's bookings
  const fetchFlightStatuses = async (allBookings: BookingWithRelations[], today: string) => {
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Collect departure flight numbers for today's arrivals (drop-offs)
    const departureFlights = allBookings
      .filter(b => {
        const dropOff = new Date(b.dropOffTime);
        return dropOff.toDateString() === today && b.departureFlightNumber;
      })
      .map(b => b.departureFlightNumber!)
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    // Collect arrival flight numbers for today's departures (pick-ups)
    const arrivalFlights = allBookings
      .filter(b => {
        const pickUp = new Date(b.pickUpTime);
        return pickUp.toDateString() === today && b.arrivalFlightNumber;
      })
      .map(b => b.arrivalFlightNumber!)
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    const newStatuses: Record<string, FlightStatusData> = {};

    // Fetch departure flight statuses
    if (departureFlights.length > 0) {
      try {
        const res = await fetch(
          `/api/flights/status?date=${todayDate}&type=departures&flights=${departureFlights.join(',')}`
        );
        const data = await res.json();
        if (data.success && data.data.statuses) {
          Object.assign(newStatuses, data.data.statuses);
        }
      } catch (error) {
        console.error('Failed to fetch departure flight statuses:', error);
      }
    }

    // Fetch arrival flight statuses
    if (arrivalFlights.length > 0) {
      try {
        const res = await fetch(
          `/api/flights/status?date=${todayDate}&type=arrivals&flights=${arrivalFlights.join(',')}`
        );
        const data = await res.json();
        if (data.success && data.data.statuses) {
          Object.assign(newStatuses, data.data.statuses);
        }
      } catch (error) {
        console.error('Failed to fetch arrival flight statuses:', error);
      }
    }

    setFlightStatuses(newStatuses);
  };

  // Switch language
  const otherLocale = locale === 'is' ? 'en' : 'is';
  const switchLanguage = () => {
    const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
    router.push(newPath);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings');
      const result = await response.json();

      if (result.success) {
        setBookings(result.data);
        const now = new Date();
        const today = now.toDateString();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const arrivals = result.data.filter((b: BookingWithRelations) => {
          const dropOff = new Date(b.dropOffTime);
          return dropOff.toDateString() === today && ['CONFIRMED', 'PENDING'].includes(b.status);
        });

        const departures = result.data.filter((b: BookingWithRelations) => {
          const pickUp = new Date(b.pickUpTime);
          return pickUp.toDateString() === today && ['READY', 'CHECKED_IN', 'IN_PROGRESS'].includes(b.status);
        });

        const onSite = result.data.filter((b: BookingWithRelations) =>
          ['CHECKED_IN', 'IN_PROGRESS', 'READY'].includes(b.status)
        );

        const pendingServices = result.data.reduce((count: number, b: BookingWithRelations) => {
          return count + (b.addons?.filter((a: any) => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length || 0);
        }, 0);

        const upcoming = result.data.filter((b: BookingWithRelations) => {
          const dropOff = new Date(b.dropOffTime);
          return dropOff > now && dropOff <= nextWeek && ['CONFIRMED', 'PENDING'].includes(b.status);
        });

        setStats(prev => ({
          ...prev,
          todayArrivals: arrivals.length,
          todayDepartures: departures.length,
          carsOnSite: onSite.length,
          pendingServices,
          upcomingBookings: upcoming.length,
        }));

        // Fetch flight statuses for today's arrivals and departures
        fetchFlightStatuses(result.data, today);
      }

      // Fetch occupancy forecast from admin dashboard API
      try {
        const dashboardRes = await fetch('/api/admin/dashboard');
        const dashboardData = await dashboardRes.json();
        if (dashboardData.occupancyForecast) {
          setOccupancyForecast(dashboardData.occupancyForecast);
        }
        if (dashboardData.stats?.totalCapacity) {
          setStats(prev => ({ ...prev, totalCapacity: dashboardData.stats.totalCapacity }));
        }
      } catch (err) {
        console.error('Failed to fetch occupancy forecast:', err);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.reference.toLowerCase().includes(query) ||
      booking.vehicle.licensePlate.toLowerCase().includes(query) ||
      booking.user?.name?.toLowerCase().includes(query) ||
      booking.user?.email?.toLowerCase().includes(query) ||
      booking.departureFlightNumber?.toLowerCase().includes(query) ||
      booking.arrivalFlightNumber?.toLowerCase().includes(query)
    );
  });

  const getTabBookings = () => {
    const now = new Date();
    const today = now.toDateString();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (activeTab) {
      case 'arrivals':
        return filteredBookings
          .filter((b) => new Date(b.dropOffTime).toDateString() === today && ['CONFIRMED', 'PENDING'].includes(b.status))
          .sort((a, b) => new Date(a.dropOffTime).getTime() - new Date(b.dropOffTime).getTime());
      case 'departures':
        return filteredBookings
          .filter((b) => new Date(b.pickUpTime).toDateString() === today && ['READY', 'CHECKED_IN', 'IN_PROGRESS'].includes(b.status))
          .sort((a, b) => new Date(a.pickUpTime).getTime() - new Date(b.pickUpTime).getTime());
      case 'onsite':
        return filteredBookings
          .filter((b) => ['CHECKED_IN', 'IN_PROGRESS', 'READY'].includes(b.status))
          .sort((a, b) => new Date(a.pickUpTime).getTime() - new Date(b.pickUpTime).getTime());
      case 'services':
        return filteredBookings
          .filter((b) => b.addons?.some((a: any) => a.status === 'PENDING' || a.status === 'IN_PROGRESS'))
          .sort((a, b) => new Date(a.dropOffTime).getTime() - new Date(b.dropOffTime).getTime());
      case 'upcoming':
        return filteredBookings
          .filter((b) => {
            const dropOff = new Date(b.dropOffTime);
            return dropOff > now && dropOff <= nextWeek && ['CONFIRMED', 'PENDING'].includes(b.status);
          })
          .sort((a, b) => new Date(a.dropOffTime).getTime() - new Date(b.dropOffTime).getTime());
      default:
        return filteredBookings;
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    setActionLoading(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        await fetchData();
        if (selectedBooking?.id === bookingId) {
          const updated = bookings.find(b => b.id === bookingId);
          if (updated) setSelectedBooking({ ...updated, status } as BookingWithRelations);
        }
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const updateAddonStatus = async (bookingId: string, addonId: string, status: AddonStatus) => {
    setActionLoading(addonId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/addons/${addonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        // Optimistically update local state instead of full refresh
        setBookings(prev => prev.map(booking => {
          if (booking.id !== bookingId) return booking;
          return {
            ...booking,
            addons: booking.addons?.map(addon => 
              addon.id === addonId ? { ...addon, status } : addon
            ),
          };
        }));
        // Also update selected booking if it's the one being modified
        setSelectedBooking(prev => {
          if (!prev || prev.id !== bookingId) return prev;
          return {
            ...prev,
            addons: prev.addons?.map(addon => 
              addon.id === addonId ? { ...addon, status } : addon
            ),
          };
        });
        // Update pending services count
        setStats(prev => ({
          ...prev,
          pendingServices: status === 'COMPLETED' ? prev.pendingServices - 1 : prev.pendingServices,
        }));
      }
    } catch (error) {
      console.error('Failed to update addon:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { id: TabType; label: { is: string; en: string }; icon: any; count: number; color: { active: string; badge: string } }[] = [
    { id: 'arrivals', label: { is: 'Komur í dag', en: 'Today\'s Arrivals' }, icon: PlaneLanding, count: stats.todayArrivals, color: { active: 'bg-green-600 text-white shadow-lg shadow-green-600/20', badge: 'bg-green-100 text-green-700' } },
    { id: 'departures', label: { is: 'Brottfarir í dag', en: 'Today\'s Departures' }, icon: PlaneTakeoff, count: stats.todayDepartures, color: { active: 'bg-blue-600 text-white shadow-lg shadow-blue-600/20', badge: 'bg-blue-100 text-blue-700' } },
    { id: 'onsite', label: { is: 'Á staðnum', en: 'On Site' }, icon: Car, count: stats.carsOnSite, color: { active: 'bg-violet-600 text-white shadow-lg shadow-violet-600/20', badge: 'bg-violet-100 text-violet-700' } },
    { id: 'services', label: { is: 'Þjónustur', en: 'Services' }, icon: Wrench, count: stats.pendingServices, color: { active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20', badge: 'bg-amber-100 text-amber-700' } },
    { id: 'upcoming', label: { is: 'Væntanlegar', en: 'Upcoming' }, icon: CalendarDays, count: stats.upcomingBookings, color: { active: 'bg-slate-700 text-white shadow-lg shadow-slate-700/20', badge: 'bg-slate-200 text-slate-700' } },
  ];

  const tabBookings = getTabBookings();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Logo size="sm" />
              <div className="hidden sm:block h-8 w-px bg-slate-200" />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  {locale === 'is' ? 'Rekstrarstjórn' : 'Operations'}
                </h1>
                <p className="hidden sm:block text-xs text-slate-500">
                  {currentTime ? currentTime.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : '\u00A0'}
                </p>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Occupancy Forecast Button */}
              <button
                onClick={() => setShowOccupancyModal(true)}
                className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors relative"
                title={locale === 'is' ? 'Nýtingarspá' : 'Occupancy Forecast'}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">
                  {locale === 'is' ? 'Nýting' : 'Occupancy'}
                </span>
                {occupancyForecast.some(d => d.occupancy >= 80) && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                )}
              </button>
              
              {/* Manual Booking Button */}
              <button
                onClick={() => setShowManualBookingModal(true)}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-[#255da0] text-white hover:bg-[#1e4d85] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">
                  {locale === 'is' ? 'Ný bókun' : 'New Booking'}
                </span>
              </button>
              
              {/* Refresh - icon only on mobile */}
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                title={locale === 'is' ? 'Uppfæra' : 'Refresh'}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                <span className="hidden sm:inline text-sm font-medium">
                  {locale === 'is' ? 'Uppfæra' : 'Refresh'}
                </span>
              </button>
              
              {/* Settings menu - contains language switch on mobile */}
              <div className="relative" ref={settingsMenuRef}>
                <button 
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showSettingsMenu ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Settings className="h-5 w-5" />
                </button>
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                    <Link
                      href={`/${locale}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowSettingsMenu(false)}
                    >
                      <Car className="h-4 w-4" />
                      {locale === 'is' ? 'Forsíða' : 'Home'}
                    </Link>
                    <button
                      onClick={() => {
                        switchLanguage();
                        setShowSettingsMenu(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      {locale === 'is' ? 'English' : 'Íslenska'}
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {locale === 'is' ? 'Útskrá' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 p-1.5 sm:p-2">
            {/* Mobile: 5 icons in a row */}
            <div className="flex sm:hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg font-medium transition-all relative',
                    activeTab === tab.id
                      ? tab.color.active
                      : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  <div className="relative">
                    <tab.icon className="h-5 w-5" />
                    {tab.count > 0 && (
                      <span className={cn(
                        'absolute -top-1 -right-2 px-1 min-w-[1rem] h-4 flex items-center justify-center rounded-full text-[10px] font-bold',
                        activeTab === tab.id 
                          ? 'bg-white/30 text-white' 
                          : tab.color.badge
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] leading-tight text-center truncate w-full px-0.5">
                    {tab.id === 'arrivals' ? (locale === 'is' ? 'Komur' : 'In') :
                     tab.id === 'departures' ? (locale === 'is' ? 'Brottf.' : 'Out') :
                     tab.id === 'onsite' ? (locale === 'is' ? 'Á stað' : 'Site') :
                     tab.id === 'services' ? (locale === 'is' ? 'Þjón.' : 'Svc') :
                     (locale === 'is' ? 'Vænt.' : 'Soon')}
                  </span>
                </button>
              ))}
            </div>
            {/* Tablet: Scrollable row with compact styling */}
            <div className="hidden sm:flex md:hidden overflow-x-auto gap-1.5 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all',
                    activeTab === tab.id
                      ? tab.color.active
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label[locale === 'is' ? 'is' : 'en']}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-bold min-w-[1.5rem] text-center',
                      activeTab === tab.id 
                        ? 'bg-white/25 text-white' 
                        : tab.color.badge
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {/* Desktop: Full row */}
            <div className="hidden md:flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-base whitespace-nowrap transition-all',
                    activeTab === tab.id
                      ? tab.color.active
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label[locale === 'is' ? 'is' : 'en']}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-sm font-bold min-w-[2rem] text-center',
                      activeTab === tab.id 
                        ? 'bg-white/25 text-white' 
                        : tab.color.badge
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={locale === 'is' ? 'Leita að bílnúmeri, bókunarnúmeri, nafni...' : 'Search license plate, booking ref, name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary-500 focus:ring-0 transition-all text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Bookings List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary-600" />
                <p className="text-slate-500">{locale === 'is' ? 'Hleður...' : 'Loading...'}</p>
              </div>
            ) : tabBookings.length === 0 ? (
              <div className="py-16 text-center">
                <Car className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 font-medium">
                  {locale === 'is' ? 'Engar bókanir' : 'No bookings'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {locale === 'is' ? 'Engar bókanir fundust í þessum flokki' : 'No bookings found in this category'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tabBookings.map((booking) => 
                  activeTab === 'services' ? (
                    <ServiceCard
                      key={booking.id}
                      booking={booking}
                      locale={locale}
                      actionLoading={actionLoading}
                      onAddonUpdate={updateAddonStatus}
                      onSelect={() => setSelectedBooking(booking)}
                    />
                  ) : (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      locale={locale}
                      activeTab={activeTab}
                      actionLoading={actionLoading}
                      flightStatus={
                        activeTab === 'arrivals' 
                          ? flightStatuses[booking.departureFlightNumber || '']
                          : flightStatuses[booking.arrivalFlightNumber || '']
                      }
                      onStatusUpdate={updateBookingStatus}
                      onSelect={() => setSelectedBooking(booking)}
                    />
                  )
                )}
              </div>
            )}
          </div>


        </div>
      </main>

      {/* Booking Detail Slide-over */}
      {selectedBooking && (
        <BookingDetailPanel
          booking={selectedBooking}
          locale={locale}
          actionLoading={actionLoading}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={updateBookingStatus}
          onAddonUpdate={updateAddonStatus}
        />
      )}

      {/* Manual Booking Modal */}
      <ManualBookingModal
        isOpen={showManualBookingModal}
        onClose={() => setShowManualBookingModal(false)}
        onSuccess={() => {
          fetchData();
          setShowManualBookingModal(false);
        }}
      />

      {/* Occupancy Forecast Modal */}
      {showOccupancyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowOccupancyModal(false)} 
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                  {locale === 'is' ? 'Nýtingarspá næstu 30 daga' : 'Occupancy Forecast - Next 30 Days'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {locale === 'is' ? `Hámark: ${stats.totalCapacity} bílastæði` : `Capacity: ${stats.totalCapacity} spaces`}
                </p>
              </div>
              <button
                onClick={() => setShowOccupancyModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />
                  <span className="text-slate-600">{locale === 'is' ? 'Nýting' : 'Occupancy'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">{locale === 'is' ? 'Koma' : 'In'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-600">{locale === 'is' ? 'Fara' : 'Out'}</span>
                </div>
              </div>
              
              {/* Chart */}
              <div className="h-72 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={occupancyForecast} margin={{ left: -10, right: 10, top: 10 }}>
                    <defs>
                      <linearGradient id="occupancyGradientModal" x1="0" y1="0" x2="0" y2="1">
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
                      interval={1}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                      width={40}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#64748b"
                      fontSize={11}
                      width={30}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const date = new Date(label);
                        const dayName = date.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { weekday: 'short' });
                        const dateStr = date.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'short' });
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 text-sm">
                            <p className="font-medium text-slate-900 mb-2">{dayName}, {dateStr}</p>
                            <div className="space-y-1">
                              <p className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary-500" />
                                <span className="text-slate-600">{locale === 'is' ? 'Nýting' : 'Occupancy'}:</span>
                                <span className="font-medium">{data.occupancy}%</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-slate-600">{locale === 'is' ? 'Komur' : 'Check-ins'}:</span>
                                <span className="font-medium">{data.arrivals}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                <span className="text-slate-600">{locale === 'is' ? 'Brottfarir' : 'Check-outs'}:</span>
                                <span className="font-medium">{data.departures}</span>
                              </p>
                              <p className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                <span className="text-slate-600">{locale === 'is' ? 'Bílar' : 'Cars'}:</span>
                                <span className="font-medium">{data.bookings} / {data.capacity}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#255da0"
                      strokeWidth={2}
                      fill="url(#occupancyGradientModal)"
                    />
                    <Bar yAxisId="right" dataKey="arrivals" fill="#22c55e" radius={[2, 2, 0, 0]} barSize={8} />
                    <Bar yAxisId="right" dataKey="departures" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* High occupancy warning */}
              {occupancyForecast.some(d => d.occupancy >= 80) && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800">
                        {locale === 'is' ? 'Há nýting væntanleg' : 'High occupancy expected'}
                      </p>
                      <p className="text-amber-700 text-sm mt-1">
                        {occupancyForecast
                          .filter(d => d.occupancy >= 80)
                          .map(d => new Date(d.date).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Booking Card Component
function BookingCard({
  booking,
  locale,
  activeTab,
  actionLoading,
  flightStatus,
  onStatusUpdate,
  onSelect,
}: {
  booking: BookingWithRelations;
  locale: string;
  activeTab: TabType;
  actionLoading: string | null;
  flightStatus?: FlightStatusData;
  onStatusUpdate: (id: string, status: string) => void;
  onSelect: () => void;
}) {
  const isLoading = actionLoading === booking.id;
  const statusConfig = STATUS_CONFIG[booking.status];
  const pendingAddons = booking.addons?.filter((a: any) => a.status === 'PENDING' || a.status === 'IN_PROGRESS') || [];

  const getTimeDisplay = () => {
    if (activeTab === 'departures') {
      return { time: booking.pickUpTime, flight: booking.arrivalFlightNumber, icon: PlaneLanding };
    }
    return { time: booking.dropOffTime, flight: booking.departureFlightNumber, icon: PlaneTakeoff };
  };

  const timeInfo = getTimeDisplay();
  const timeDate = new Date(timeInfo.time);
  const isOverdue = timeDate < new Date() && ['CONFIRMED', 'PENDING'].includes(booking.status);
  const isToday = timeDate.toDateString() === new Date().toDateString();

  return (
    <div 
      className="group relative bg-white hover:bg-slate-50/50 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="p-4 flex items-center gap-4">
        {/* License Plate */}
        <div className="flex-shrink-0">
          <div className={cn(
            "h-11 px-3.5 rounded-lg flex items-center justify-center font-mono font-bold text-base tracking-wider transition-colors",
            isOverdue 
              ? "bg-red-600 text-white" 
              : "bg-slate-900 text-white group-hover:bg-slate-800"
          )}>
            {booking.vehicle.licensePlate}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex items-center gap-6">
          {/* Vehicle & Customer */}
          <div className="min-w-0 w-40 flex-shrink-0">
            <p className="font-medium text-slate-900 truncate">
              {booking.vehicle.make} {booking.vehicle.model}
            </p>
            <p className="text-sm text-slate-500 truncate">
              {booking.user?.name || booking.user?.email?.split('@')[0] || '—'}
            </p>
          </div>

          {/* Time Block */}
          <div className="hidden sm:flex items-center gap-3 w-36 flex-shrink-0">
            <div className={cn(
              "flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center",
              isOverdue ? "bg-red-100" : "bg-slate-100"
            )}>
              <Clock className={cn("h-5 w-5", isOverdue ? "text-red-600" : "text-slate-600")} />
            </div>
            <div>
              <p className={cn("font-semibold tabular-nums", isOverdue ? "text-red-600" : "text-slate-900")}>
                {formatTime(timeInfo.time, locale)}
              </p>
              <p className="text-xs text-slate-500">
                {isToday 
                  ? (locale === 'is' ? 'Í dag' : 'Today')
                  : timeDate.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'short' })
                }
              </p>
            </div>
          </div>

          {/* Flight */}
          <div className="hidden md:flex items-center gap-3 w-36 flex-shrink-0">
            {timeInfo.flight ? (
              <>
                <div className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center",
                  flightStatus?.isDelayed ? "bg-amber-100" : "bg-blue-50"
                )}>
                  <timeInfo.icon className={cn(
                    "h-5 w-5",
                    flightStatus?.isDelayed ? "text-amber-600" : "text-blue-600"
                  )} />
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    "font-medium",
                    flightStatus?.isDelayed ? "text-amber-700" : "text-slate-700"
                  )}>{timeInfo.flight}</p>
                  {flightStatus?.isDelayed && flightStatus.delayMinutes ? (
                    <p className="text-xs text-amber-600 font-medium">
                      +{flightStatus.delayMinutes} {locale === 'is' ? 'mín' : 'min'}
                    </p>
                  ) : flightStatus?.status && flightStatus.status !== 'On time' ? (
                    <p className="text-xs text-slate-500 truncate">{flightStatus.status}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <span className="text-slate-400 text-sm">—</span>
            )}
          </div>

          {/* Status & Indicators */}
          <div className="hidden lg:flex items-center gap-2 flex-1">
            {/* Flight delay badge */}
            {flightStatus?.isDelayed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                {locale === 'is' ? 'Seinkað' : 'Delayed'}
              </span>
            )}
            <span className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
              statusConfig?.bg,
              statusConfig?.color
            )}>
              {statusConfig?.label[locale === 'is' ? 'is' : 'en']}
            </span>
            {booking.addons && booking.addons.length > 0 && pendingAddons.length === 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {locale === 'is' ? 'Þjónustur lokið' : 'Services done'}
              </span>
            )}
            {pendingAddons.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <Wrench className="h-3.5 w-3.5" />
                {pendingAddons.length} {locale === 'is' ? 'þjónusta' : 'service'}{pendingAddons.length > 1 ? (locale === 'is' ? 'r' : 's') : ''}
              </span>
            )}
            {booking.lot && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                <MapPin className="h-3.5 w-3.5" />
                {locale === 'is' ? booking.lot.name : (booking.lot.nameEn || booking.lot.name)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {booking.status === 'CONFIRMED' && (
            <button
              onClick={() => onStatusUpdate(booking.id, 'CHECKED_IN')}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span className="hidden xl:inline">{locale === 'is' ? 'Innritun' : 'Check In'}</span>
            </button>
          )}
          {(booking.status === 'CHECKED_IN' || booking.status === 'IN_PROGRESS' || booking.status === 'READY') && (
            <button
              onClick={() => onStatusUpdate(booking.id, 'CHECKED_OUT')}
              disabled={isLoading || pendingAddons.length > 0}
              title={pendingAddons.length > 0 ? (locale === 'is' ? 'Ljúka þjónustum fyrst' : 'Complete services first') : undefined}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50",
                pendingAddons.length > 0
                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                  : "bg-primary-600 text-white hover:bg-primary-700"
              )}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CarFront className="h-4 w-4" />}
              <span className="hidden xl:inline">{locale === 'is' ? 'Útritun' : 'Check Out'}</span>
            </button>
          )}
          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>

      {/* Mobile: Additional Info Row */}
      <div className="sm:hidden px-4 pb-3 flex items-center gap-3 text-sm">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md",
          isOverdue ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
        )}>
          <Clock className="h-3.5 w-3.5" />
          <span className="font-medium">{formatTime(timeInfo.time, locale)}</span>
        </div>
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-semibold',
          statusConfig?.bg,
          statusConfig?.color
        )}>
          {statusConfig?.label[locale === 'is' ? 'is' : 'en']}
        </span>
        {pendingAddons.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">
            <Wrench className="h-3.5 w-3.5" />
            {pendingAddons.length}
          </span>
        )}
      </div>
    </div>
  );
}

// Service Card Component - for Services tab
function ServiceCard({
  booking,
  locale,
  actionLoading,
  onAddonUpdate,
  onSelect,
}: {
  booking: BookingWithRelations;
  locale: string;
  actionLoading: string | null;
  onAddonUpdate: (bookingId: string, addonId: string, status: AddonStatus) => void;
  onSelect: () => void;
}) {
  const allAddons = booking.addons || [];
  const pendingAddons = allAddons.filter((a: any) => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
  const completedAddons = allAddons.filter((a: any) => a.status === 'COMPLETED');
  const totalAddons = allAddons.length;
  const completedCount = completedAddons.length;

  return (
    <div className="bg-white">
      {/* Header Row */}
      <div 
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={onSelect}
      >
        {/* License Plate */}
        <div className="flex-shrink-0">
          <div className="h-11 px-3.5 rounded-lg flex items-center justify-center font-mono font-bold text-base tracking-wider bg-slate-900 text-white">
            {booking.vehicle.licensePlate}
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="min-w-0 w-36 flex-shrink-0">
          <p className="font-medium text-slate-900 truncate">
            {booking.vehicle.make} {booking.vehicle.model}
          </p>
          <p className="text-sm text-slate-500 truncate">
            {booking.user?.name || booking.user?.email?.split('@')[0] || '—'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">
                  {locale === 'is' ? 'Framvinda' : 'Progress'}
                </span>
                <span className="font-semibold text-slate-900">
                  {completedCount}/{totalAddons}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    completedCount === totalAddons ? "bg-green-500" : "bg-amber-500"
                  )}
                  style={{ width: `${totalAddons > 0 ? (completedCount / totalAddons) * 100 : 0}%` }}
                />
              </div>
            </div>
            {completedCount === totalAddons && totalAddons > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {locale === 'is' ? 'Lokið' : 'Done'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                {pendingAddons.length} {locale === 'is' ? 'eftir' : 'remaining'}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
      </div>

      {/* Services List */}
      <div className="px-4 pb-4 space-y-2">
        {allAddons.map((addon: any) => {
          const isLoading = actionLoading === addon.id;
          const isPending = addon.status === 'PENDING' || addon.status === 'IN_PROGRESS';
          const isCompleted = addon.status === 'COMPLETED';

          return (
            <div
              key={addon.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-colors",
                isCompleted 
                  ? "bg-green-50/50 border-green-200" 
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center",
                  isCompleted ? "bg-green-100" : "bg-white border border-slate-200"
                )}>
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Wrench className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className={cn(
                    "font-medium",
                    isCompleted ? "text-green-900" : "text-slate-900"
                  )}>
                    {locale === 'is' ? addon.service.name : addon.service.nameEn}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatPrice(addon.price, locale)}
                  </p>
                </div>
              </div>

              {isPending && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddonUpdate(booking.id, addon.id, AddonStatus.COMPLETED);
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{locale === 'is' ? 'Lokið' : 'Done'}</span>
                </button>
              )}

              {isCompleted && (
                <span className="text-xs font-medium text-green-600 px-2">
                  ✓ {locale === 'is' ? 'Lokið' : 'Completed'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Booking Detail Panel Component
function BookingDetailPanel({
  booking,
  locale,
  actionLoading,
  onClose,
  onStatusUpdate,
  onAddonUpdate,
}: {
  booking: BookingWithRelations;
  locale: string;
  actionLoading: string | null;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  onAddonUpdate: (bookingId: string, addonId: string, status: AddonStatus) => void;
}) {
  const statusConfig = STATUS_CONFIG[booking.status];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{booking.reference}</h2>
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border mt-1',
                statusConfig?.bg,
                statusConfig?.color
              )}>
                {statusConfig?.label[locale === 'is' ? 'is' : 'en']}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Vehicle */}
          <div className="bg-slate-900 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{locale === 'is' ? 'Bíll' : 'Vehicle'}</p>
                <p className="font-mono font-bold text-2xl tracking-wider mt-1">
                  {booking.vehicle.licensePlate}
                </p>
                <p className="text-slate-300 text-sm mt-1">
                  {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year && `(${booking.vehicle.year})`}
                </p>
              </div>
              <Car className="h-10 w-10 text-slate-500" />
            </div>
          </div>

          {/* Customer */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {locale === 'is' ? 'Viðskiptavinur' : 'Customer'}
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {booking.user?.name || (locale === 'is' ? 'Ekki skráð' : 'Not provided')}
                  </p>
                  <p className="text-sm text-slate-500">{booking.user?.email}</p>
                </div>
              </div>
              {booking.user?.phone && (
                <a
                  href={`tel:${booking.user.phone}`}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Phone className="h-4 w-4" />
                  {booking.user.phone}
                </a>
              )}
            </div>
          </div>

          {/* Times */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {locale === 'is' ? 'Tímar' : 'Schedule'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <PlaneTakeoff className="h-4 w-4" />
                  <span className="text-sm font-medium">{locale === 'is' ? 'Brottför' : 'Departure'}</span>
                </div>
                <p className="font-semibold text-slate-900">
                  {new Date(booking.dropOffTime).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <p className="text-sm text-slate-600">{formatTime(booking.dropOffTime, locale)}</p>
                {booking.departureFlightNumber && (
                  <p className="text-xs text-slate-500 mt-1">✈ {booking.departureFlightNumber}</p>
                )}
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <PlaneLanding className="h-4 w-4" />
                  <span className="text-sm font-medium">{locale === 'is' ? 'Koma' : 'Arrival'}</span>
                </div>
                <p className="font-semibold text-slate-900">
                  {new Date(booking.pickUpTime).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <p className="text-sm text-slate-600">{formatTime(booking.pickUpTime, locale)}</p>
                {booking.arrivalFlightNumber && (
                  <p className="text-xs text-slate-500 mt-1">✈ {booking.arrivalFlightNumber}</p>
                )}
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                {booking.totalDays} {booking.totalDays === 1 ? (locale === 'is' ? 'dagur' : 'day') : (locale === 'is' ? 'dagar' : 'days')}
              </span>
            </div>
          </div>

          {/* Services */}
          {booking.addons && booking.addons.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {locale === 'is' ? 'Þjónustur' : 'Services'}
              </h3>
              <div className="space-y-2">
                {booking.addons.map((addon: any) => {
                  const addonConfig = ADDON_STATUS_CONFIG[addon.status];
                  const isLoading = actionLoading === addon.id;

                  return (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center',
                          addonConfig?.bg
                        )}>
                          {addon.status === 'COMPLETED' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : addon.status === 'SKIPPED' ? (
                            <XCircle className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Wrench className={cn('h-4 w-4', addonConfig?.color)} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {locale === 'is' ? addon.service.name : addon.service.nameEn}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatPrice(addon.price, locale)}
                          </p>
                        </div>
                      </div>

                      {/* Service Actions */}
                      {(addon.status === 'PENDING' || addon.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => onAddonUpdate(booking.id, addon.id, AddonStatus.COMPLETED)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          {locale === 'is' ? 'Lokið' : 'Done'}
                        </button>
                      )}
                      {addon.status === 'COMPLETED' && (
                        <span className={cn(
                          'px-2 py-1 rounded-md text-xs font-medium',
                          addonConfig?.bg,
                          addonConfig?.color
                        )}>
                          {addonConfig?.label[locale === 'is' ? 'is' : 'en']}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {locale === 'is' ? 'Verð' : 'Price'}
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{locale === 'is' ? 'Bílastæði' : 'Parking'}</span>
                <span className="text-slate-900">{formatPrice(booking.baseTotal, locale)}</span>
              </div>
              {booking.addonsTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{locale === 'is' ? 'Þjónustur' : 'Services'}</span>
                  <span className="text-slate-900">{formatPrice(booking.addonsTotal, locale)}</span>
                </div>
              )}
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{locale === 'is' ? 'Afsláttur' : 'Discount'}</span>
                  <span>-{formatPrice(booking.discountAmount, locale)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold">
                <span className="text-slate-900">{locale === 'is' ? 'Samtals' : 'Total'}</span>
                <span className="text-slate-900">{formatPrice(booking.totalPrice, locale)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(booking.notes || booking.internalNotes) && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {locale === 'is' ? 'Athugasemdir' : 'Notes'}
              </h3>
              {booking.notes && (
                <div className="bg-amber-50 rounded-xl p-4 mb-2">
                  <p className="text-sm text-amber-900">{booking.notes}</p>
                </div>
              )}
              {booking.internalNotes && (
                <div className="bg-slate-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-500 mb-1">{locale === 'is' ? 'Innri athugasemd' : 'Internal note'}</p>
                  <p className="text-sm text-slate-700">{booking.internalNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            {booking.status === 'CONFIRMED' && (
              <button
                onClick={() => onStatusUpdate(booking.id, 'CHECKED_IN')}
                disabled={actionLoading === booking.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === booking.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                {locale === 'is' ? 'Innritun' : 'Check In'}
              </button>
            )}
            {(booking.status === 'CHECKED_IN' || booking.status === 'IN_PROGRESS' || booking.status === 'READY') && (() => {
              const pendingServices = booking.addons?.filter((a: any) => a.status === 'PENDING' || a.status === 'IN_PROGRESS') || [];
              const hasPendingServices = pendingServices.length > 0;
              
              return (
                <>
                  {hasPendingServices && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <span>
                        {locale === 'is' 
                          ? `${pendingServices.length} þjónust${pendingServices.length > 1 ? 'ur' : 'a'} ólokið`
                          : `${pendingServices.length} service${pendingServices.length > 1 ? 's' : ''} pending`
                        }
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => onStatusUpdate(booking.id, 'CHECKED_OUT')}
                    disabled={actionLoading === booking.id || hasPendingServices}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50",
                      hasPendingServices
                        ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                        : "bg-primary-600 text-white hover:bg-primary-700"
                    )}
                  >
                    {actionLoading === booking.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CarFront className="h-5 w-5" />}
                    {locale === 'is' ? 'Útritun' : 'Check Out'}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
