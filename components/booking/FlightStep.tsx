'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Plane, ArrowLeft, ArrowRight, Info, Loader2, Search, Clock, ChevronDown, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { cn } from '@/lib/utils';
import DatePickerInput from '@/components/ui/DatePickerInput';
import type { BookingData } from '@/app/[locale]/(customer)/booking/page';

interface Flight {
  flightNumber: string;
  time: string;
  destination?: string;
  origin?: string;
  airline?: string;
  status: string;
}

// Separate component for flight selector to properly use hooks
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
}

function FlightSelector({
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
}: FlightSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedFlightData = flights.find(f => f.flightNumber === selectedFlight);

  // Filter flights based on search query
  const filteredFlights = flights.filter(flight => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      flight.flightNumber.toLowerCase().includes(query) ||
      flight.airline?.toLowerCase().includes(query) ||
      flight.destination?.toLowerCase().includes(query) ||
      flight.origin?.toLowerCase().includes(query) ||
      flight.time.includes(query)
    );
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
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
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <Search className="h-4 w-4" />
            {locale === 'is' ? 'Velja úr fluglista' : 'Select from flight list'}
          </button>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">{flightNumberLabel}</label>
            <input
              type="text"
              value={selectedFlight || ''}
              onChange={(e) => onManualChange(e.target.value.toUpperCase(), selectedTime || '')}
              placeholder="FI614"
              className="input"
            />
          </div>
          <div>
            <label className="label">
              {locale === 'is' ? 'Flugtími' : 'Flight time'}
            </label>
            <input
              type="time"
              value={selectedTime || ''}
              onChange={(e) => onManualChange(selectedFlight || '', e.target.value)}
              className="input"
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
              ? 'border-primary-500 ring-2 ring-primary-500/20 bg-white' 
              : 'border-slate-200 bg-white hover:border-slate-300',
            selectedFlight && 'border-primary-200 bg-primary-50/50'
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
          <div className="absolute top-full left-0 right-0 mt-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-xl bg-white border border-slate-200 shadow-xl max-h-96 overflow-hidden flex flex-col">
              {/* Search input */}
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={locale === 'is' ? 'Leita að flugi...' : 'Search flights...'}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              {/* Flight list */}
              <div className="flex-1 overflow-y-auto max-h-64">
                {filteredFlights.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    {locale === 'is' ? 'Ekkert flug fannst' : 'No flights found'}
                  </div>
                ) : (
                  filteredFlights.map((flight, index) => (
                    <button
                      key={`${flight.flightNumber}-${flight.time}-${index}`}
                      type="button"
                      onClick={() => {
                        onSelectFlight(flight);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 text-left transition-colors border-b border-slate-100 last:border-0',
                        'hover:bg-slate-50',
                        selectedFlight === flight.flightNumber && 'bg-primary-50'
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
                        <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Manual entry option */}
              <div className="border-t border-slate-200 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setManual(true);
                    setIsOpen(false);
                    setSearchQuery('');
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

interface FlightStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function FlightStep({ data, onUpdate, onNext, onBack }: FlightStepProps) {
  const t = useTranslations('booking');
  const locale = useLocale();

  // Flight data state
  const [departureFlights, setDepartureFlights] = useState<Flight[]>([]);
  const [arrivalFlights, setArrivalFlights] = useState<Flight[]>([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  
  // Manual entry mode
  const [manualDeparture, setManualDeparture] = useState(false);
  const [manualArrival, setManualArrival] = useState(false);

  // Get tomorrow as default departure date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  // Fetch departures when date changes
  const fetchDepartures = useCallback(async (date: string) => {
    if (!date) return;
    
    setLoadingDepartures(true);
    try {
      const res = await fetch(`/api/flights/departures?date=${date}`);
      const json = await res.json();
      if (json.success && json.data?.flights) {
        setDepartureFlights(json.data.flights);
        setManualDeparture(json.data.flights.length === 0);
      } else {
        setDepartureFlights([]);
        setManualDeparture(true);
      }
    } catch (error) {
      console.error('Failed to fetch departures:', error);
      setDepartureFlights([]);
      setManualDeparture(true);
    } finally {
      setLoadingDepartures(false);
    }
  }, []);

  // Fetch arrivals when date changes
  const fetchArrivals = useCallback(async (date: string) => {
    if (!date) return;
    
    setLoadingArrivals(true);
    try {
      const res = await fetch(`/api/flights/arrivals?date=${date}`);
      const json = await res.json();
      if (json.success && json.data?.flights) {
        setArrivalFlights(json.data.flights);
        setManualArrival(json.data.flights.length === 0);
      } else {
        setArrivalFlights([]);
        setManualArrival(true);
      }
    } catch (error) {
      console.error('Failed to fetch arrivals:', error);
      setArrivalFlights([]);
      setManualArrival(true);
    } finally {
      setLoadingArrivals(false);
    }
  }, []);

  // Fetch flights when dates change
  useEffect(() => {
    if (data.departureFlightDate) {
      fetchDepartures(data.departureFlightDate);
    }
  }, [data.departureFlightDate, fetchDepartures]);

  useEffect(() => {
    if (data.arrivalFlightDate) {
      fetchArrivals(data.arrivalFlightDate);
    }
  }, [data.arrivalFlightDate, fetchArrivals]);

  // Auto-set drop-off and pick-up times based on selected flights
  useEffect(() => {
    if (data.departureFlightDate && data.departureFlightTime) {
      const dropOff = `${data.departureFlightDate}T${data.departureFlightTime}`;
      if (data.dropOffTime !== dropOff) {
        onUpdate({ dropOffTime: dropOff });
      }
    } else if (data.departureFlightDate) {
      // Default to midnight if no time selected
      const dropOff = `${data.departureFlightDate}T00:00`;
      if (data.dropOffTime !== dropOff) {
        onUpdate({ dropOffTime: dropOff });
      }
    }
  }, [data.departureFlightDate, data.departureFlightTime]);

  useEffect(() => {
    if (data.arrivalFlightDate && data.arrivalFlightTime) {
      const pickUp = `${data.arrivalFlightDate}T${data.arrivalFlightTime}`;
      if (data.pickUpTime !== pickUp) {
        onUpdate({ pickUpTime: pickUp });
      }
    } else if (data.arrivalFlightDate) {
      // Default to 23:59 if no time selected
      const pickUp = `${data.arrivalFlightDate}T23:59`;
      if (data.pickUpTime !== pickUp) {
        onUpdate({ pickUpTime: pickUp });
      }
    }
  }, [data.arrivalFlightDate, data.arrivalFlightTime]);

  // Select a departure flight
  const selectDepartureFlight = (flight: Flight) => {
    onUpdate({
      departureFlightNumber: flight.flightNumber,
      departureFlightTime: flight.time,
    });
  };

  // Select an arrival flight
  const selectArrivalFlight = (flight: Flight) => {
    onUpdate({
      arrivalFlightNumber: flight.flightNumber,
      arrivalFlightTime: flight.time,
    });
  };

  // Check if departure flight info is complete (either selected or manually entered)
  const hasDepartureInfo = data.departureFlightDate && data.departureFlightTime;
  
  // Check if arrival flight info is complete (either selected or manually entered)
  const hasArrivalInfo = data.arrivalFlightDate && data.arrivalFlightTime;

  const canProceed = hasDepartureInfo && hasArrivalInfo;

  // Calculate days between flights
  const calculateDays = () => {
    if (!data.departureFlightDate || !data.arrivalFlightDate) return 0;
    const start = new Date(data.departureFlightDate);
    const end = new Date(data.arrivalFlightDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const days = calculateDays();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{t('step2')}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {locale === 'is'
            ? 'Veldu flugdagsetningar og flug'
            : 'Select your flight dates and flights'}
        </p>
      </div>

      {/* Departure Flight */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-slate-700">
          <PlaneTakeoff className="h-5 w-5 text-green-600" />
          <span className="font-medium">{t('flightOut')}</span>
        </div>

        {/* Date picker */}
        <DatePickerInput
          value={data.departureFlightDate || ''}
          onChange={(date) => {
            onUpdate({ 
              departureFlightDate: date,
              departureFlightNumber: undefined,
              departureFlightTime: undefined,
            });
          }}
          minDate={defaultDate}
          locale={locale}
          label={locale === 'is' ? 'Brottfarardagur' : 'Departure date'}
          required
          icon={<PlaneTakeoff className="h-4 w-4 text-green-500" />}
        />

        {/* Flight selector */}
        {data.departureFlightDate && (
          <FlightSelector
            type="departure"
            flights={departureFlights}
            loading={loadingDepartures}
            isManual={manualDeparture}
            setManual={setManualDeparture}
            selectedFlight={data.departureFlightNumber}
            selectedTime={data.departureFlightTime}
            onSelectFlight={selectDepartureFlight}
            onManualChange={(flightNumber, time) => onUpdate({ 
              departureFlightNumber: flightNumber || undefined,
              departureFlightTime: time || undefined,
            })}
            locale={locale}
            flightNumberLabel={t('flightNumber')}
          />
        )}
      </div>

      {/* Return Flight */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-slate-700">
          <PlaneLanding className="h-5 w-5 text-blue-600" />
          <span className="font-medium">{t('flightIn')}</span>
        </div>

        {/* Date picker */}
        <DatePickerInput
          value={data.arrivalFlightDate || ''}
          onChange={(date) => {
            onUpdate({ 
              arrivalFlightDate: date,
              arrivalFlightNumber: undefined,
              arrivalFlightTime: undefined,
            });
          }}
          minDate={data.departureFlightDate || defaultDate}
          locale={locale}
          label={locale === 'is' ? 'Komudagur' : 'Return date'}
          required
          icon={<PlaneLanding className="h-4 w-4 text-blue-500" />}
        />

        {/* Flight selector */}
        {data.arrivalFlightDate && (
          <FlightSelector
            type="arrival"
            flights={arrivalFlights}
            loading={loadingArrivals}
            isManual={manualArrival}
            setManual={setManualArrival}
            selectedFlight={data.arrivalFlightNumber}
            selectedTime={data.arrivalFlightTime}
            onSelectFlight={selectArrivalFlight}
            onManualChange={(flightNumber, time) => onUpdate({ 
              arrivalFlightNumber: flightNumber || undefined,
              arrivalFlightTime: time || undefined,
            })}
            locale={locale}
            flightNumberLabel={t('flightNumber')}
          />
        )}
      </div>

      {/* Duration Summary */}
      {days > 0 && (
        <div className="rounded-xl bg-primary-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700">
              {locale === 'is' ? 'Bílastæði í:' : 'Parking for:'}
            </span>
            <span className="font-semibold text-primary-900">
              {days} {days === 1 ? (locale === 'is' ? 'dag' : 'day') : (locale === 'is' ? 'daga' : 'days')}
            </span>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl bg-slate-50 p-4 flex gap-3">
        <Info className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-600">
          {locale === 'is' ? (
            <>
              <p className="font-medium text-slate-700 mb-1">Hvernig virkar þetta?</p>
              <p>Skildu bílinn eftir hjá okkur og við skutlum þér að flugstöðinni. Þegar þú lendir aftur sækjum við þig og bíllinn þinn bíður þín.</p>
            </>
          ) : (
            <>
              <p className="font-medium text-slate-700 mb-1">How does it work?</p>
              <p>Leave your car with us and we'll shuttle you to the terminal. When you land, we'll pick you up and your car will be waiting for you.</p>
            </>
          )}
        </div>
      </div>

      {/* Validation message */}
      {(!hasDepartureInfo || !hasArrivalInfo) && (data.departureFlightDate || data.arrivalFlightDate) && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            {locale === 'is' ? (
              <p>
                {!hasDepartureInfo && !hasArrivalInfo 
                  ? 'Vinsamlegast veldu flug eða sláðu inn flugtíma fyrir bæði brottför og komu.'
                  : !hasDepartureInfo 
                    ? 'Vinsamlegast veldu brottfararflug eða sláðu inn flugtíma.'
                    : 'Vinsamlegast veldu komuflug eða sláðu inn flugtíma.'
                }
              </p>
            ) : (
              <p>
                {!hasDepartureInfo && !hasArrivalInfo 
                  ? 'Please select a flight or enter flight time for both departure and return.'
                  : !hasDepartureInfo 
                    ? 'Please select a departure flight or enter the flight time.'
                    : 'Please select a return flight or enter the flight time.'
                }
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeft className="h-4 w-4" />
          {locale === 'is' ? 'Til baka' : 'Back'}
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary btn-lg"
        >
          {t('next')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
