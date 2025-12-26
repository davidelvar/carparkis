export const locales = ['is', 'en'] as const;
export const defaultLocale = 'is' as const;

export type Locale = (typeof locales)[number];
