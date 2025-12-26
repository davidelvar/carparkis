'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Car,
  DollarSign,
  Sparkles,
  Calendar,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
  Globe,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/lib/settings/context';
import { signOut } from 'next-auth/react';

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
}

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export default function AdminShell({ children, title }: AdminShellProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const siteName = locale === 'is' ? settings.siteName : settings.siteNameEn;
  
  // Initialize collapsed state from localStorage synchronously to prevent flash
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });

  const toggleCollapsed = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

  const switchLocale = () => {
    const newLocale = locale === 'is' ? 'en' : 'is';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  // Use collapsed directly since we initialize from localStorage
  const isCollapsed = collapsed;

  const navItems = [
    { href: `/${locale}/admin/dashboard`, icon: LayoutDashboard, label: t('dashboard') },
    { href: `/${locale}/admin/bookings`, icon: Calendar, label: t('bookings') },
    { href: `/${locale}/admin/lots`, icon: Car, label: t('lots') },
    { href: `/${locale}/admin/pricing`, icon: DollarSign, label: t('pricing') },
    { href: `/${locale}/admin/services`, icon: Sparkles, label: t('services') },
    { href: `/${locale}/admin/users`, icon: Users, label: t('users') },
    { href: `/${locale}/admin/settings`, icon: Settings, label: t('settings') },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Fixed */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-300 ease-in-out',
          // Mobile: slide in/out, always full width when open
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, width changes based on collapsed
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
          // Mobile width
          'w-72'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-slate-800 flex-shrink-0">
          <div className={cn('flex items-center overflow-hidden', isCollapsed && 'lg:justify-center lg:w-full')}>
            <Car className="h-8 w-8 text-primary-400 flex-shrink-0" />
            <span className={cn(
              'ml-2 text-xl font-bold text-white whitespace-nowrap transition-opacity duration-200',
              isCollapsed && 'lg:opacity-0 lg:w-0 lg:ml-0'
            )}>
              {siteName}
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:bg-slate-700',
                  isCollapsed && 'lg:justify-center lg:px-2',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className={cn(
                  'font-medium whitespace-nowrap transition-opacity duration-200',
                  isCollapsed && 'lg:hidden'
                )}>
                  {item.label}
                </span>
                {!isActive && !isCollapsed && (
                  <ChevronRight className="h-4 w-4 ml-auto opacity-50 hidden lg:block" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex-shrink-0 space-y-2">
          {/* Language switch */}
          <button
            onClick={switchLocale}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors',
              isCollapsed && 'lg:justify-center'
            )}
            title={locale === 'is' ? 'Switch to English' : 'Skipta yfir í íslensku'}
          >
            <Globe className="h-4 w-4 flex-shrink-0" />
            <span className={cn('whitespace-nowrap', isCollapsed && 'lg:hidden')}>
              {locale === 'is' ? 'English' : 'Íslenska'}
            </span>
          </button>

          {/* Collapse toggle - desktop only */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              'hidden lg:flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? (locale === 'is' ? 'Stækka' : 'Expand') : (locale === 'is' ? 'Minnka' : 'Collapse')}
          >
            {isCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>{locale === 'is' ? 'Minnka' : 'Collapse'}</span>
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-800 text-sm transition-colors',
              isCollapsed && 'lg:justify-center'
            )}
            title={locale === 'is' ? 'Útskráning' : 'Sign out'}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className={cn('whitespace-nowrap', isCollapsed && 'lg:hidden')}>
              {locale === 'is' ? 'Útskráning' : 'Sign out'}
            </span>
          </button>

          {/* Back to site */}
          <Link
            href={`/${locale}`}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white text-sm transition-colors',
              isCollapsed && 'lg:justify-center'
            )}
            title={isCollapsed ? (locale === 'is' ? 'Til baka á síðu' : 'Back to site') : undefined}
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" />
            <span className={cn('whitespace-nowrap', isCollapsed && 'lg:hidden')}>
              {locale === 'is' ? 'Til baka' : 'Back to site'}
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content - with left margin to account for fixed sidebar */}
      <div className={cn(
        'transition-all duration-300 ease-in-out min-h-screen',
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
      )}>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{title}</h1>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
