'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { CreditCard, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  disabled?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PaymentButton({
  bookingId,
  amount,
  disabled = false,
  className,
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, locale }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to Rapyd hosted checkout
        window.location.href = result.data.redirectUrl;
        onSuccess?.();
      } else {
        const errorMsg = result.error || (locale === 'is' ? 'Villa við greiðslu' : 'Payment error');
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = locale === 'is' ? 'Villa við tengingu' : 'Connection error';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'is' ? 'is-IS' : 'en-GB', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handlePayment}
        disabled={disabled || isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all',
          'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25',
          'hover:from-primary-500 hover:to-primary-400 hover:shadow-xl hover:shadow-primary-500/30',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg',
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {locale === 'is' ? 'Hleð...' : 'Loading...'}
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            {locale === 'is' ? 'Greiða' : 'Pay'} {formatPrice(amount)}
            <ExternalLink className="h-4 w-4 opacity-50" />
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-center text-xs text-slate-500">
        {locale === 'is' 
          ? 'Þú verður vísað á örugga greiðslusíðu Rapyd'
          : 'You will be redirected to Rapyd secure checkout'}
      </p>
    </div>
  );
}
