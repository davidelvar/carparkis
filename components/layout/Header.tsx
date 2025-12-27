'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu, 
  X, 
  Globe, 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard,
  ChevronDown,
  Calendar,
  Shield,
  Headphones,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Info,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/lib/settings/context';
import Logo from '@/components/ui/Logo';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { data: session, status } = useSession();
  const { settings } = useSiteSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const otherLocale = locale === 'is' ? 'en' : 'is';
  const userRole = (session?.user as { role?: string })?.role;
  const siteName = locale === 'is' ? settings.siteName : settings.siteNameEn;

  // Track scroll for header background - initialize on mount
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    // Check initial scroll position
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: `/${locale}` });
  };

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b transition-all duration-300',
      isScrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-sm border-slate-200/50' 
        : 'bg-white border-transparent'
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between py-3">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation - Center (Anchor links) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 rounded-2xl p-1.5">
            <Link
              href={`/${locale}#how-it-works`}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
            >
              <Info className="h-4 w-4" />
              {locale === 'is' ? 'Hvernig virkar' : 'How it works'}
            </Link>
            <Link
              href={`/${locale}#features`}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
            >
              <Sparkles className="h-4 w-4" />
              {locale === 'is' ? 'Þjónusta' : 'Features'}
            </Link>
            <Link
              href={`/${locale}#faq`}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
            >
              <HelpCircle className="h-4 w-4" />
              {locale === 'is' ? 'Spurningar' : 'FAQ'}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
            >
              <Tag className="h-4 w-4" />
              {locale === 'is' ? 'Verðskrá' : 'Pricing'}
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Book Button */}
            <Link
              href={`/${locale}/booking`}
              className="lg:hidden flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-all"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden xs:inline">{locale === 'is' ? 'Bóka' : 'Book'}</span>
            </Link>

            {/* Book & My Bookings - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {session && (
                <Link
                  href={`/${locale}/bookings`}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <Clock className="h-4 w-4" />
                  {t('myBookings')}
                </Link>
              )}
              <Link
                href={`/${locale}/booking`}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 shadow-md shadow-primary-600/25 hover:bg-primary-500 transition-all"
              >
                <Calendar className="h-4 w-4" />
                {t('booking')}
              </Link>
            </div>

            {/* Language Switcher - Pill style */}
            <Link
              href={`/${otherLocale}`}
              className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:scale-105"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{otherLocale}</span>
            </Link>

            {/* User Menu or Login Button */}
            {status === 'loading' ? (
              <div className="h-11 w-28 animate-pulse rounded-2xl bg-slate-100" />
            ) : session ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all',
                    isUserMenuOpen 
                      ? 'bg-slate-100 text-slate-900' 
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700">
                      <User className="h-4 w-4" />
                    </div>
                    {userRole && (userRole === 'ADMIN' || userRole === 'OPERATOR') && (
                      <div className={cn(
                        'absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center',
                        userRole === 'ADMIN' ? 'bg-purple-500' : 'bg-orange-500'
                      )}>
                        <Shield className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="font-semibold text-slate-900 truncate max-w-[100px]">
                      {session.user?.name || session.user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500 -mt-0.5">
                      {userRole === 'ADMIN' 
                        ? (locale === 'is' ? 'Stjórnandi' : 'Admin')
                        : userRole === 'OPERATOR'
                          ? (locale === 'is' ? 'Rekstraraðili' : 'Operator')
                          : (locale === 'is' ? 'Viðskiptavinur' : 'Customer')
                      }
                    </p>
                  </div>
                  <ChevronDown className={cn(
                    'h-4 w-4 text-slate-400 transition-transform',
                    isUserMenuOpen && 'rotate-180'
                  )} />
                </button>

                {/* User Dropdown - Enhanced */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 z-20 mt-3 w-72 rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User header */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {session.user?.name || 'User'}
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {session.user?.email}
                          </p>
                        </div>
                      </div>
                      {userRole && (
                        <div className={cn(
                          'mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full',
                          userRole === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-700' 
                            : userRole === 'OPERATOR' 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-slate-200 text-slate-600'
                        )}>
                          <Shield className="h-3 w-3" />
                          {userRole}
                        </div>
                      )}
                    </div>
                    
                    {/* Menu items */}
                    <div className="p-2">
                      {(userRole === 'OPERATOR' || userRole === 'ADMIN') && (
                        <Link
                          href={`/${locale}/operator/dashboard`}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-orange-50 transition-colors group"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                            <Headphones className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-orange-700">{t('operator')}</p>
                            <p className="text-xs text-orange-600/70">{locale === 'is' ? 'Rekstrarverk' : 'Operations dashboard'}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      )}

                      {userRole === 'ADMIN' && (
                        <Link
                          href={`/${locale}/admin/dashboard`}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-purple-50 transition-colors group"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                            <Settings className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-purple-700">{t('admin')}</p>
                            <p className="text-xs text-purple-600/70">{locale === 'is' ? 'Stjórnborð' : 'Admin dashboard'}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      )}

                      <Link
                        href={`/${locale}/bookings`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors group"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                          <LayoutDashboard className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{t('myBookings')}</p>
                          <p className="text-xs text-slate-500">{locale === 'is' ? 'Skoða og breyta bókunum' : 'View and manage bookings'}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>

                      {/* My Account */}
                      <Link
                        href={`/${locale}/account`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors group"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{locale === 'is' ? 'Reikningurinn minn' : 'My Account'}</p>
                          <p className="text-xs text-slate-500">{locale === 'is' ? 'Stillingar og persónuvernd' : 'Settings & privacy'}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-slate-100 p-2">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <span className="font-semibold">{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:scale-105"
              >
                <User className="h-4 w-4" />
                {t('login')}
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                'lg:hidden rounded-2xl p-3 transition-all',
                isMenuOpen 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Full screen overlay */}
        <div
          className={cn(
            'lg:hidden fixed inset-x-0 top-[72px] bottom-0 bg-white/98 backdrop-blur-xl transition-all duration-300 z-40',
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          )}
        >
          <nav className="flex flex-col p-6 space-y-2">
            {/* Primary action - Book now */}
            <Link
              href={`/${locale}/booking`}
              className="flex items-center justify-center gap-3 rounded-2xl bg-primary-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-primary-600/30 hover:bg-primary-500 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <Calendar className="h-5 w-5" />
              {t('booking')}
            </Link>

            {session && (
              <Link
                href={`/${locale}/bookings`}
                className="flex items-center gap-4 rounded-2xl bg-slate-50 px-5 py-4 text-base font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                {t('myBookings')}
              </Link>
            )}

            <div className="h-px bg-slate-200 my-4" />

            <Link
              href={`/${locale}#how-it-works`}
              className="flex items-center gap-4 rounded-2xl bg-slate-50 px-5 py-4 text-base font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                <Info className="h-5 w-5" />
              </div>
              {locale === 'is' ? 'Hvernig virkar' : 'How it works'}
            </Link>

            <Link
              href={`/${locale}#features`}
              className="flex items-center gap-4 rounded-2xl bg-slate-50 px-5 py-4 text-base font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                <Sparkles className="h-5 w-5" />
              </div>
              {locale === 'is' ? 'Þjónusta' : 'Features'}
            </Link>

            <Link
              href={`/${locale}#faq`}
              className="flex items-center gap-4 rounded-2xl bg-slate-50 px-5 py-4 text-base font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                <HelpCircle className="h-5 w-5" />
              </div>
              {locale === 'is' ? 'Spurningar' : 'FAQ'}
            </Link>

            <Link
              href={`/${locale}/pricing`}
              className="flex items-center gap-4 rounded-2xl bg-slate-50 px-5 py-4 text-base font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                <Tag className="h-5 w-5" />
              </div>
              {locale === 'is' ? 'Verðskrá' : 'Pricing'}
            </Link>

            {(userRole === 'OPERATOR' || userRole === 'ADMIN') && (
              <>
                <div className="h-px bg-slate-200 my-4" />
                <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  {locale === 'is' ? 'Stjórnun' : 'Management'}
                </p>
                <Link
                  href={`/${locale}/operator/dashboard`}
                  className="flex items-center gap-4 rounded-2xl bg-orange-50 px-5 py-4 text-base font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-200 text-orange-600">
                    <Headphones className="h-5 w-5" />
                  </div>
                  {t('operator')}
                </Link>
              </>
            )}

            {userRole === 'ADMIN' && (
              <Link
                href={`/${locale}/admin/dashboard`}
                className="flex items-center gap-4 rounded-2xl bg-purple-50 px-5 py-4 text-base font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-200 text-purple-600">
                  <Settings className="h-5 w-5" />
                </div>
                {t('admin')}
              </Link>
            )}

            {/* Bottom section */}
            <div className="flex-1" />
            
            <div className="pt-4 border-t border-slate-200 space-y-3">
              {session ? (
                <>
                  {/* User info & Account link */}
                  <Link
                    href={`/${locale}/account`}
                    className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {session.user?.name || session.user?.email?.split('@')[0]}
                      </p>
                      <p className="text-sm text-slate-500">{locale === 'is' ? 'Reikningurinn minn' : 'My Account'}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 px-5 py-4 text-base font-semibold text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    {t('logout')}
                  </button>
                </>
              ) : (
                <Link
                  href={`/${locale}/login`}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-lg font-bold text-white shadow-lg hover:bg-slate-800 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  {t('login')}
                </Link>
              )}
              
              {/* Language Switch - Mobile */}
              <Link
                href={`/${otherLocale}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Globe className="h-5 w-5" />
                {otherLocale === 'is' ? 'Íslenska' : 'English'}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
