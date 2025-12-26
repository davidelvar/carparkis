import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: 2 * 1024 * 1024, // 2MB in bytes
    },
  },
};

export default withNextIntl(nextConfig);
