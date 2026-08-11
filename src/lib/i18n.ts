import arMessages from '@/messages/ar.json';
import enMessages from '@/messages/en.json';

export type Language = 'ar' | 'en';

export const languageNames: Record<Language, string> = {
  ar: 'العربية',
  en: 'English',
};

export const languageList: { code: Language; name: string; flag: string }[] = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}

const allMessages: Record<Language, Record<string, string>> = {
  ar: arMessages,
  en: enMessages,
};

export function t(language: Language, key: string, params?: Record<string, string | number>): string {
  const value = allMessages[language]?.[key];
  if (value === undefined) return key;
  if (!params) return value;
  let result = value;
  for (const [paramKey, paramValue] of Object.entries(params)) {
    result = result.replace(`{${paramKey}}`, String(paramValue));
  }
  return result;
}
