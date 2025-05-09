import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type Language = "hr" | "en" | "de";

interface SettingsContextType {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Funkcija za aplikaciju teme na HTML element
function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  let effectiveTheme: "light" | "dark";
  if (theme === "system") {
    effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    effectiveTheme = theme as "light" | "dark";
  }
  
  root.classList.add(effectiveTheme);
  
  // Promijeni i meta theme-color tag za bolje uklapanje s mobilnim uređajima
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  
  metaThemeColor.setAttribute(
    'content',
    effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff'
  );
}

// Inicijalno dohvati i postavi temu
const getInitialTheme = (): Theme => {
  // Provjeri localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedTheme = window.localStorage.getItem('theme') as Theme;
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      return storedTheme;
    }
  }
  
  // Ako nije definirano, koristi system
  return 'system';
};

// Inicijalno postavi temu prije renderiranja
const initialTheme = getInitialTheme();
if (typeof window !== 'undefined') {
  applyTheme(initialTheme);
}

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [language, setLanguageState] = useState<Language>(() => {
    // Dohvati iz localStorage ako postoji, inače postavi na hr
    const savedLanguage = localStorage.getItem("language");
    return (savedLanguage as Language) || "hr";
  });

  // Wrapper za postavljanje teme koji ažurira DOM i localStorage
  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    setThemeState(newTheme);
  };

  // Wrapper za postavljanje jezika koji ažurira DOM i localStorage
  const setLanguage = (newLanguage: Language) => {
    localStorage.setItem("language", newLanguage);
    document.documentElement.lang = newLanguage;
    setLanguageState(newLanguage);
  };

  // Efekt za praćenje promjena sistemske teme
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Inicijalno postavi temu
      applyTheme('system');
      
      // Stvori listener za promjene sistemske teme
      const handleChange = () => {
        if (theme === 'system') {
          applyTheme('system');
        }
      };
      
      // Dodaj listener
      mediaQuery.addEventListener('change', handleChange);
      
      // Očisti listener
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Inicijalno postavi jezik
  useEffect(() => {
    document.documentElement.lang = language;
  }, []);

  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};