'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ReservationData {
  id: string;
  expiresAt: string;
  remainingSeconds: number;
  bookingData?: unknown;
  startDate?: string;
  endDate?: string;
}

interface UseSpotReservationOptions {
  lotId: string;
  startDate: string;
  endDate: string;
  bookingData?: unknown;
  enabled?: boolean;
}

// Generate or retrieve a persistent session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const STORAGE_KEY = 'kef-reservation-session';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  
  return sessionId;
}

export function useSpotReservation({
  lotId,
  startDate,
  endDate,
  bookingData,
  enabled = true,
}: UseSpotReservationOptions) {
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noSpotsAvailable, setNoSpotsAvailable] = useState(false);
  const sessionIdRef = useRef<string>('');

  // Get session ID on mount
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // Check for existing reservation on mount
  useEffect(() => {
    if (!enabled || !sessionIdRef.current) return;

    const checkExisting = async () => {
      try {
        const res = await fetch(`/api/reservations?sessionId=${sessionIdRef.current}`);
        const data = await res.json();
        
        if (data.success && data.hasReservation) {
          setReservation(data.reservation);
        }
      } catch (err) {
        console.error('Failed to check existing reservation:', err);
      }
    };

    // Small delay to ensure sessionId is set
    const timer = setTimeout(checkExisting, 100);
    return () => clearTimeout(timer);
  }, [enabled]);

  // Create or extend reservation
  const createReservation = useCallback(async () => {
    if (!lotId || !startDate || !endDate) return null;
    
    const sessionId = sessionIdRef.current || getSessionId();
    if (!sessionId) return null;

    setIsLoading(true);
    setError(null);
    setNoSpotsAvailable(false);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          lotId,
          startDate,
          endDate,
          bookingData,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.error === 'no_spots_available') {
          setNoSpotsAvailable(true);
          setError('no_spots_available');
        } else {
          setError(data.error || 'Failed to create reservation');
        }
        return null;
      }

      setReservation(data.reservation);
      return data.reservation;
    } catch (err) {
      console.error('Failed to create reservation:', err);
      setError('network_error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [lotId, startDate, endDate, bookingData]);

  // Extend existing reservation
  const extendReservation = useCallback(async () => {
    return createReservation();
  }, [createReservation]);

  // Release/cancel reservation
  const releaseReservation = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    try {
      await fetch(`/api/reservations?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      setReservation(null);
    } catch (err) {
      console.error('Failed to release reservation:', err);
    }
  }, []);

  // Handle expiration
  const handleExpired = useCallback(() => {
    setReservation(null);
    setError('reservation_expired');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setNoSpotsAvailable(false);
  }, []);

  return {
    reservation,
    isLoading,
    error,
    noSpotsAvailable,
    createReservation,
    extendReservation,
    releaseReservation,
    handleExpired,
    clearError,
    sessionId: sessionIdRef.current,
  };
}
