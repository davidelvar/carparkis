import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carparkis.vercel.app';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/operator/',
          '/account',
          '/*?*', // Disallow URLs with query parameters (prevents duplicate content)
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
