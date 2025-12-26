'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search, Car, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn, isValidIcelandicLicensePlate, normalizeLicensePlate } from '@/lib/utils';
import type { BookingData } from '@/app/[locale]/(customer)/booking/page';

interface VehicleStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

interface SavedVehicle {
  id: string;
  licensePlate: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  isElectric: boolean;
  vehicleType: {
    id: string;
    code: string;
    name: string;
    nameEn?: string;
  };
}

const VEHICLE_TYPES = [
  { id: 'small', code: 'small' },
  { id: 'medium', code: 'medium' },
  { id: 'large', code: 'large' },
  { id: 'xlarge', code: 'xlarge' },
];

export default function VehicleStep({ data, onUpdate, onNext }: VehicleStepProps) {
  const t = useTranslations('booking');
  const tv = useTranslations('vehicle');
  const locale = useLocale();

  const [isLooking, setIsLooking] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'not_found'>(
    data.vehicleInfo ? 'found' : 'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  useEffect(() => {
    fetchSavedVehicles();
  }, []);

  const fetchSavedVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles/my-vehicles');
      const result = await response.json();
      if (result.success) {
        setSavedVehicles(result.data);
      }
    } catch (err) {
      // Silently fail - user might not be logged in
    } finally {
      setLoadingSaved(false);
    }
  };

  const selectSavedVehicle = (vehicle: SavedVehicle) => {
    onUpdate({
      licensePlate: vehicle.licensePlate,
      vehicleInfo: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        isElectric: vehicle.isElectric,
      },
      vehicleTypeId: vehicle.vehicleType.code,
    });
    setLookupStatus('found');
    setError(null);
  };

  const handleLicensePlateChange = (value: string) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    onUpdate({ licensePlate: normalized, vehicleInfo: undefined, vehicleTypeId: '' });
    setLookupStatus('idle');
    setError(null);
  };

  const lookupVehicle = async () => {
    if (!data.licensePlate) return;

    if (!isValidIcelandicLicensePlate(data.licensePlate)) {
      setError(locale === 'is' ? 'Ógilt bílnúmer' : 'Invalid license plate');
      return;
    }

    setIsLooking(true);
    setError(null);

    try {
      const response = await fetch(`/api/vehicles/lookup?plate=${data.licensePlate}`);
      const result = await response.json();

      if (result.success && result.data) {
        onUpdate({
          vehicleInfo: {
            make: result.data.make,
            model: result.data.model,
            year: result.data.year,
            color: result.data.color,
            isElectric: result.data.isElectric,
          },
          vehicleTypeId: result.data.vehicleTypeCode,
        });
        setLookupStatus('found');
      } else {
        setLookupStatus('not_found');
      }
    } catch (err) {
      setError(locale === 'is' ? 'Villa við uppflettingu' : 'Lookup failed');
    } finally {
      setIsLooking(false);
    }
  };

  const canProceed = data.licensePlate && data.vehicleTypeId;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{t('step1')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('licensePlateHint')}</p>
      </div>

      {/* Saved Vehicles */}
      {!loadingSaved && savedVehicles.length > 0 && (
        <div>
          <label className="label flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {locale === 'is' ? 'Áður bókaðir bílar' : 'Previously booked vehicles'}
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {savedVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => selectSavedVehicle(vehicle)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                  data.licensePlate === vehicle.licensePlate
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Car className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-semibold text-slate-900">
                    {vehicle.licensePlate}
                  </p>
                  <p className="text-sm text-slate-600 truncate">
                    {vehicle.make} {vehicle.model}
                    {vehicle.isElectric && ' ⚡'}
                  </p>
                </div>
                {data.licensePlate === vehicle.licensePlate && (
                  <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-slate-500">
                {locale === 'is' ? 'eða sláðu inn nýtt' : 'or enter new'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* License Plate Input */}
      <div>
        <label className="label">{t('licensePlate')}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={data.licensePlate}
              onChange={(e) => handleLicensePlateChange(e.target.value)}
              placeholder="ABC123"
              className={cn(
                'input input-lg font-mono text-lg tracking-wider uppercase',
                error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
              )}
              maxLength={7}
            />
            {lookupStatus === 'found' && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success-500" />
            )}
          </div>
          <button
            onClick={lookupVehicle}
            disabled={!data.licensePlate || isLooking}
            className="btn-primary px-6"
          >
            {isLooking ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                {t('lookupVehicle')}
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-danger-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>

      {/* Vehicle Info Card */}
      {lookupStatus === 'found' && data.vehicleInfo && (
        <div className="rounded-xl border border-success-200 bg-success-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
              <Car className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="font-medium text-success-900">
                {data.vehicleInfo.make} {data.vehicleInfo.model}
              </p>
              <p className="text-sm text-success-700">
                {data.vehicleInfo.year} • {data.vehicleInfo.color}
                {data.vehicleInfo.isElectric && ' • ⚡ Rafbíll'}
              </p>
            </div>
          </div>
        </div>
      )}

      {lookupStatus === 'not_found' && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
          <p className="text-sm text-warning-700">
            {locale === 'is'
              ? 'Bíll fannst ekki. Vinsamlegast veldu tegund bíls handvirkt.'
              : 'Vehicle not found. Please select vehicle type manually.'}
          </p>
        </div>
      )}

      {/* Vehicle Type Selection */}
      <div>
        <label className="label">{t('vehicleType')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VEHICLE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => onUpdate({ vehicleTypeId: type.code })}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                data.vehicleTypeId === type.code
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <Car className={cn(
                'transition-transform',
                type.code === 'small' && 'h-6 w-6',
                type.code === 'medium' && 'h-7 w-7',
                type.code === 'large' && 'h-8 w-8',
                type.code === 'xlarge' && 'h-9 w-9',
              )} />
              <span className="text-sm font-medium">{tv(type.code as any)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary btn-lg"
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}
