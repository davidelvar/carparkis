'use client';

import { useState } from 'react';
import { Delete, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  locale?: string;
}

export default function PinKeypad({ value, onChange, maxLength = 6, locale = 'is' }: PinKeypadProps) {
  const handleDigit = (digit: string) => {
    if (value.length < maxLength) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-4">
      {/* PIN Display */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-10 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-mono transition-all',
              i < value.length
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-slate-200 bg-slate-50'
            )}
          >
            {i < value.length ? '•' : ''}
          </div>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-xl font-semibold text-slate-700 transition-colors"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="h-14 rounded-xl bg-slate-100 hover:bg-red-100 active:bg-red-200 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
        >
          {locale === 'is' ? 'Hreinsa' : 'Clear'}
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-xl font-semibold text-slate-700 transition-colors"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition-colors flex items-center justify-center"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-500 text-center">
        {locale === 'is' ? '4-6 tölustafir' : '4-6 digits'}
      </p>
    </div>
  );
}
