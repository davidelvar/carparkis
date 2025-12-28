'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniCalendarProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  locale?: string;
  onClose: () => void;
}

export function MiniCalendar({
  value,
  onChange,
  minDate,
  maxDate,
  locale = 'is',
  onClose,
}: MiniCalendarProps) {
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

  const isDateDisabled = (dateStr: string) => {
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isDateSelected = (dateStr: string) => dateStr === value;
  const isToday = (dateStr: string) => dateStr === new Date().toISOString().split('T')[0];

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
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(viewDate.getFullYear(), viewDate.getMonth(), day);
      const disabled = isDateDisabled(dateStr);
      const selected = isDateSelected(dateStr);
      const today = isToday(dateStr);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(dateStr)}
          disabled={disabled}
          className={cn(
            'h-9 w-9 rounded-lg text-sm font-medium transition-all',
            'hover:bg-primary-100 focus:outline-none',
            disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
            selected && 'bg-primary-600 text-white hover:bg-primary-500',
            !selected && !disabled && 'text-slate-700',
            today && !selected && 'ring-1 ring-primary-500/50'
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </button>
        <h3 className="text-sm font-semibold text-slate-900">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map((day) => (
          <div key={day} className="h-9 w-9 flex items-center justify-center text-xs font-medium text-slate-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {renderCalendar()}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
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
                  ? 'text-slate-300 cursor-not-allowed' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
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

// Date Picker Input with dropdown calendar
interface DatePickerInputProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  locale?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function DatePickerInput({
  value,
  onChange,
  minDate,
  maxDate,
  locale = 'is',
  label,
  required,
  placeholder,
  icon,
  className,
}: DatePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="label">
          {label} {required && '*'}
        </label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'input flex items-center gap-2 cursor-pointer',
          isOpen && 'ring-2 ring-primary-500 border-primary-500'
        )}
      >
        {icon}
        <span className={cn('flex-1', !value && 'text-slate-400')}>
          {value ? formatDisplayDate(value) : (placeholder || (locale === 'is' ? 'Veldu dagsetningu' : 'Select date'))}
        </span>
        <Calendar className={cn('h-5 w-5', isOpen ? 'text-primary-600' : 'text-slate-400')} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <MiniCalendar
            value={value}
            onChange={onChange}
            minDate={minDate}
            maxDate={maxDate}
            locale={locale}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
