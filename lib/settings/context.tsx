'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface SiteSettings {
  siteName: string;
  siteNameEn: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  defaultLocale: string;
  currency: string;
}

const defaultSettings: SiteSettings = {
  siteName: 'CarPark',
  siteNameEn: 'CarPark',
  contactEmail: 'info@carpark.is',
  contactPhone: '+354 555 1234',
  address: '',
  defaultLocale: 'is',
  currency: 'ISK',
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  refetch: async () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings?public=true');
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings({
          siteName: data.data.siteName || defaultSettings.siteName,
          siteNameEn: data.data.siteNameEn || defaultSettings.siteNameEn,
          contactEmail: data.data.contactEmail || defaultSettings.contactEmail,
          contactPhone: data.data.contactPhone || defaultSettings.contactPhone,
          address: data.data.address || defaultSettings.address,
          defaultLocale: data.data.defaultLocale || defaultSettings.defaultLocale,
          currency: data.data.currency || defaultSettings.currency,
        });
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
