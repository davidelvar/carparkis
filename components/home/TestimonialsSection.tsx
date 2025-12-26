'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
}

export default function TestimonialsSection() {
  const locale = useLocale();
  const [googleRating, setGoogleRating] = useState<string>('5.0');
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const response = await fetch('/api/google-rating');
        const data = await response.json();
        if (data.success && data.rating) {
          setGoogleRating(data.rating.toFixed(1));
          setReviewCount(data.reviewCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch Google rating:', error);
      }
    };
    fetchRating();
  }, []);

  const testimonials: Testimonial[] = [
    {
      name: 'Kristján Gunnarsson',
      role: locale === 'is' ? 'Langvarandi viðskiptavinur' : 'Long-time Customer',
      text: locale === 'is'
        ? 'Ég hef notað CarPark í mörg ár og allt hefur verið í toppstandi. Frábær þjónusta og góð verð. Mæli eindregið með þessu fyrirtæki.'
        : 'I have been using CarPark for several years and everything has been spot on. Great service and good prices. Highly recommend this company.',
      rating: 5,
    },
    {
      name: 'Jón Sigurður Pétursson',
      role: locale === 'is' ? 'Viðskiptavinur' : 'Customer',
      text: locale === 'is'
        ? 'Notaði þessa þjónustu í fyrsta skipti. Kom klukkan 3:45 að morgni og ekkert mál að hafa samband og fá skutlu á flugvöllinn. Þegar við komum til baka var svarað hratt og skutlan kom á örfáum mínútum. Vingjarnlegt starfsfólk. 5 af 5.'
        : 'Used this service for the first time. Arrived at 3:45 am and there was no problem getting a lift to the airport. When we arrived back, they answered quickly and the shuttle came in just a few minutes. Friendly staff. 5 out of 5.',
      rating: 5,
    },
    {
      name: 'Alain Frey',
      role: locale === 'is' ? 'Fastur viðskiptavinur' : 'Regular Customer',
      text: locale === 'is'
        ? 'Mjög vingjarnlegt starfsfólk og frábær þjónusta! Mæli 100% með. Hef notað þjónustuna fimm sinnum og aldrei lent í neinum vandræðum. Eigandinn keyrði mig jafnvel á flugvöllinn í Model S Plaid!'
        : 'Very friendly staff and fantastic service! Recommend 100%. I\'ve used their service five times now and have never had any problems. The owner even drove me to the airport in a Model S Plaid!',
      rating: 5,
    },
  ];

  return (
    <section className="py-32 bg-gradient-to-br from-slate-900 via-slate-900 to-primary-950 text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white mb-6">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {googleRating} {locale === 'is' ? 'einkunn' : 'Rating'}
            {reviewCount > 0 && (
              <span className="text-white/60">({reviewCount}+ {locale === 'is' ? 'umsagnir' : 'reviews'})</span>
            )}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold">
            {locale === 'is' ? 'Hvað viðskiptavinir segja' : 'What Customers Say'}
          </h2>
          <p className="mt-6 text-xl text-slate-400">
            {locale === 'is'
              ? 'Þúsundir ánægðra viðskiptavina hafa treyst okkur fyrir bílana sína.'
              : 'Thousands of happy customers have trusted us with their cars.'}
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 hover:bg-white/10 transition-colors"
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 h-10 w-10 text-white/10" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <p className="text-lg text-slate-200 leading-relaxed">"{testimonial.text}"</p>
              
              <div className="mt-8 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
