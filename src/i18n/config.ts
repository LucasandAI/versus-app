import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation resources
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  en: {
    translation: en
  },
  fr: {
    translation: fr
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: localStorage.getItem('language') || 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false // React already does escaping
    }
  });

export default i18n;