'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Clock, Shield, Truck, Star, type LucideIcon } from 'lucide-react';

interface StatItem {
  value: string;
  suffix: string;
  label: string;
  icon: LucideIcon;
  isRating?: boolean;
}

export default function StatsBar() {
  const locale = useLocale();
  const [googleRating, setGoogleRating] = useState<string>('4.9');
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const response = await fetch('/api/google-rating');
        const data = await response.json();
        if (data.success && data.rating) {
          setGoogleRating(data.rating.toFixed(1));
          setReviewCount(data.reviewCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch Google rating:', error);
      }
    };
    fetchRating();
  }, []);

  const stats: StatItem[] = [
    { value: '3', suffix: ' mín', label: locale === 'is' ? 'Skráningartími' : 'Check-in Time', icon: Clock },
    { value: '100%', suffix: '', label: locale === 'is' ? 'Tryggð bílastæði' : 'Secure Parking', icon: Shield },
    { value: locale === 'is' ? 'Ókeypis' : 'Free', suffix: '', label: locale === 'is' ? 'Skutluþjónusta' : 'Shuttle Service', icon: Truck },
    { value: googleRating, suffix: '', label: 'Google', icon: Star, isRating: true },
  ];

  return (
    <section className="relative z-10 -mt-8 pb-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
            {stats.map((stat, i) => (
              <div key={i} className="px-4 sm:px-6 py-5 sm:py-6 text-center group">
                <div className="flex items-center justify-center gap-2">
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.isRating ? 'text-yellow-500 fill-yellow-500' : 'text-primary-500'}`} />
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-br from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    {stat.value}{stat.suffix}
                  </p>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                  {stat.label}
                  {stat.isRating && reviewCount > 0 && (
                    <span className="text-slate-400 ml-1">({reviewCount}+)</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
