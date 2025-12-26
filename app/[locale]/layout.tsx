import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n/config';
import { auth } from '@/lib/auth/config';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import AuthProvider from '@/components/providers/AuthProvider';
import { SiteSettingsProvider } from '@/lib/settings/context';
import { ToastProvider } from '@/components/ui/Toast';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const [messages, session] = await Promise.all([
    getMessages(),
    auth(),
  ]);

  return (
    <AuthProvider session={session}>
      <NextIntlClientProvider messages={messages}>
        <SiteSettingsProvider>
          <ToastProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ToastProvider>
        </SiteSettingsProvider>
      </NextIntlClientProvider>
    </AuthProvider>
  );
}
