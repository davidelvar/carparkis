import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carparkis.vercel.app';
  
  // Static pages for both locales
  const staticPages = [
    '',           // Homepage
    '/booking',   // Booking page
  ];

  const locales = ['is', 'en'];
  
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add homepage with highest priority
  locales.forEach((locale) => {
    sitemapEntries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          is: `${baseUrl}/is`,
          en: `${baseUrl}/en`,
        },
      },
    });
  });

  // Add booking page
  locales.forEach((locale) => {
    sitemapEntries.push({
      url: `${baseUrl}/${locale}/booking`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          is: `${baseUrl}/is/booking`,
          en: `${baseUrl}/en/booking`,
        },
      },
    });
  });

  return sitemapEntries;
}
