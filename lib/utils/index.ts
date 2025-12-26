import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nanoid } from 'nanoid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert short locale codes to BCP 47 format
function toLocaleTag(locale: string): string {
  const localeMap: Record<string, string> = {
    'is': 'is-IS',
    'en': 'en-US',
  };
  return localeMap[locale] || locale;
}

export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const id = nanoid(6).toUpperCase();
  return `KEF-${year}-${id}`;
}

export function formatPrice(amount: number, locale: string = 'is'): string {
  // Use consistent formatting to avoid hydration mismatch between server/client
  const formatted = amount.toLocaleString('de-DE'); // Always use dot as thousand separator
  if (locale === 'is') {
    return `${formatted} kr.`;
  }
  return `ISK ${formatted}`;
}

export function formatDate(date: Date | string, locale: string = 'is'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(toLocaleTag(locale), {
    dateStyle: 'medium',
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: string = 'is'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(toLocaleTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function formatTime(date: Date | string, locale: string = 'is'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(toLocaleTag(locale), {
    timeStyle: 'short',
  }).format(d);
}

export function calculateDays(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export function isValidIcelandicLicensePlate(plate: string): boolean {
  // Icelandic plates: 2-3 letters followed by 1-3 digits, or newer format
  const patterns = [
    /^[A-Z]{2,3}[0-9]{1,3}$/i,     // Traditional: AB123, ABC12
    /^[A-Z]{2}[A-Z][0-9]{2}$/i,    // Newer: ABX12
  ];
  const normalized = plate.replace(/[\s-]/g, '').toUpperCase();
  return patterns.some(p => p.test(normalized));
}

export function normalizeLicensePlate(plate: string): string {
  return plate.replace(/[\s-]/g, '').toUpperCase();
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}
