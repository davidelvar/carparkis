'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  locale?: string;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  locale = 'is',
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
    }
  }, [value]);

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
    // Convert Sunday (0) to 7 for Monday-first week
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

  const isDateSelected = (dateStr: string) => {
    return dateStr === value;
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (dateStr: string) => {
    if (!isDateDisabled(dateStr)) {
      onChange(dateStr);
      setIsOpen(false);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getFirstDayOfMonth(viewDate);
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Days of the month
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
            'hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-accent-500/50',
            disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
            selected && 'bg-accent-500 text-white hover:bg-accent-400',
            !selected && !disabled && 'text-white',
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
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger - renders children or default display */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {/* This is where the parent component's content will trigger the picker */}
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-white/10 p-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-400" />
              </button>
              <h3 className="text-sm font-semibold text-white">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="h-9 w-9 flex items-center justify-center text-xs font-medium text-slate-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  if (!isDateDisabled(today)) {
                    handleDateClick(today);
                  }
                }}
                className="flex-1 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                {locale === 'is' ? 'Í dag' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowStr = tomorrow.toISOString().split('T')[0];
                  if (!isDateDisabled(tomorrowStr)) {
                    handleDateClick(tomorrowStr);
                  }
                }}
                className="flex-1 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                {locale === 'is' ? 'Á morgun' : 'Tomorrow'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  const nextWeekStr = nextWeek.toISOString().split('T')[0];
                  if (!isDateDisabled(nextWeekStr)) {
                    handleDateClick(nextWeekStr);
                  }
                }}
                className="flex-1 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                {locale === 'is' ? '1 vika' : '1 week'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to use the date picker with external trigger
export function useDatePicker() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(!isOpen),
  };
}
