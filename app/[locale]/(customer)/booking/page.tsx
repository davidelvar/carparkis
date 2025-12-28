'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Plane, Sparkles, CreditCard, Check, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import VehicleStep from '@/components/booking/VehicleStep';
import FlightStep from '@/components/booking/FlightStep';
import AddonsStep from '@/components/booking/AddonsStep';
import SummaryStep from '@/components/booking/SummaryStep';
import ReservationTimer from '@/components/booking/ReservationTimer';
import { useSpotReservation } from '@/hooks/useSpotReservation';

const STEPS = [
  { id: 'vehicle', icon: Car },
  { id: 'flight', icon: Plane },
  { id: 'addons', icon: Sparkles },
  { id: 'summary', icon: CreditCard },
] as const;

type StepId = typeof STEPS[number]['id'];

const STORAGE_KEY = 'kef-booking-draft';

export interface BookingData {
  // Vehicle
  licensePlate: string;
  vehicleTypeId: string;
  vehicleInfo?: {
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    isElectric?: boolean;
  };
  // Flight & Dates
  lotId: string;
  departureFlightNumber?: string;
  departureFlightDate?: string;
  departureFlightTime?: string; // HH:MM format
  arrivalFlightNumber?: string;
  arrivalFlightDate?: string;
  arrivalFlightTime?: string; // HH:MM format
  dropOffTime: string;
  pickUpTime: string;
  // Add-ons
  selectedAddons: string[];
  // Notes
  notes?: string;
  // Guest contact info (for non-logged-in users)
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

interface SavedBookingState {
  data: BookingData;
  step: StepId;
  completedSteps: StepId[];
  savedAt: number;
  reservationSessionId?: string;
}

const initialData: BookingData = {
  licensePlate: '',
  vehicleTypeId: '',
  lotId: '',
  dropOffTime: '',
  pickUpTime: '',
  selectedAddons: [],
};

export default function BookingPage() {
  const t = useTranslations('booking');
  const locale = useLocale();
  const searchParams = useSearchParams();
  
  const [currentStep, setCurrentStep] = useState<StepId>('vehicle');
  const [bookingData, setBookingData] = useState<BookingData>(initialData);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedBooking, setSavedBooking] = useState<SavedBookingState | null>(null);
  const [reservationExpired, setReservationExpired] = useState(false);
  const [defaultLotId, setDefaultLotId] = useState<string>('');

