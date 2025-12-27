'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { X, Loader2, Car, User, Calendar, Search, AlertCircle, CheckCircle, Clock, PlaneTakeoff, PlaneLanding, Plane } from 'lucide-react';
import { cn, formatPrice, isValidIcelandicLicensePlate, normalizeLicensePlate } from '@/lib/utils';
import DatePickerInput from '@/components/ui/DatePickerInput';
import FlightSelector, { type Flight } from '@/components/ui/FlightSelector';

interface VehicleType {
  id: string;
  name: string;
  nameEn: string;
  code: string;
}

interface LotInfo {
  id: string;
  name: string;
  nameEn: string;
}

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualBookingModal({ isOpen, onClose, onSuccess }: ManualBookingModalProps) {
  const locale = useLocale();
  
  // Form state
  const [licensePlate, setLicensePlate] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [dropOffDate, setDropOffDate] = useState('');
  const [dropOffTime, setDropOffTime] = useState('');
  const [pickUpDate, setPickUpDate] = useState('');
  const [pickUpTime, setPickUpTime] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureFlightTime, setDepartureFlightTime] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalFlightTime, setArrivalFlightTime] = useState('');
  const [notes, setNotes] = useState('');
  
  // Flight lookup state
  const [departureFlights, setDepartureFlights] = useState<Flight[]>([]);
  const [arrivalFlights, setArrivalFlights] = useState<Flight[]>([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [manualDeparture, setManualDeparture] = useState(false);
  const [manualArrival, setManualArrival] = useState(false);
  
  // Vehicle lookup state
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [vehicleLookupError, setVehicleLookupError] = useState<string | null>(null);
  
  // Customer lookup state
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<{ name: string; phone: string } | null>(null);
  
  // Lot and pricing
  const [lot, setLot] = useState<LotInfo | null>(null);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [selectedVehicleTypeCode, setSelectedVehicleTypeCode] = useState<string>('');
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState<string>('');
  const [pricing, setPricing] = useState<any>(null);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Initialize dates to today
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);
      setDropOffDate(today);
      setDropOffTime(currentTime);
      
      // Default pickup to tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPickUpDate(tomorrow.toISOString().split('T')[0]);
      setPickUpTime('12:00');
    }
  }, [isOpen]);
  
  // Fetch lot and vehicle types on mount
  useEffect(() => {
    if (isOpen) {
      fetchLotAndTypes();
    }
  }, [isOpen]);
  
  const fetchLotAndTypes = async () => {
    try {
      const [lotsRes, vehicleTypesRes] = await Promise.all([
        fetch('/api/lots'),
        fetch('/api/admin/pricing/vehicle-types'),
      ]);
      
      const lotsData = await lotsRes.json();
      const vehicleTypesData = await vehicleTypesRes.json();
      
      if (lotsData.success && lotsData.data.length > 0) {
        setLot(lotsData.data[0]);
      }
      
      if (vehicleTypesData.success && vehicleTypesData.data) {
        setVehicleTypes(vehicleTypesData.data);
        if (vehicleTypesData.data.length > 0) {
          setSelectedVehicleTypeCode(vehicleTypesData.data[0].code);
          setSelectedVehicleTypeId(vehicleTypesData.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch lot info:', err);
    }
  };
  
  // Look up vehicle from Samgöngustofa
  const lookupVehicle = async () => {
    if (!licensePlate) return;
    
    const normalized = normalizeLicensePlate(licensePlate);
    if (!isValidIcelandicLicensePlate(normalized)) {
      setVehicleLookupError(locale === 'is' ? 'Ógilt bílnúmer' : 'Invalid license plate');
      return;
    }
    
    setIsLookingUp(true);
    setVehicleLookupError(null);
    setVehicleInfo(null);
    
    try {
      const response = await fetch(`/api/vehicles/lookup?plate=${normalized}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setVehicleInfo(data.data);
        // Auto-select vehicle type if available
        const vehicleTypeCode = data.data.vehicleTypeCode || data.data.vehicleType?.code;
        if (vehicleTypeCode) {
          setSelectedVehicleTypeCode(vehicleTypeCode);
          // Find the matching vehicle type to get its ID
          const matchingType = vehicleTypes.find(t => t.code === vehicleTypeCode);
          if (matchingType) {
            setSelectedVehicleTypeId(matchingType.id);
          }
        }
      } else {
        setVehicleLookupError(data.error || (locale === 'is' ? 'Ökutæki fannst ekki' : 'Vehicle not found'));
      }
    } catch (err) {
      setVehicleLookupError(locale === 'is' ? 'Villa við uppflettingu' : 'Lookup failed');
    } finally {
      setIsLookingUp(false);
    }
  };
  
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
    if (dropOffDate) {
      fetchDepartures(dropOffDate);
    }
  }, [dropOffDate, fetchDepartures]);

  useEffect(() => {
    if (pickUpDate) {
      fetchArrivals(pickUpDate);
    }
  }, [pickUpDate, fetchArrivals]);
  
  // Calculate pricing
  useEffect(() => {
    if (lot && selectedVehicleTypeId && dropOffDate && dropOffTime && pickUpDate && pickUpTime) {
      calculatePricing();
    }
  }, [lot, selectedVehicleTypeId, dropOffDate, dropOffTime, pickUpDate, pickUpTime]);
  
  const calculatePricing = async () => {
    if (!lot || !selectedVehicleTypeId) return;
    
    try {
      const dropOff = new Date(`${dropOffDate}T${dropOffTime}`);
      const pickUp = new Date(`${pickUpDate}T${pickUpTime}`);
      
      const response = await fetch('/api/admin/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotId: lot.id,
          vehicleTypeId: selectedVehicleTypeId,
          dropOffTime: dropOff.toISOString(),
          pickUpTime: pickUp.toISOString(),
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setPricing(data.data);
      }
    } catch (err) {
      console.error('Failed to calculate pricing:', err);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const dropOff = new Date(`${dropOffDate}T${dropOffTime}`);
      const pickUp = new Date(`${pickUpDate}T${pickUpTime}`);
      
      // Calculate days
      const diffMs = pickUp.getTime() - dropOff.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      let totalDays = Math.ceil(diffHours / 24);
      if (totalDays < 1) totalDays = 1;
      
      // Use pricing if calculated, otherwise default values
      const basePricePerDay = pricing?.pricePerDay || 0;
      const baseTotal = pricing?.basePrice || 0;
      const totalPrice = pricing?.totalPrice || 0;
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotId: lot?.id,
          vehicleTypeId: selectedVehicleTypeCode, // API expects code, not id
          licensePlate: normalizeLicensePlate(licensePlate),
          guestName,
          guestEmail: guestEmail || undefined,
          guestPhone: guestPhone || undefined,
          dropOffTime: dropOff.toISOString(),
          pickUpTime: pickUp.toISOString(),
          departureFlightNumber: departureFlightNumber || undefined,
          departureFlightDate: dropOffDate || undefined,
          arrivalFlightNumber: arrivalFlightNumber || undefined,
          arrivalFlightDate: pickUpDate || undefined,
          notes,
          totalDays,
          basePricePerDay,
          baseTotal,
          addonsTotal: 0,
          totalPrice,
          selectedAddons: [],
          locale,
          vehicleInfo: vehicleInfo ? {
            make: vehicleInfo.make,
            model: vehicleInfo.model,
            year: vehicleInfo.year,
            color: vehicleInfo.color,
            isElectric: vehicleInfo.isElectric,
          } : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update booking status to CHECKED_IN since this is a walk-in
        const bookingId = data.data.id;
        await fetch(`/api/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CHECKED_IN' }),
        });
        
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          resetForm();
          onClose();
        }, 1500);
      } else {
        setError(data.error || (locale === 'is' ? 'Villa við bókun' : 'Booking failed'));
      }
    } catch (err) {
      setError(locale === 'is' ? 'Villa við bókun' : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setLicensePlate('');
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setDepartureFlightNumber('');
    setDepartureFlightTime('');
    setArrivalFlightNumber('');
    setArrivalFlightTime('');
    setDepartureFlights([]);
    setArrivalFlights([]);
    setManualDeparture(false);
    setManualArrival(false);
    setNotes('');
    setVehicleInfo(null);
    setVehicleLookupError(null);
    setExistingCustomer(null);
    setPricing(null);
    setError(null);
    setSuccess(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#255da0] to-[#1e4d85] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {locale === 'is' ? 'Ný bókun' : 'New Walk-in Booking'}
            </h2>
            <p className="text-white/70 text-xs sm:text-sm hidden sm:block">
              {locale === 'is' ? 'Skráðu viðskiptavin sem mætir á staðinn' : 'Register a customer who arrives on site'}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {success ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">
              {locale === 'is' ? 'Bókun stofnuð!' : 'Booking Created!'}
            </h3>
            <p className="text-slate-500 mt-1">
              {locale === 'is' ? 'Bíllinn hefur verið innritaður' : 'Vehicle has been checked in'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                {/* Left Column - Vehicle & Customer */}
                <div className="space-y-3 sm:space-y-6">
                  {/* Vehicle Section */}
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-5">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3 sm:mb-4">
                      <Car className="h-4 w-4 text-[#255da0]" />
                      {locale === 'is' ? 'Ökutæki' : 'Vehicle'}
                    </h3>
                    
                    <div className="space-y-3">
                      {/* License Plate with Lookup */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                          {locale === 'is' ? 'Bílnúmer' : 'License Plate'} *
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                            placeholder="ABC123"
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#255da0] focus:border-transparent font-mono text-base sm:text-lg tracking-wider"
                            required
                          />
                          <button
                            type="button"
                            onClick={lookupVehicle}
                            disabled={isLookingUp || !licensePlate}
                            className="px-3 sm:px-4 py-2 sm:py-3 bg-[#255da0] text-white rounded-xl hover:bg-[#1e4d85] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap text-sm sm:text-base"
                          >
                            {isLookingUp ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Search className="h-5 w-5" />
                            )}
                            {locale === 'is' ? 'Fletta upp' : 'Lookup'}
                          </button>
                        </div>
                        {vehicleLookupError && (
                          <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {vehicleLookupError}
                          </p>
                        )}
                      </div>
                      
                      {/* Vehicle Info (if found) */}
                      {vehicleInfo && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-green-700 font-medium mb-1 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            {locale === 'is' ? 'Ökutæki fannst' : 'Vehicle Found'}
                          </div>
                          <p className="text-slate-700 text-sm">
                            {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.year && `(${vehicleInfo.year})`}
                            {vehicleInfo.color && ` • ${vehicleInfo.color}`}
                            {vehicleInfo.isElectric && ' • ⚡'}
                          </p>
                        </div>
                      )}
                      
                      {/* Vehicle Type Selection - Card Style */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          {locale === 'is' ? 'Tegund ökutækis' : 'Vehicle Type'} *
                        </label>
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                          {vehicleTypes.map((type) => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                setSelectedVehicleTypeId(type.id);
                                setSelectedVehicleTypeCode(type.code);
                              }}
                              className={cn(
                                'flex flex-col items-center gap-1 sm:gap-2 rounded-xl border-2 p-2 sm:p-3 transition-all',
                                selectedVehicleTypeId === type.id
                                  ? 'border-[#255da0] bg-blue-50 text-[#255da0]'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
                              )}
                            >
                              <Car className={cn(
                                'transition-transform',
                                type.code === 'small' && 'h-5 w-5',
                                type.code === 'medium' && 'h-6 w-6',
                                type.code === 'large' && 'h-7 w-7',
                                type.code === 'xlarge' && 'h-8 w-8',
                                !['small', 'medium', 'large', 'xlarge'].includes(type.code) && 'h-6 w-6'
                              )} />
                              <span className="text-xs font-medium text-center">
                                {locale === 'is' ? type.name : type.nameEn}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Section */}
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-5">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3 sm:mb-4">
                      <User className="h-4 w-4 text-[#255da0]" />
                      {locale === 'is' ? 'Viðskiptavinur' : 'Customer'}
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                          {locale === 'is' ? 'Netfang' : 'Email'}
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => {
                              setGuestEmail(e.target.value);
                              setExistingCustomer(null);
                            }}
                            onBlur={async () => {
                              if (guestEmail && guestEmail.includes('@')) {
                                setIsLookingUpCustomer(true);
                                try {
                                  const res = await fetch(`/api/customers/lookup?email=${encodeURIComponent(guestEmail)}`);
                                  const data = await res.json();
                                  if (data.success && data.data) {
                                    setExistingCustomer(data.data);
                                    if (data.data.name && !guestName) setGuestName(data.data.name);
                                    if (data.data.phone && !guestPhone) setGuestPhone(data.data.phone);
                                  }
                                } catch (err) {
                                  // Ignore lookup errors
                                } finally {
                                  setIsLookingUpCustomer(false);
                                }
                              }
                            }}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#255da0] focus:border-transparent text-sm sm:text-base"
                            placeholder="email@example.com"
                          />
                          {isLookingUpCustomer && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            </div>
                          )}
                        </div>
                        {existingCustomer && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {locale === 'is' ? 'Viðskiptavinur fundinn - upplýsingar fylltar út' : 'Customer found - info auto-filled'}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                            {locale === 'is' ? 'Nafn' : 'Name'} *
                          </label>
                          <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#255da0] focus:border-transparent text-sm sm:text-base"
                            placeholder={locale === 'is' ? 'Fullt nafn' : 'Full name'}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                            {locale === 'is' ? 'Sími' : 'Phone'}
                          </label>
                          <input
                            type="tel"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#255da0] focus:border-transparent text-sm sm:text-base"
                            placeholder="+354 xxx xxxx"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Dates & Summary */}
                <div className="space-y-3 sm:space-y-6">
                  {/* Dates Section */}
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-5">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3 sm:mb-4">
                      <Plane className="h-4 w-4 text-[#255da0]" />
                      {locale === 'is' ? 'Flug og dagsetningar' : 'Flights & Dates'}
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Departure / Drop-off */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-700">
                          <PlaneTakeoff className="h-4 w-4 text-green-600" />
                          <span className="text-xs sm:text-sm font-medium">
                            {locale === 'is' ? 'Brottför' : 'Departure'}
                          </span>
                        </div>
                        
                        <DatePickerInput
                          value={dropOffDate}
                          onChange={setDropOffDate}
                          minDate={new Date().toISOString().split('T')[0]}
                          locale={locale}
                          placeholder={locale === 'is' ? 'Veldu dag' : 'Select date'}
                        />
                        
                        <FlightSelector
                          type="departure"
                          flights={departureFlights}
                          loading={loadingDepartures}
                          isManual={manualDeparture}
                          setManual={setManualDeparture}
                          selectedFlight={departureFlightNumber}
                          selectedTime={departureFlightTime || dropOffTime}
                          onSelectFlight={(flight) => {
                            setDepartureFlightNumber(flight.flightNumber);
                            setDepartureFlightTime(flight.time);
                            setDropOffTime(flight.time);
                          }}
                          onManualChange={(flightNumber, time) => {
                            setDepartureFlightNumber(flightNumber);
                            setDepartureFlightTime(time);
                            if (time) setDropOffTime(time);
                          }}
                          locale={locale}
                          flightNumberLabel={locale === 'is' ? 'Flugnúmer' : 'Flight number'}
                          compact
                        />
                      </div>
                      
                      {/* Arrival / Pick-up */}
                      <div className="space-y-2 pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-slate-700">
                          <PlaneLanding className="h-4 w-4 text-blue-600" />
                          <span className="text-xs sm:text-sm font-medium">
                            {locale === 'is' ? 'Koma' : 'Arrival'}
                          </span>
                        </div>
                        
                        <DatePickerInput
                          value={pickUpDate}
                          onChange={setPickUpDate}
                          minDate={dropOffDate || new Date().toISOString().split('T')[0]}
                          locale={locale}
                          placeholder={locale === 'is' ? 'Veldu dag' : 'Select date'}
                        />
                        
                        <FlightSelector
                          type="arrival"
                          flights={arrivalFlights}
                          loading={loadingArrivals}
                          isManual={manualArrival}
                          setManual={setManualArrival}
                          selectedFlight={arrivalFlightNumber}
                          selectedTime={arrivalFlightTime || pickUpTime}
                          onSelectFlight={(flight) => {
                            setArrivalFlightNumber(flight.flightNumber);
                            setArrivalFlightTime(flight.time);
                            setPickUpTime(flight.time);
                          }}
                          onManualChange={(flightNumber, time) => {
                            setArrivalFlightNumber(flightNumber);
                            setArrivalFlightTime(time);
                            if (time) setPickUpTime(time);
                          }}
                          locale={locale}
                          flightNumberLabel={locale === 'is' ? 'Flugnúmer' : 'Flight number'}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-5">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                      {locale === 'is' ? 'Athugasemdir' : 'Notes'}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#255da0] focus:border-transparent resize-none text-sm sm:text-base"
                      placeholder={locale === 'is' ? 'Valfrjálsar athugasemdir...' : 'Optional notes...'}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer with Pricing & Submit */}
            <div className="sticky bottom-0 bg-gradient-to-r from-[#255da0] to-[#1e4d85] px-3 sm:px-6 py-3 sm:py-4">
              {/* Error Message */}
              {error && (
                <div className="mb-2 sm:mb-3 flex items-center gap-2 p-2 sm:p-3 rounded-xl bg-red-500/20 border border-red-300/30 text-white text-xs sm:text-sm">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="flex items-center justify-between gap-3">
                {/* Pricing Summary - Left side */}
                <div className="flex-1">
                  {pricing ? (
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-white">
                        <p className="text-xs sm:text-sm text-white/70">
                          {pricing.totalDays} {pricing.totalDays === 1 
                            ? (locale === 'is' ? 'dagur' : 'day')
                            : (locale === 'is' ? 'dagar' : 'days')} × {formatPrice(pricing.pricePerDay, locale)}
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                          {formatPrice(pricing.totalPrice, locale)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/60 text-xs sm:text-sm">
                      {locale === 'is' ? 'Veldu ökutæki og dagsetningar' : 'Select vehicle and dates'}
                    </p>
                  )}
                </div>
                
                {/* Buttons - Right side */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { resetForm(); onClose(); }}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors text-sm"
                  >
                    {locale === 'is' ? 'Hætta við' : 'Cancel'}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !licensePlate || !guestName || !selectedVehicleTypeId}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-white text-[#255da0] font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span className="hidden sm:inline">{locale === 'is' ? 'Stofna...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>{locale === 'is' ? 'Stofna' : 'Create'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
