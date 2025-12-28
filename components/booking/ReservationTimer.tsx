'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

interface ReservationTimerProps {
  expiresAt: string | null;
  onExpired: () => void;
  onExtend: () => Promise<void>;
  className?: string;
}

export default function ReservationTimer({
  expiresAt,
  onExpired,
  onExtend,
  className,
}: ReservationTimerProps) {
  const locale = useLocale();
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isExtending, setIsExtending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Calculate remaining seconds from expiresAt
  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const expires = new Date(expiresAt).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((expires - now) / 1000));
    };

    setRemainingSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      // Show warning when under 2 minutes
      if (remaining <= 120 && remaining > 0) {
        setShowWarning(true);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const handleExtend = useCallback(async () => {
    setIsExtending(true);
    try {
      await onExtend();
      setShowWarning(false);
    } finally {
      setIsExtending(false);
    }
  }, [onExtend]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!expiresAt || remainingSeconds <= 0) {
    return null;
  }

  const isUrgent = remainingSeconds <= 60;
  const isWarning = remainingSeconds <= 120;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 transition-all',
        isUrgent
          ? 'bg-red-50 border border-red-200 animate-pulse'
          : isWarning
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-primary-50 border border-primary-200',
        className
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          isUrgent ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-primary-100'
        )}
      >
        {isWarning ? (
          <AlertTriangle
            className={cn('h-5 w-5', isUrgent ? 'text-red-600' : 'text-amber-600')}
          />
        ) : (
          <Clock className="h-5 w-5 text-primary-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold',
            isUrgent ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-primary-700'
          )}
        >
          {locale === 'is' ? 'Pláss frátekið' : 'Spot Reserved'}
        </p>
        <p
          className={cn(
            'text-xs',
            isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-primary-600'
          )}
        >
          {isUrgent
            ? locale === 'is'
              ? 'Ljúktu við bókun áður en tíminn rennur út!'
              : 'Complete booking before time runs out!'
            : locale === 'is'
            ? 'Ljúktu við bókun innan tímans'
            : 'Complete your booking within the time limit'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            'text-2xl font-bold tabular-nums',
            isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-primary-600'
          )}
        >
          {formatTime(remainingSeconds)}
        </div>

        {showWarning && (
          <button
            onClick={handleExtend}
            disabled={isExtending}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              isUrgent
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-amber-600 text-white hover:bg-amber-700',
              isExtending && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('h-4 w-4', isExtending && 'animate-spin')} />
            {locale === 'is' ? 'Framlengja' : 'Extend'}
          </button>
        )}
      </div>
    </div>
  );
}
