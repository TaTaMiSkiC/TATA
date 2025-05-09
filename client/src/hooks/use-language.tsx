import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Language = "hr" | "en" | "de";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Funkcija za primjenu jezika na HTML element
function applyLanguage(language: Language) {
  if (typeof window !== "undefined") {
    document.documentElement.lang = language;
  }
}

// Dohvati početni jezik iz localStorage
function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "hr";
  
  const savedLanguage = localStorage.getItem("language") as Language;
  return (savedLanguage && ["hr", "en", "de"].includes(savedLanguage))
    ? savedLanguage
    : "hr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  
  const setLanguage = (newLanguage: Language) => {
    localStorage.setItem("language", newLanguage);
    setLanguageState(newLanguage);
    applyLanguage(newLanguage);
  };
  
  // Inicijalno postavi jezik
  useEffect(() => {
    applyLanguage(language);
  }, [language]);
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}