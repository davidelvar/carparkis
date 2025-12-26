'use client';

import { useLocale } from 'next-intl';
import { MapPin, Navigation, Clock, Phone } from 'lucide-react';
import { useSiteSettings } from '@/lib/settings/context';

export default function LocationMap() {
  const locale = useLocale();
  const { settings } = useSiteSettings();

  // CarPark address for map embed
  const address = settings.address || 'Grænásvegur 10, 230 Keflavík, Iceland';
  const encodedAddress = encodeURIComponent(address);
  
  return (
    <section className="relative bg-slate-100">
      <div className="grid lg:grid-cols-2 min-h-[500px]">
        {/* Map */}
        <div className="relative h-[350px] lg:h-auto lg:min-h-full">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=15`}
            width="100%"
            height="100%"
            style={{ border: 0, position: 'absolute', inset: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="CarPark Location"
            className="grayscale hover:grayscale-0 transition-all duration-500"
          />
          
          {/* Overlay gradient on mobile */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-transparent to-transparent lg:hidden pointer-events-none" />
        </div>

        {/* Info panel */}
        <div className="relative flex items-center">
          <div className="w-full px-6 py-12 lg:px-12 lg:py-16">
            <div className="max-w-md">
              <h2 className="text-3xl font-bold text-slate-900">
                {locale === 'is' ? 'Finndu okkur' : 'Find Us'}
              </h2>
              <p className="mt-4 text-slate-600">
                {locale === 'is'
                  ? 'Við erum staðsett rétt við Keflavíkurflugvöll, aðeins 5 mínútur frá flugstöðinni.'
                  : 'We are located right by Keflavík Airport, just 5 minutes from the terminal.'}
              </p>

              <div className="mt-8 space-y-4">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                    <MapPin className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {locale === 'is' ? 'Heimilisfang' : 'Address'}
                    </p>
                    <p className="text-slate-600">{settings.address || 'Keflavíkurflugvöllur, 235 Reykjanesbær'}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                    <Phone className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {locale === 'is' ? 'Sími' : 'Phone'}
                    </p>
                    <a href={`tel:${settings.contactPhone}`} className="text-primary-600 hover:underline">
                      {settings.contactPhone}
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                    <Clock className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {locale === 'is' ? 'Opnunartími' : 'Opening Hours'}
                    </p>
                    <p className="text-slate-600">
                      {locale === 'is' ? 'Opið allan sólarhringinn, alla daga' : 'Open 24 hours, every day'}
                    </p>
                  </div>
                </div>

                {/* Directions */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                    <Navigation className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {locale === 'is' ? 'Leiðbeiningar' : 'Directions'}
                    </p>
                    <p className="text-slate-600">
                      {locale === 'is' 
                        ? '5 mínútna akstur frá flugstöð. Ókeypis skutla innifalin.'
                        : '5 minute drive from terminal. Free shuttle included.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Get directions button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-500 transition-all"
              >
                <Navigation className="h-4 w-4" />
                {locale === 'is' ? 'Opna í Google Maps' : 'Open in Google Maps'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
