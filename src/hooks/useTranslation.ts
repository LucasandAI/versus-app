import { useState, useEffect } from 'react';
import { i18n } from '@/lib/i18n';

export function useTranslation() {
  const [language, setLanguage] = useState(i18n.getCurrentLanguage());
  
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguage(event.detail);
    };
    
    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);
  
  return {
    t: (key: string) => i18n.t(key),
    i18n: {
      language,
      changeLanguage: (code: string) => i18n.changeLanguage(code),
      getAvailableLanguages: () => i18n.getAvailableLanguages()
    }
  };
}