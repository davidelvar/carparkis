'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Phone,
  Car,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || `/${locale}/booking`;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Validate
    if (!formData.name.trim()) {
      setErrorMessage(locale === 'is' ? 'Vinsamlegast sláðu inn nafn' : 'Please enter your name');
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage(locale === 'is' ? 'Vinsamlegast sláðu inn netfang' : 'Please enter your email');
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage(locale === 'is' ? 'Vinsamlegast sláðu inn gilt netfang' : 'Please enter a valid email');
      setIsLoading(false);
      return;
    }

    try {
      // First, create/update the user with their info
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setErrorMessage(registerData.error || (locale === 'is' ? 'Villa kom upp' : 'An error occurred'));
        setIsLoading(false);
        return;
      }

      // Now send magic link
      const result = await signIn('email', {
        email: formData.email.trim().toLowerCase(),
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setErrorMessage(locale === 'is' ? 'Villa við að senda tölvupóst' : 'Error sending email');
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setErrorMessage(locale === 'is' ? 'Óvænt villa kom upp' : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              {locale === 'is' ? 'Athugaðu tölvupóstinn þinn!' : 'Check your email!'}
            </h1>
            <p className="text-slate-600 mb-2">
              {locale === 'is'
                ? 'Við höfum sent þér hlekk til að staðfesta aðgang.'
                : 'We\'ve sent you a link to verify your account.'}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              <span className="font-medium text-slate-700">{formData.email}</span>
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
              <p>
                {locale === 'is'
                  ? 'Hlekkurinn rennur út eftir 24 klukkustundir. Athugaðu ruslpóstmöppuna ef þú sérð ekki tölvupóstinn.'
                  : 'The link expires in 24 hours. Check your spam folder if you don\'t see the email.'}
              </p>
            </div>
            <Link
              href={`/${locale}/login`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'is' ? 'Til baka í innskráningu' : 'Back to login'}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Left side - Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-primary-500 opacity-50" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-primary-700 opacity-30" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Car className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">CarPark</span>
            </Link>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6">
            {locale === 'is' ? 'Búðu til aðgang' : 'Create an account'}
          </h1>
          <p className="text-xl text-white/80 mb-12">
            {locale === 'is'
              ? 'Nýskráðu þig til að bóka bílastæði og fá aðgang að öllum þjónustum okkar.'
              : 'Sign up to book parking and access all our services.'}
          </p>

          <div className="space-y-6">
            {[
              {
                icon: Shield,
                title: locale === 'is' ? 'Örugg bókun' : 'Secure booking',
                desc: locale === 'is' ? 'Tryggðu þér stæði fyrir ferðina' : 'Reserve your spot before the trip',
              },
              {
                icon: Sparkles,
                title: locale === 'is' ? 'Aukaþjónustur' : 'Add-on services',
                desc: locale === 'is' ? 'Bílþvottur, hleðsla og fleira' : 'Car wash, charging and more',
              },
              {
                icon: Mail,
                title: locale === 'is' ? 'Bókunarstaðfesting' : 'Booking confirmations',
                desc: locale === 'is' ? 'Fáðu kvittanir og áminningu í tölvupósti' : 'Get receipts and reminders by email',
              },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-white/70">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                <Car className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">CarPark</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">
                {locale === 'is' ? 'Nýskráning' : 'Create Account'}
              </h1>
              <p className="mt-2 text-slate-600">
                {locale === 'is'
                  ? 'Fylltu út til að búa til aðgang'
                  : 'Fill out the form to get started'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {locale === 'is' ? 'Nafn' : 'Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={locale === 'is' ? 'Jón Jónsson' : 'John Doe'}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {locale === 'is' ? 'Netfang' : 'Email'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jon@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {locale === 'is' ? 'Símanúmer' : 'Phone'} <span className="text-slate-400 text-xs font-normal">({locale === 'is' ? 'valfrjálst' : 'optional'})</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+354 xxx xxxx"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {locale === 'is' 
                    ? 'Fyrir tilkynningar um skutluþjónustu' 
                    : 'For shuttle service notifications'}
                </p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-base font-semibold transition-all',
                  isLoading
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-600/25'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {locale === 'is' ? 'Sendi...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    {locale === 'is' ? 'Búa til aðgang' : 'Create Account'}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {/* Terms notice */}
              <p className="text-xs text-center text-slate-500">
                {locale === 'is' ? (
                  <>Með nýskráningu samþykkir þú <Link href={`/${locale}/terms`} className="text-primary-600 hover:underline">skilmála</Link> og <Link href={`/${locale}/privacy`} className="text-primary-600 hover:underline">persónuverndarstefnu</Link> okkar.</>
                ) : (
                  <>By signing up, you agree to our <Link href={`/${locale}/terms`} className="text-primary-600 hover:underline">Terms</Link> and <Link href={`/${locale}/privacy`} className="text-primary-600 hover:underline">Privacy Policy</Link>.</>
                )}
              </p>
            </form>

            {/* Login link */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-600">
                {locale === 'is' ? 'Ertu nú þegar með aðgang?' : 'Already have an account?'}
              </p>
              <Link
                href={`/${locale}/login`}
                className="mt-2 inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700"
              >
                {locale === 'is' ? 'Innskráning' : 'Sign in'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
