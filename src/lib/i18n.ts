interface Translations {
  [key: string]: string;
}

interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  translations: Translations;
}

const languages: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    translations: {
      'navigation.home': 'Home',
      'navigation.leagues': 'Leagues',
      'navigation.profile': 'Profile',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.create': 'Create',
      'common.close': 'Close',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.settings': 'Settings',
      'profile.editProfile': 'Edit Profile',
      'profile.logout': 'Logout',
      'profile.logoutSuccess': 'Logged out successfully',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.selectLanguage': 'Select Language',
    }
  },
  fr: {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    translations: {
      'navigation.home': 'Accueil',
      'navigation.leagues': 'Ligues',
      'navigation.profile': 'Profil',
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.edit': 'Modifier',
      'common.delete': 'Supprimer',
      'common.create': 'Créer',
      'common.close': 'Fermer',
      'common.loading': 'Chargement...',
      'common.error': 'Erreur',
      'common.success': 'Succès',
      'common.settings': 'Paramètres',
      'profile.editProfile': 'Modifier le profil',
      'profile.logout': 'Se déconnecter',
      'profile.logoutSuccess': 'Déconnexion réussie',
      'settings.title': 'Paramètres',
      'settings.language': 'Langue',
      'settings.selectLanguage': 'Sélectionner la langue',
    }
  }
};

class SimpleI18n {
  private currentLanguage: string;
  
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'en';
  }
  
  t(key: string): string {
    const language = languages[this.currentLanguage];
    return language?.translations[key] || key;
  }
  
  changeLanguage(code: string) {
    if (languages[code]) {
      this.currentLanguage = code;
      localStorage.setItem('language', code);
      // Trigger a custom event to notify components
      window.dispatchEvent(new CustomEvent('languageChange', { detail: code }));
    }
  }
  
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }
  
  getAvailableLanguages(): LanguageConfig[] {
    return Object.values(languages);
  }
}

export const i18n = new SimpleI18n();
export default i18n;