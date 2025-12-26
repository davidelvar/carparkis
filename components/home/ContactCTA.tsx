'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Phone, Mail, MapPin, ArrowRight, CheckCircle2, Award } from 'lucide-react';
import { useSiteSettings } from '@/lib/settings/context';

export default function ContactCTA() {
  const locale = useLocale();
  const { settings } = useSiteSettings();

  return (
    <section className="relative py-24 bg-slate-900">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-400 mb-6">
              <Award className="h-4 w-4" />
              {locale === 'is' ? 'Besta bílastæðið við KEF' : 'Best Parking at KEF'}
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              {locale === 'is' ? 'Tilbúin/n í næstu ferð?' : 'Ready for Your Next Trip?'}
            </h2>
            
            <p className="mt-6 text-lg text-slate-400 max-w-lg">
              {locale === 'is'
                ? 'Bókaðu bílastæði núna og byrjaðu ferðina á réttan hátt. Engin falinn gjöld, ókeypis afbókun.'
                : 'Book your parking now and start your journey right. No hidden fees, free cancellation.'}
            </p>

            {/* Features list */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {[
                { text: locale === 'is' ? 'Engin bókunargjöld' : 'No booking fees' },
                { text: locale === 'is' ? 'Ókeypis afbókun' : 'Free cancellation' },
                { text: locale === 'is' ? '24/7 öryggi' : '24/7 security' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href={`/${locale}/booking`}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-500 hover:shadow-xl"
              >
                {locale === 'is' ? 'Bóka núna' : 'Book Now'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={`tel:${settings.contactPhone}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/20"
              >
                <Phone className="h-4 w-4" />
                {settings.contactPhone}
              </a>
            </div>
          </div>

          {/* Right - Contact card */}
          <div className="relative">
            <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-8">
              <h3 className="text-xl font-bold text-white mb-6">
                {locale === 'is' ? 'Hafðu samband' : 'Get in Touch'}
              </h3>
              
              <div className="space-y-4">
                <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20">
                    <Phone className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{locale === 'is' ? 'Sími' : 'Phone'}</p>
                    <p className="font-semibold text-white group-hover:text-primary-400 transition-colors">{settings.contactPhone}</p>
                  </div>
                </a>
                
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20">
                    <Mail className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{locale === 'is' ? 'Netfang' : 'Email'}</p>
                    <p className="font-semibold text-white group-hover:text-primary-400 transition-colors">{settings.contactEmail}</p>
                  </div>
                </a>
                
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20">
                    <MapPin className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{locale === 'is' ? 'Staðsetning' : 'Location'}</p>
                    <p className="font-semibold text-white">{settings.address || 'Keflavíkurflugvöllur'}</p>
                  </div>
                </div>
              </div>

              {/* Open hours */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{locale === 'is' ? 'Opnunartími' : 'Hours'}</span>
                  <span className="text-white font-semibold">{locale === 'is' ? 'Opið 24/7' : 'Open 24/7'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