  // Fetch default lot on mount
  useEffect(() => {
    const fetchDefaultLot = async () => {
      try {
        const res = await fetch('/api/lots');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const lotId = data.data[0].id;
          setDefaultLotId(lotId);
          // Set lotId if not already set
          setBookingData(prev => prev.lotId ? prev : { ...prev, lotId });
        }
      } catch (err) {
        console.error('Failed to fetch default lot:', err);
      }
    };
    fetchDefaultLot();
  }, []);

  // Spot reservation hook
  const {
    reservation,
    isLoading: isReservationLoading,
    error: reservationError,
    noSpotsAvailable,
    createReservation,
    extendReservation,
    releaseReservation,
    handleExpired: onReservationExpired,
    clearError: clearReservationError,
  } = useSpotReservation({
    lotId: bookingData.lotId || defaultLotId,
    startDate: bookingData.dropOffTime,
    endDate: bookingData.pickUpTime,
    bookingData,
    enabled: !!(bookingData.dropOffTime && bookingData.pickUpTime && (bookingData.lotId || defaultLotId)),
  });

  // Handle reservation expiration
  const handleReservationExpired = useCallback(() => {
    onReservationExpired();
    setReservationExpired(true);
  }, [onReservationExpired]);

  // Create reservation when dates are set (after flight step)
  useEffect(() => {
    const lotId = bookingData.lotId || defaultLotId;
    if (
      bookingData.dropOffTime &&
      bookingData.pickUpTime &&
      lotId &&
      currentStep !== 'vehicle' &&
      !reservation &&
      !reservationExpired
    ) {
      createReservation();
    }
  }, [bookingData.dropOffTime, bookingData.pickUpTime, bookingData.lotId, defaultLotId, currentStep, reservation, reservationExpired, createReservation]);

  // Check for saved booking on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedBookingState = JSON.parse(saved);
        // Only show if saved within last 24 hours and has meaningful data
        const isRecent = Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000;
        const hasMeaningfulData = parsed.data.licensePlate || parsed.data.dropOffTime;
        
        if (isRecent && hasMeaningfulData) {
          setSavedBooking(parsed);
          setShowResumePrompt(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }, []);

  // Save booking state to localStorage when it changes
  useEffect(() => {
    // Don't save if we're at step 1 with no data
    if (currentStep === 'vehicle' && !bookingData.licensePlate) return;
    
    const state: SavedBookingState = {
      data: bookingData,
      step: currentStep,
      completedSteps: Array.from(completedSteps),
      savedAt: Date.now(),
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore storage errors
    }
  }, [bookingData, currentStep, completedSteps]);

  // Pre-fill dates from query params (from quick booking card)
  useEffect(() => {
    const departure = searchParams.get('departure');
    const returnDate = searchParams.get('return');
    
    if (departure || returnDate) {
      setBookingData(prev => ({
        ...prev,
        departureFlightDate: departure || prev.departureFlightDate,
        dropOffTime: departure || prev.dropOffTime,
        arrivalFlightDate: returnDate || prev.arrivalFlightDate,
        pickUpTime: returnDate || prev.pickUpTime,
      }));
    }
  }, [searchParams]);

  const resumeBooking = () => {
    if (savedBooking) {
      setBookingData(savedBooking.data);
      setCurrentStep(savedBooking.step);
      setCompletedSteps(new Set(savedBooking.completedSteps));
    }
    setShowResumePrompt(false);
  };

  const startFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowResumePrompt(false);
    setSavedBooking(null);
  };

  // Clear storage after successful booking
  const clearSavedBooking = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(STEPS[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Resume Booking Prompt */}
        <AnimatePresence>
          {showResumePrompt && savedBooking && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shrink-0">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {locale === 'is' ? 'Halda áfram með bókunina?' : 'Resume your booking?'}
                  </h3>
                  <p className="text-sm text-primary-100 mt-1">
                    {locale === 'is' 
                      ? <>Þú varst að bóka fyrir <span className="font-bold text-white">{savedBooking.data.licensePlate || 'ökutæki'}</span>. Viltu halda áfram þar sem frá var horfið?</>
                      : <>You were booking for <span className="font-bold text-white">{savedBooking.data.licensePlate || 'a vehicle'}</span>. Would you like to continue where you left off?</>
                    }
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={resumeBooking}
                      className="px-4 py-2 rounded-lg bg-white text-primary-700 font-medium text-sm hover:bg-primary-50 transition-colors"
                    >
                      {locale === 'is' ? 'Halda áfram' : 'Resume'}
                    </button>
                    <button
                      onClick={startFresh}
                      className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors"
                    >
                      {locale === 'is' ? 'Byrja upp á nýtt' : 'Start fresh'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowResumePrompt(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reservation Expired Warning */}
        <AnimatePresence>
          {reservationExpired && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-700">
                    {locale === 'is' ? 'Frátekning rann út' : 'Reservation Expired'}
                  </h3>
                  <p className="text-sm text-red-600 mt-1">
                    {locale === 'is'
                      ? 'Plássið þitt var ekki lengur frátekið. Smelltu á "Endurnýja frátekningu" til að halda áfram.'
                      : 'Your spot is no longer reserved. Click "Renew reservation" to continue.'}
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={async () => {
                        setReservationExpired(false);
                        clearReservationError();
                        await createReservation();
                      }}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors"
                    >
                      {locale === 'is' ? 'Endurnýja frátekningu' : 'Renew reservation'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setReservationExpired(false)}
                  className="p-1 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <X className="h-5 w-5 text-red-600" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Spots Available Warning */}
        <AnimatePresence>
          {noSpotsAvailable && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-700">
                    {locale === 'is' ? 'Engin pláss laus' : 'No Spots Available'}
                  </h3>
                  <p className="text-sm text-amber-600 mt-1">
                    {locale === 'is'
                      ? 'Því miður eru engin pláss laus fyrir valdar dagsetningar. Vinsamlegast veldu aðrar dagsetningar.'
                      : 'Unfortunately, no spots are available for the selected dates. Please choose different dates.'}
                  </p>
                </div>
                <button
                  onClick={clearReservationError}
                  className="p-1 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <X className="h-5 w-5 text-amber-600" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reservation Timer */}
        {reservation && currentStep !== 'vehicle' && (
          <div className="mb-6">
            <ReservationTimer
              expiresAt={reservation.expiresAt}
              onExpired={handleReservationExpired}
              onExtend={extendReservation}
            />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{t('title')}</h1>
          <p className="mt-2 text-slate-600">{t('subtitle')}</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = completedSteps.has(step.id);
              const isPast = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => (isCompleted || isPast) && goToStep(step.id)}
                      disabled={!isCompleted && !isPast && !isActive}
                      className={cn(
                        'relative flex h-12 w-12 items-center justify-center rounded-full transition-all',
                        isActive && 'bg-primary-600 text-white shadow-lg shadow-primary-600/30',
                        isCompleted && 'bg-primary-600 text-white',
                        !isActive && !isCompleted && 'bg-slate-200 text-slate-500',
                        (isCompleted || isPast) && 'cursor-pointer hover:opacity-80'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </button>
                    <span className="mt-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {t(`step${index + 1}` as any)}
                    </span>
                  </div>

                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'h-1 flex-1 mx-2 rounded-full transition-colors self-start mt-6',
                        index < currentStepIndex ? 'bg-primary-600' : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="card">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 'vehicle' && (
                <VehicleStep
                  data={bookingData}
                  onUpdate={updateData}
                  onNext={nextStep}
                />
              )}
              {currentStep === 'flight' && (
                <FlightStep
                  data={bookingData}
                  onUpdate={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                />
              )}
              {currentStep === 'addons' && (
                <AddonsStep
                  data={bookingData}
                  onUpdate={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                />
              )}
              {currentStep === 'summary' && (
                <SummaryStep
                  data={bookingData}
                  onBack={prevStep}
                  onUpdate={updateData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
