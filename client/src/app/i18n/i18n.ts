import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Lazy-load Arabic in background if needed
const detectedLng = typeof window !== 'undefined'
  ? (localStorage.getItem('i18nextLng') || navigator.language || '')
  : '';
if (detectedLng.startsWith('ar')) {
  import('./locales/ar/translation.json').then((ar) => {
    i18n.addResourceBundle('ar', 'translation', ar.default || ar);
    i18n.changeLanguage('ar');
  });
}

export default i18n;
