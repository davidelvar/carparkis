import Link from 'next/link';
import { Car, Home, MapPin, Plane } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Parking lot visual */}
        <div className="relative mb-8">
          <div className="relative h-40 flex items-center justify-center">
            {/* Parking lot background */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-slate-200 rounded-2xl overflow-hidden">
              {/* Parking lines */}
              <div className="absolute inset-0 flex justify-around px-4">
                <div className="w-px h-full bg-white/60" />
                <div className="w-px h-full bg-white/60" />
                <div className="w-px h-full bg-white/60" />
                <div className="w-px h-full bg-white/60" />
                <div className="w-px h-full bg-white/60" />
              </div>
              {/* Parking spot numbers */}
              <div className="absolute bottom-2 inset-x-0 flex justify-around px-8">
                <span className="text-xs font-bold text-slate-400">P1</span>
                <span className="text-xs font-bold text-slate-400">P2</span>
                <span className="text-xs font-bold text-red-400 animate-pulse">P?</span>
                <span className="text-xs font-bold text-slate-400">P4</span>
              </div>
            </div>

            {/* Confused car */}
            <div className="relative z-10 animate-bounce">
              <div className="relative">
                <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
                  <Car className="h-10 w-10 text-white" />
                </div>
                {/* Question mark */}
                <span className="absolute -top-4 -right-2 text-2xl">❓</span>
              </div>
            </div>

            {/* Plane icon */}
            <div className="absolute top-2 right-8">
              <Plane className="h-6 w-6 text-slate-300 -rotate-45" />
            </div>
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-8xl font-black text-slate-200 mb-2">404</h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
          Oops! This spot doesn&apos;t exist
        </h2>
        <p className="text-slate-600 mb-8 text-lg">
          We couldn&apos;t find the parking spot you&apos;re looking for. Maybe the plane left without you?
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/25"
          >
            <Home className="h-5 w-5" />
            Go home
          </Link>
          <Link
            href="/en/booking"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
          >
            <MapPin className="h-5 w-5" />
            Book a spot
          </Link>
        </div>

        {/* Fun footer message */}
        <p className="mt-12 text-sm text-slate-400">
          🚗 Psst... our parking spots are more reliable than this page
        </p>
      </div>
    </div>
  );
}
