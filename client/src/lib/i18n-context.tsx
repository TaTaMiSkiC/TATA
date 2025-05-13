import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Language, translations, I18nContextType } from './i18n';

// Stvaranje konteksta s početnim vrijednostima
const I18nContext = createContext<I18nContextType>({
  currentLanguage: 'de', // Njemački kao zadani jezik
  setLanguage: () => {},
  t: () => ''
});

// Komponenta koja pruža kontekst za višejezičnost
export const I18nProvider = ({ children }: { children: ReactNode }) => {
  // Provjera prethodno spremljenog jezika u lokalnom spremištu preglednika
  const getSavedLanguage = (): Language => {
    const savedLang = localStorage.getItem('language');
    if (savedLang && isValidLanguage(savedLang)) {
      return savedLang as Language;
    }
    return 'de'; // Zadani jezik (njemački)
  };
  
  // Validacija jezika
  const isValidLanguage = (lang: string): boolean => {
    return ['de', 'hr', 'en', 'it', 'sl'].includes(lang);
  };

  // Stanje za trenutni jezik
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getSavedLanguage());

  // Funkcija za promjenu jezika
  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
    // Dodavanje atributa lang na html element radi pristupačnosti
    document.documentElement.setAttribute('lang', lang);
  };

  // Funkcija za prevođenje po ključu
  const t = (key: string): string => {
    const currentTranslations = translations[currentLanguage];
    return currentTranslations[key] || key; // Vraćanje ključa ako prijevod nije pronađen
  };

  // Postavljanje inicijalnog jezika na HTML element
  useEffect(() => {
    document.documentElement.setAttribute('lang', currentLanguage);
  }, []);

  return (
    <I18nContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook za korištenje prijevoda u komponentama
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation mora biti korišten unutar I18nProvider');
  }
  return context;
};