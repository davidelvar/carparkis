'use client';

import { useLocale } from 'next-intl';
import { useSiteSettings } from '@/lib/settings/context';

export default function FAQContactLink() {
  const locale = useLocale();
  const { settings } = useSiteSettings();

  return (
    <div className="mt-12 text-center">
      <p className="text-slate-500">
        {locale === 'is' ? 'Finnur ekki svarið? ' : "Can't find the answer? "}
        <a href={`mailto:${settings.contactEmail}`} className="text-primary-600 font-semibold hover:underline">
          {locale === 'is' ? 'Hafðu samband' : 'Contact us'}
        </a>
      </p>
    </div>
  );
}
