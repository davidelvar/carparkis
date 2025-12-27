'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, getSession, useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Mail, Loader2, CheckCircle, AlertCircle, Car, Shield, ArrowLeft, Sparkles, Lock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type LoginMode = 'customer' | 'staff';

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const { data: session, status } = useSession();
  const hasRedirected = useRef(false);

  const [loginMode, setLoginMode] = useState<LoginMode>('customer');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle error from URL query params (when redirect: true is used)
  useEffect(() => {
    if (error) {
      const errorMap: Record<string, string> = {
        'CredentialsSignin': locale === 'is' ? 'Rangt netfang eða PIN' : 'Invalid email or PIN',
        'OAuthSignin': locale === 'is' ? 'Villa við innskráningu' : 'Error signing in',
        'OAuthCallback': locale === 'is' ? 'Villa við innskráningu' : 'Error signing in',
        'OAuthCreateAccount': locale === 'is' ? 'Villa við að búa til aðgang' : 'Error creating account',
        'EmailCreateAccount': locale === 'is' ? 'Villa við að búa til aðgang' : 'Error creating account',
        'Callback': locale === 'is' ? 'Villa við innskráningu' : 'Error signing in',
        'Default': locale === 'is' ? 'Villa við innskráningu' : 'Error signing in',
      };
      setErrorMessage(errorMap[error] || errorMap['Default']);
      setLoginMode('staff'); // Show staff form if there was a PIN error
    }
  }, [error, locale]);

  // Redirect if already logged in (only once)
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !hasRedirected.current) {
      hasRedirected.current = true;
      const role = session.user.role;
      
      // Determine redirect URL based on role, ignore callbackUrl if it's a login page
      let redirectUrl: string;
      const isCallbackLoginPage = callbackUrl.includes('/login');
      
      if (role === 'ADMIN') {
        redirectUrl = `/${locale}/admin/dashboard`;
      } else if (role === 'OPERATOR') {
        redirectUrl = `/${locale}/operator/dashboard`;
      } else if (!isCallbackLoginPage && callbackUrl !== '/') {
        // Use callbackUrl for customers if it's not a login page
        redirectUrl = callbackUrl;
      } else {
        redirectUrl = `/${locale}`;
      }
      
      window.location.replace(redirectUrl);
    }
  }, [status, session, locale, callbackUrl]);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setErrorMessage(result.error);
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Determine redirect URL before sign in
    const redirectUrl = `/${locale}/operator/dashboard`;

    try {
      // Use redirect: true to let NextAuth handle the redirect properly
      // This ensures cookies are set correctly before navigation
      await signIn('staff-pin', {
        email,
        pin,
        redirect: true,
        callbackUrl: redirectUrl,
      });
      
      // If we get here, there was an error (redirect: true would have navigated away)
    } catch (err) {
      setErrorMessage(locale === 'is' ? 'Óvænt villa kom upp' : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  // Show loading while checking auth status
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#255da0] animate-spin" />
          <p className="text-slate-600">{locale === 'is' ? 'Hleð...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#255da0] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-[#1e4f8a] opacity-50" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-[#0f2442] opacity-30" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-white/5" />
        
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full h-full">
          {/* Main content */}
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold text-white leading-tight">
              {locale === 'is' 
                ? 'Öruggt bílastæði við Keflavíkurflugvöll' 
                : 'Secure parking at Keflavík Airport'}
            </h1>
            <p className="mt-6 text-lg text-white/70">
              {locale === 'is'
                ? 'Skráðu þig inn til að sjá bókanir, breyta þeim eða bóka ný bílastæði.'
                : 'Sign in to view bookings, make changes, or book new parking spots.'}
            </p>

            {/* Features */}
            <div className="mt-10 space-y-4 inline-flex flex-col items-start">
              {[
                { icon: Shield, text: locale === 'is' ? '24/7 öryggiseftirlit' : '24/7 security monitoring' },
                { icon: Sparkles, text: locale === 'is' ? 'Aukaþjónusta í boði' : 'Extra services available' },
                { icon: Mail, text: locale === 'is' ? 'Engin lykilorð - öruggt og einfalt' : 'Passwordless - secure and simple' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="absolute bottom-12 text-sm text-white/50">
            © {new Date().getFullYear()} CarPark. {locale === 'is' ? 'Öll réttindi áskilin.' : 'All rights reserved.'}
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 py-6 sm:py-8 lg:py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md my-auto"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-4 sm:mb-6">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary-600">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary-100">
                <Car className="h-5 w-5" />
              </div>
              CarPark
            </Link>
          </div>

          {/* Back link */}
          <Link 
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Link>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-6 lg:p-8">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {t('auth.checkEmail')}
                </h2>
                <p className="text-slate-600">
                  {t('auth.linkSent')} <strong className="text-slate-900">{email}</strong>
                </p>
                <p className="text-sm text-slate-500 mt-4">
                  {t('auth.clickLink')}
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="mt-6 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {locale === 'is' ? 'Nota annað netfang' : 'Use different email'}
                </button>
              </motion.div>
            ) : (
              <>
                {/* Login Mode Toggle */}
                <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
                  <button
                    type="button"
                    onClick={() => { setLoginMode('customer'); setErrorMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      loginMode === 'customer'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    {locale === 'is' ? 'Viðskiptavinir' : 'Customers'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginMode('staff'); setErrorMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      loginMode === 'staff'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {locale === 'is' ? 'Starfsfólk' : 'Staff'}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {loginMode === 'customer' ? (
                    <motion.div
                      key="customer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-center mb-4 sm:mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t('auth.login')}</h1>
                        <p className="text-slate-500 mt-1 sm:mt-2 text-sm sm:text-base">
                          {t('auth.loginWithEmail')}
                        </p>
                      </div>

                      {(error || errorMessage) && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-red-700">
                            {error === 'OAuthAccountNotLinked'
                              ? t('auth.emailLinked')
                              : errorMessage || t('auth.loginError')}
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleCustomerSubmit} className="space-y-4 sm:space-y-6">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                            {t('auth.email')}
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="netfang@example.com"
                              className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-0 focus:outline-none transition-all text-sm sm:text-base"
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || !email}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <>
                              {t('auth.sendLoginLink')}
                              <Mail className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      </form>

                      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs sm:text-sm text-slate-500">
                          {t('auth.noPasswordNeeded')}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="staff"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-center mb-3 sm:mb-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                          {locale === 'is' ? 'Starfsmannainnskráning' : 'Staff Login'}
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm sm:text-base">
                          {locale === 'is' ? 'Notaðu netfang og PIN' : 'Use your email and PIN'}
                        </p>
                      </div>

                      {errorMessage && (
                        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-red-700">{errorMessage}</div>
                        </div>
                      )}

                      <form onSubmit={handleStaffSubmit} className="space-y-3 sm:space-y-4">
                        <div>
                          <label htmlFor="staff-email" className="block text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                            {t('auth.email')}
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              id="staff-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="netfang@carpark.is"
                              className="w-full pl-12 pr-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-0 focus:outline-none transition-all text-sm sm:text-base"
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                            PIN
                          </label>
                          
                          {/* PIN Display */}
                          <div className="flex justify-center gap-2 mb-3 sm:mb-4">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center text-xl sm:text-2xl font-bold transition-all ${
                                  pin.length > i
                                    ? 'border-slate-800 bg-slate-800 text-white'
                                    : 'border-slate-200 bg-slate-50 text-slate-300'
                                }`}
                              >
                                {pin.length > i ? '•' : ''}
                              </div>
                            ))}
                          </div>

                          {/* Keypad */}
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => pin.length < 4 && setPin(pin + num)}
                                disabled={isLoading || pin.length >= 4}
                                className="h-11 sm:h-12 rounded-xl bg-slate-100 text-slate-900 text-lg sm:text-xl font-semibold hover:bg-slate-200 active:bg-slate-300 active:scale-95 transition-all disabled:opacity-50"
                              >
                                {num}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setPin('')}
                              disabled={isLoading}
                              className="h-11 sm:h-12 rounded-xl bg-red-50 text-red-600 text-xs sm:text-sm font-medium hover:bg-red-100 active:bg-red-200 active:scale-95 transition-all"
                            >
                              {locale === 'is' ? 'Hreinsa' : 'Clear'}
                            </button>
                            <button
                              type="button"
                              onClick={() => pin.length < 4 && setPin(pin + '0')}
                              disabled={isLoading || pin.length >= 4}
                              className="h-11 sm:h-12 rounded-xl bg-slate-100 text-slate-900 text-lg sm:text-xl font-semibold hover:bg-slate-200 active:bg-slate-300 active:scale-95 transition-all disabled:opacity-50"
                            >
                              0
                            </button>
                            <button
                              type="button"
                              onClick={() => setPin(pin.slice(0, -1))}
                              disabled={isLoading || pin.length === 0}
                              className="h-11 sm:h-12 rounded-xl bg-slate-100 text-slate-600 text-xs sm:text-sm font-medium hover:bg-slate-200 active:bg-slate-300 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || !email || pin.length !== 4}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-slate-800/25 transition-all hover:bg-slate-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-6"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <>
                              {locale === 'is' ? 'Skrá inn' : 'Sign in'}
                              <Lock className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      </form>

                      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs sm:text-sm text-slate-500">
                          {locale === 'is' 
                            ? 'PIN fæst hjá stjórnanda' 
                            : 'Contact admin for your PIN'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Development quick login buttons */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-xs text-slate-400 text-center mb-3 font-medium uppercase tracking-wider">
                      Dev Quick Fill
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setEmail('admin@carpark.is'); setPin('1234'); setLoginMode('staff'); }}
                        className="flex-1 px-4 py-2.5 text-sm font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEmail('operator@carpark.is'); setPin('1234'); setLoginMode('staff'); }}
                        className="flex-1 px-4 py-2.5 text-sm font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        Operator
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sign up link */}
          <p className="text-center text-xs sm:text-sm text-slate-500 mt-4 sm:mt-6">
            {locale === 'is' ? 'Ertu nýr notandi?' : "Don't have an account?"}{' '}
            <Link href={`/${locale}/register`} className="text-primary-600 hover:text-primary-700 font-semibold">
              {locale === 'is' ? 'Nýskráning' : 'Sign up'}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
