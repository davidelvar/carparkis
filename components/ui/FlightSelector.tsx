'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Search, Clock, ChevronDown, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Flight {
  flightNumber: string;
  time: string;
  destination?: string;
  origin?: string;
  airline?: string;
  status: string;
}

interface FlightSelectorProps {
  type: 'departure' | 'arrival';
  flights: Flight[];
  loading: boolean;
  isManual: boolean;
  setManual: (v: boolean) => void;
  selectedFlight: string | undefined;
  selectedTime: string | undefined;
  onSelectFlight: (flight: Flight) => void;
  onManualChange: (flightNumber: string, time: string) => void;
  locale: string;
  flightNumberLabel: string;
  compact?: boolean;
}

export default function FlightSelector({
  type,
  flights,
  loading,
  isManual,
  setManual,
  selectedFlight,
  selectedTime,
  onSelectFlight,
  onManualChange,
  locale,
  flightNumberLabel,
  compact = false,
}: FlightSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedFlightData = flights.find(f => f.flightNumber === selectedFlight);

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

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center text-slate-500",
        compact ? "py-4" : "py-8"
      )}>
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        {locale === 'is' ? 'Sæki flug...' : 'Loading flights...'}
      </div>
    );
  }

  if (isManual || flights.length === 0) {
    return (
      <div className="space-y-3">
        {flights.length > 0 && (
          <button
            type="button"
            onClick={() => setManual(false)}
            className="text-sm text-[#255da0] hover:text-[#1e4d85] flex items-center gap-1"
          >
            <Search className="h-4 w-4" />
            {locale === 'is' ? 'Velja úr fluglista' : 'Select from flight list'}
          </button>
        )}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{flightNumberLabel}</label>
            <input
              type="text"
              value={selectedFlight || ''}
              onChange={(e) => onManualChange(e.target.value.toUpperCase(), selectedTime || '')}
              placeholder="FI614"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#255da0] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {locale === 'is' ? 'Flugtími' : 'Flight time'}
            </label>
            <input
              type="time"
              value={selectedTime || ''}
              onChange={(e) => onManualChange(selectedFlight || '', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#255da0] focus:border-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Custom flight dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
            isOpen 
              ? 'border-[#255da0] ring-2 ring-[#255da0]/20 bg-white' 
              : 'border-slate-200 bg-white hover:border-slate-300',
            selectedFlight && 'border-[#255da0]/30 bg-blue-50/50'
          )}
        >
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full shrink-0',
            type === 'departure' ? 'bg-green-100' : 'bg-blue-100'
          )}>
            {type === 'departure' 
              ? <PlaneTakeoff className="h-5 w-5 text-green-600" />
              : <PlaneLanding className="h-5 w-5 text-blue-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            {selectedFlightData ? (
              <>
                <p className="font-semibold text-slate-900">
                  {selectedFlightData.flightNumber} · {selectedFlightData.time}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  {type === 'departure' ? `→ ${selectedFlightData.destination}` : `← ${selectedFlightData.origin}`}
                  {selectedFlightData.airline && ` · ${selectedFlightData.airline}`}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-600">
                  {locale === 'is' ? 'Veldu flug' : 'Select flight'}
                </p>
                <p className="text-sm text-slate-400">
                  {flights.length} {locale === 'is' ? 'flug í boði' : 'flights available'}
                </p>
              </>
            )}
          </div>
          <ChevronDown className={cn(
            'h-5 w-5 text-slate-400 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-xl bg-white border border-slate-200 shadow-xl max-h-80 overflow-hidden">
              {/* Flight list */}
              <div className="max-h-64 overflow-y-auto">
                {flights.map((flight, index) => (
                  <button
                    key={`${flight.flightNumber}-${flight.time}-${index}`}
                    type="button"
                    onClick={() => {
                      onSelectFlight(flight);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left transition-colors border-b border-slate-100 last:border-0',
                      'hover:bg-slate-50',
                      selectedFlight === flight.flightNumber && 'bg-blue-50'
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                      <Clock className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{flight.time}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-slate-700">{flight.flightNumber}</span>
                        {flight.airline && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {flight.airline}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {type === 'departure' ? `→ ${flight.destination}` : `← ${flight.origin}`}
                      </p>
                    </div>
                    {selectedFlight === flight.flightNumber && (
                      <div className="h-5 w-5 rounded-full bg-[#255da0] flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Manual entry option */}
              <div className="border-t border-slate-200 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setManual(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Search className="h-4 w-4" />
                  {locale === 'is' ? 'Slá inn handvirkt' : 'Enter manually'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
