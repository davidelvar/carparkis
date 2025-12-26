'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, Clock, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import { useSiteSettings } from '@/lib/settings/context';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('common');
  const { settings } = useSiteSettings();
  const siteName = locale === 'is' ? settings.siteName : settings.siteNameEn;

  const quickLinks = [
    { href: `/${locale}/booking`, label: locale === 'is' ? 'Bóka bílastæði' : 'Book Parking' },
    { href: `/${locale}#features`, label: locale === 'is' ? 'Þjónusta' : 'Services' },
    { href: `/${locale}#how-it-works`, label: locale === 'is' ? 'Hvernig virkar' : 'How it Works' },
    { href: `/${locale}#faq`, label: locale === 'is' ? 'Algengar spurningar' : 'FAQ' },
  ];

  const legalLinks = [
    { href: `/${locale}/terms`, label: locale === 'is' ? 'Skilmálar' : 'Terms of Service' },
    { href: `/${locale}/privacy`, label: locale === 'is' ? 'Persónuvernd' : 'Privacy Policy' },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-5">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight flex items-center">
                Car
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary-500 text-white text-xl mx-0.5">
                  P
                </span>
                ark
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                {locale === 'is' ? 'Flugvallabílastæði' : 'Airport Parking'}
              </span>
            </div>
            
            <p className="mt-6 text-slate-400 leading-relaxed max-w-md">
              {locale === 'is'
                ? 'Öruggt og þægilegt bílastæði við Keflavíkurflugvöll. Við sjáum um bílinn þinn á meðan þú ferðast um heiminn.'
                : 'Secure and convenient parking at Keflavík Airport. We take care of your car while you explore the world.'}
            </p>

            {/* Features badges */}
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">
                <Shield className="h-4 w-4 text-primary-400" />
                {locale === 'is' ? '24/7 Öryggi' : '24/7 Security'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">
                <Clock className="h-4 w-4 text-primary-400" />
                {locale === 'is' ? '5 mín í flugstöð' : '5 min to Terminal'}
              </div>
            </div>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-7">
            <div className="grid gap-8 sm:grid-cols-3">
              {/* Quick Links */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  {locale === 'is' ? 'Flýtitenglar' : 'Quick Links'}
                </h3>
                <ul className="mt-4 space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  {locale === 'is' ? 'Hafa samband' : 'Contact'}
                </h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <a
                      href={`tel:${settings.contactPhone}`}
                      className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                        <Phone className="h-4 w-4" />
                      </div>
                      {settings.contactPhone}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                        <Mail className="h-4 w-4" />
                      </div>
                      {settings.contactEmail}
                    </a>
                  </li>
                  <li>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span>{settings.address || 'Keflavíkurflugvöllur'}</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  {locale === 'is' ? 'Tilbúinn?' : 'Ready?'}
                </h3>
                <p className="mt-4 text-sm text-slate-400">
                  {locale === 'is' 
                    ? 'Bókaðu bílastæði á minna en mínútu.' 
                    : 'Book your parking in less than a minute.'}
                </p>
                <Link
                  href={`/${locale}/booking`}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-500 transition-all"
                >
                  {locale === 'is' ? 'Bóka núna' : 'Book Now'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} {siteName}. {locale === 'is' ? 'Allur réttur áskilinn.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
