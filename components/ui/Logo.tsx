'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showSubtitle = true, className }: LogoProps) {
  const locale = useLocale();

  const sizes = {
    sm: {
      text: 'text-xl',
      box: 'h-6 w-6 text-base',
      subtitle: 'text-[9px]',
    },
    md: {
      text: 'text-2xl',
      box: 'h-8 w-8 text-xl',
      subtitle: 'text-[10px]',
    },
    lg: {
      text: 'text-3xl',
      box: 'h-10 w-10 text-2xl',
      subtitle: 'text-xs',
    },
  };

  const s = sizes[size];

  return (
    <Link href={`/${locale}`} className={cn('flex flex-col group', className)}>
      <span className={cn(s.text, 'font-bold text-slate-900 tracking-tight flex items-center')}>
        Car
        <span 
          className={cn(
            s.box,
            'inline-flex items-center justify-center rounded-lg bg-primary-600 text-white mx-0.5 shadow-md shadow-primary-600/25 group-hover:bg-primary-500 transition-colors align-middle'
          )}
        >
          P
        </span>
        ark
      </span>
      {showSubtitle && (
        <span className={cn(s.subtitle, 'font-medium text-slate-400 uppercase tracking-widest')}>
          {locale === 'is' ? 'Flugvallabílastæði' : 'Airport Parking'}
        </span>
      )}
    </Link>
  );
}
