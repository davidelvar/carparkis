'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  PlaneTakeoff,
  PlaneLanding,
  ChevronRight,
  ChevronLeft,
  Droplets,
  Zap,
  Snowflake,
  Calendar,
  Car,
  Sparkles,
  Shield,
  Package,
  ArrowRight,
  Clock,
  Brush,
  Armchair,
  Wrench,
  Sun,
  Wind,
  Battery,
  Plug,
  Flame,
  Star,
  Heart,
  Truck,
  Folder,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon map matching backend CATEGORY_ICONS
const ICON_MAP: Record<string, { icon: LucideIcon; bgColor: string; iconColor: string }> = {
  charging: { icon: Zap, bgColor: 'bg-green-50', iconColor: 'text-green-500' },
  cleaning: { icon: Sparkles, bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  deep_cleaning: { icon: Brush, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500' },
  leather: { icon: Armchair, bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
  detailing: { icon: Wrench, bgColor: 'bg-slate-100', iconColor: 'text-slate-600' },
  coating: { icon: Shield, bgColor: 'bg-amber-50', iconColor: 'text-amber-500' },
  polishing: { icon: Sun, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-500' },
  droplets: { icon: Droplets, bgColor: 'bg-cyan-50', iconColor: 'text-cyan-500' },
  wind: { icon: Wind, bgColor: 'bg-sky-50', iconColor: 'text-sky-500' },
  battery: { icon: Battery, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
  plug: { icon: Plug, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  snowflake: { icon: Snowflake, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
  flame: { icon: Flame, bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
  star: { icon: Star, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-500' },
  heart: { icon: Heart, bgColor: 'bg-pink-50', iconColor: 'text-pink-500' },
  clock: { icon: Clock, bgColor: 'bg-slate-50', iconColor: 'text-slate-500' },
  package: { icon: Package, bgColor: 'bg-slate-50', iconColor: 'text-slate-500' },
  car: { icon: Car, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
  truck: { icon: Truck, bgColor: 'bg-slate-100', iconColor: 'text-slate-600' },
  folder: { icon: Folder, bgColor: 'bg-slate-50', iconColor: 'text-slate-500' },
};

const DEFAULT_ICON_CONFIG = { icon: Package, bgColor: 'bg-slate-50', iconColor: 'text-slate-500' };

// Fallback mapping from category code to icon (for categories without icon field set)
const CODE_TO_ICON: Record<string, string> = {
  washing: 'droplets',
  charging: 'charging',
  winter: 'snowflake',
  detailing: 'detailing',
  protection: 'coating',
  cleaning: 'cleaning',
};

// Custom Calendar Component
function MiniCalendar({
  value,
  onChange,
  minDate,
  locale,
  onClose,
}: {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  locale: string;
  onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  const monthNames = locale === 'is' 
    ? ['Janúar', 'Febrúar', 'Mars', 'Apríl', 'Maí', 'Júní', 'Júlí', 'Ágúst', 'September', 'Október', 'Nóvember', 'Desember']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = locale === 'is'
    ? ['Má', 'Þr', 'Mi', 'Fi', 'Fö', 'La', 'Su']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isDateDisabled = (dateStr: string) => minDate ? dateStr < minDate : false;
  const isDatePast = (dateStr: string) => dateStr < todayStr;
  const isDateSelected = (dateStr: string) => dateStr === value;
  const isToday = (dateStr: string) => dateStr === todayStr;

  const handleDateClick = (dateStr: string) => {
    if (!isDateDisabled(dateStr)) {
      onChange(dateStr);
      onClose();
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getFirstDayOfMonth(viewDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(viewDate.getFullYear(), viewDate.getMonth(), day);
      const disabled = isDateDisabled(dateStr);
      const past = isDatePast(dateStr);
      const selected = isDateSelected(dateStr);
      const today = isToday(dateStr);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(dateStr)}
          disabled={disabled}
          className={cn(
            'h-8 w-8 rounded-lg text-sm font-medium transition-all',
            'hover:bg-white/20 focus:outline-none',
            disabled && 'text-slate-500 cursor-not-allowed hover:bg-transparent',
            past && !disabled && 'text-slate-500 cursor-not-allowed hover:bg-transparent',
            selected && 'bg-accent-500 text-white hover:bg-accent-400',
            !selected && !disabled && !past && 'text-white',
            today && !selected && 'ring-1 ring-accent-500/50'
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-white/10 p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-slate-400" />
        </button>
        <h3 className="text-sm font-semibold text-white">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day) => (
          <div key={day} className="h-8 w-8 flex items-center justify-center text-xs font-medium text-slate-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
        {[
          { label: locale === 'is' ? 'Í dag' : 'Today', days: 0 },
          { label: locale === 'is' ? 'Á morgun' : 'Tomorrow', days: 1 },
          { label: locale === 'is' ? '+1 vika' : '+1 week', days: 7 },
        ].map((quick) => {
          const date = new Date();
          date.setDate(date.getDate() + quick.days);
          const dateStr = date.toISOString().split('T')[0];
          const disabled = isDateDisabled(dateStr);
          
          return (
            <button
              key={quick.days}
              type="button"
              onClick={() => !disabled && handleDateClick(dateStr)}
              disabled={disabled}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors',
                disabled 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              )}
            >
              {quick.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function QuickBookingCard() {
  const locale = useLocale();
  const router = useRouter();
  const departureRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<HTMLDivElement>(null);
  
  // Service categories state
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    nameEn: string;
    code: string;
    icon: string | null;
    isActive: boolean;
  }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch active service categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/services');
        const result = await response.json();
        if (result.success && result.categories) {
          setCategories(result.categories.filter((c: any) => c.isActive));
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 8);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const [departureDate, setDepartureDate] = useState(tomorrowStr);
  const [returnDate, setReturnDate] = useState(nextWeekStr);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPicker, setOpenPicker] = useState<'departure' | 'return' | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openPicker === 'departure' && departureRef.current && !departureRef.current.contains(event.target as Node)) {
        setOpenPicker(null);
      }
      if (openPicker === 'return' && returnRef.current && !returnRef.current.contains(event.target as Node)) {
        setOpenPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPicker]);

  const calculateDays = () => {
    if (!departureDate || !returnDate) return 0;
    const dep = new Date(departureDate);
    const ret = new Date(returnDate);
    const diffTime = ret.getTime() - dep.getTime();
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
  };

  const days = calculateDays();
  const estimatedPrice = 7000 + (days * 600);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const params = new URLSearchParams({ departure: departureDate, return: returnDate });
    router.push(`/${locale}/booking?${params.toString()}`);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    
    // Use explicit formatting to avoid hydration mismatches between server/client
    const weekdays = locale === 'is' 
      ? ['Sun', 'Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = locale === 'is'
      ? ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${weekday} ${day} ${month}`;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="relative">
      {/* Glass morphism card with gradient border */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 rounded-3xl blur opacity-30" />
      
      <form 
        onSubmit={handleSubmit}
        className="relative rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 overflow-hidden border border-white/50"
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent-500 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary-500/20 backdrop-blur">
                <Car className="h-4 w-4 text-primary-400" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {locale === 'is' ? 'Fljótleg bókun' : 'Quick Booking'}
              </h2>
            </div>
            <p className="text-sm text-slate-400 ml-10">
              {locale === 'is' ? 'Veldu dagsetningar og bókaðu á mínútu' : 'Select dates and book in a minute'}
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Date pickers - horizontal timeline style */}
          <div className="relative">
            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
              {/* Departure date picker */}
              <div ref={departureRef} className="relative">
                <div 
                  className={cn(
                    'p-4 rounded-2xl cursor-pointer transition-all group border-2',
                    openPicker === 'departure' 
                      ? 'bg-primary-50 border-primary-500 shadow-lg shadow-primary-500/20' 
                      : 'bg-white border-slate-200 hover:border-primary-300 hover:bg-slate-50 hover:shadow-md'
                  )}
                  onClick={() => setOpenPicker(openPicker === 'departure' ? null : 'departure')}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        openPicker === 'departure' ? 'bg-primary-100' : 'bg-green-100 group-hover:bg-green-200'
                      )}>
                        <PlaneTakeoff className={cn(
                          'h-3.5 w-3.5',
                          openPicker === 'departure' ? 'text-primary-600' : 'text-green-600'
                        )} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {locale === 'is' ? 'Brottför' : 'Departure'}
                      </span>
                    </div>
                    <Calendar className="h-4 w-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <p className="text-base font-bold text-slate-900 pl-0.5">
                    {departureDate ? formatDisplayDate(departureDate) : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 pl-0.5 group-hover:text-primary-500 transition-colors">
                    {locale === 'is' ? 'Smelltu til að velja' : 'Click to select'}
                  </p>
                </div>
                
                {openPicker === 'departure' && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <MiniCalendar
                      value={departureDate}
                      onChange={(date) => {
                        setDepartureDate(date);
                        if (date > returnDate) {
                          const newReturn = new Date(date);
                          newReturn.setDate(newReturn.getDate() + 7);
                          setReturnDate(newReturn.toISOString().split('T')[0]);
                        }
                      }}
                      minDate={today}
                      locale={locale}
                      onClose={() => setOpenPicker(null)}
                    />
                  </div>
                )}
              </div>

              {/* Arrow connector with days badge */}
              <div className="flex flex-col items-center gap-1 px-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
                {days > 0 && (
                  <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {days} {days === 1 ? (locale === 'is' ? 'd' : 'd') : (locale === 'is' ? 'd' : 'd')}
                  </span>
                )}
              </div>

              {/* Return date picker */}
              <div ref={returnRef} className="relative">
                <div 
                  className={cn(
                    'p-4 rounded-2xl cursor-pointer transition-all group border-2',
                    openPicker === 'return' 
                      ? 'bg-primary-50 border-primary-500 shadow-lg shadow-primary-500/20' 
                      : 'bg-white border-slate-200 hover:border-primary-300 hover:bg-slate-50 hover:shadow-md'
                  )}
                  onClick={() => setOpenPicker(openPicker === 'return' ? null : 'return')}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        openPicker === 'return' ? 'bg-primary-100' : 'bg-blue-100 group-hover:bg-blue-200'
                      )}>
                        <PlaneLanding className={cn(
                          'h-3.5 w-3.5',
                          openPicker === 'return' ? 'text-primary-600' : 'text-blue-600'
                        )} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {locale === 'is' ? 'Koma' : 'Return'}
                      </span>
                    </div>
                    <Calendar className="h-4 w-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <p className="text-base font-bold text-slate-900 pl-0.5">
                    {returnDate ? formatDisplayDate(returnDate) : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 pl-0.5 group-hover:text-primary-500 transition-colors">
                    {locale === 'is' ? 'Smelltu til að velja' : 'Click to select'}
                  </p>
                </div>
                
                {openPicker === 'return' && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <MiniCalendar
                      value={returnDate}
                      onChange={setReturnDate}
                      minDate={departureDate || today}
                      locale={locale}
                      onClose={() => setOpenPicker(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price display - more prominent */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-5 text-center">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-primary-200" />
                <p className="text-xs font-medium text-primary-200 uppercase tracking-wider">
                  {locale === 'is' ? 'Áætlað verð' : 'Estimated Price'}
                </p>
              </div>
              <p className="text-4xl font-bold text-white mb-1">
                {estimatedPrice.toLocaleString('is-IS')} <span className="text-xl font-medium text-primary-200">kr</span>
              </p>
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur rounded-full px-3 py-1">
                <Car className="h-3 w-3 text-primary-200" />
                <span className="text-xs font-medium text-primary-100">
                  {locale === 'is' 
                    ? `Lítill bíll · ${days} ${days === 1 ? 'dagur' : 'dagar'}` 
                    : `Small car · ${days} ${days === 1 ? 'day' : 'days'}`}
                </span>
              </div>
            </div>
          </div>

          {/* Submit button - more prominent */}
          <button
            type="submit"
            disabled={isSubmitting || !departureDate || !returnDate}
            className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/25 transition-all hover:bg-slate-800 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting 
              ? (locale === 'is' ? 'Hleð...' : 'Loading...') 
              : (locale === 'is' ? 'Halda áfram með bókun' : 'Continue to booking')}
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Services teaser - cleaner horizontal layout */}
          <div className="pt-3">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 mb-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="font-medium uppercase tracking-wider px-2">
                {locale === 'is' ? 'Aukaþjónusta í boði' : 'Available services'}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            
            <div className="flex justify-center gap-6">
              {categoriesLoading ? (
                // Loading skeleton
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-xl bg-slate-100 animate-pulse">
                        <div className="h-6 w-6" />
                      </div>
                      <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
                    </div>
                  ))}
                </>
              ) : categories.length > 0 ? (
                categories.slice(0, 4).map((category) => {
                  // Use icon field, fall back to code-based mapping, then default
                  const iconKey = category.icon || CODE_TO_ICON[category.code] || 'package';
                  const config = ICON_MAP[iconKey] || DEFAULT_ICON_CONFIG;
                  const IconComponent = config.icon;
                  
                  return (
                    <div 
                      key={category.id} 
                      className="flex flex-col items-center gap-2 group cursor-default"
                    >
                      <div className={cn('p-3 rounded-xl transition-all', config.bgColor, 'group-hover:scale-110')}>
                        <IconComponent className={cn('h-6 w-6', config.iconColor)} />
                      </div>
                      <span className="text-xs font-medium text-slate-600 text-center leading-tight">
                        {locale === 'is' ? category.name : category.nameEn}
                      </span>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-xl bg-cyan-50">
                      <Droplets className="h-6 w-6 text-cyan-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{locale === 'is' ? 'Þvottur' : 'Wash'}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-xl bg-green-50">
                      <Zap className="h-6 w-6 text-green-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{locale === 'is' ? 'Hleðsla' : 'Charge'}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-xl bg-blue-50">
                      <Snowflake className="h-6 w-6 text-blue-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{locale === 'is' ? 'Vetur' : 'Winter'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
