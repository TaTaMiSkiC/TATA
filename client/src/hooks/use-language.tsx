import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Podržani jezici
export type Language = "de" | "hr" | "en" | "it" | "sl";

// Prijevodi po jezicima
export const translations: Record<Language, Record<string, string>> = {
  de: {
    // Navigacija
    'nav.home': 'Startseite',
    'nav.products': 'Produkte',
    'nav.about': 'Über uns',
    'nav.contact': 'Kontakt',
    'nav.cart': 'Warenkorb',
    'nav.login': 'Anmelden',
    'nav.account': 'Mein Konto',
    'nav.admin': 'Administration',
    'nav.logout': 'Abmelden',
    'nav.allCategories': 'Alle Kategorien',
    'nav.loadingCategories': 'Kategorien werden geladen...',
    'nav.pictures': 'Bilder',
    
    // Naslovna stranica
    'home.featured': 'Ausgewählte Produkte',
    'home.collections': 'Kollektionen',
    'home.welcome': 'Willkommen bei Kerzenwelt by Dani',
    'home.subtitle': 'Handgemachte Kerzen mit natürlichen Zutaten',
    'home.shopNow': 'Jetzt einkaufen',
    
    // Proizvodi
    'product.addToCart': 'In den Warenkorb',
    'product.selectScent': 'Duft auswählen',
    'product.selectColor': 'Farbe auswählen',
    'product.outOfStock': 'Nicht auf Lager',
    'product.dimensions': 'Abmessungen',
    'product.weight': 'Gewicht',
    'product.burnTime': 'Brenndauer',
    'product.materials': 'Materialien',
    'product.instructions': 'Anweisungen',
    'product.maintenance': 'Pflege',
    
    // Košarica
    'cart.title': 'Ihr Warenkorb',
    'cart.empty': 'Ihr Warenkorb ist leer',
    'cart.continue': 'Mit dem Einkaufen fortfahren',
    'cart.checkout': 'Zur Kasse gehen',
    'cart.total': 'Gesamtsumme',
    'cart.remove': 'Entfernen',
    
    // Podnožje stranice
    'footer.about': 'Über Kerzenwelt by Dani',
    'footer.about.text': 'Handgefertigte Kerzen aus natürlichen Inhaltsstoffen. Von unserer Familie zu Ihrem Zuhause.',
    'footer.quickLinks': 'Schnelllinks',
    'footer.support': 'Kundenservice',
    'footer.contact': 'Kontakt',
    'footer.followUs': 'Folgen Sie uns',
    'footer.copyright': '© 2023 Kerzenwelt by Dani. Alle Rechte vorbehalten.',
  },
  
  hr: {
    // Navigacija
    'nav.home': 'Početna',
    'nav.products': 'Proizvodi',
    'nav.about': 'O nama',
    'nav.contact': 'Kontakt',
    'nav.cart': 'Košarica',
    'nav.login': 'Prijava',
    'nav.account': 'Moj račun',
    'nav.admin': 'Administracija',
    'nav.logout': 'Odjava',
    'nav.allCategories': 'Sve kategorije',
    'nav.loadingCategories': 'Učitavanje kategorija...',
    'nav.pictures': 'Slike',
    
    // Naslovna stranica
    'home.featured': 'Izdvojeni proizvodi',
    'home.collections': 'Kolekcije',
    'home.welcome': 'Dobrodošli u Kerzenwelt by Dani',
    'home.subtitle': 'Ručno izrađene svijeće od prirodnih sastojaka',
    'home.shopNow': 'Kupite odmah',
    
    // Proizvodi
    'product.addToCart': 'Dodaj u košaricu',
    'product.selectScent': 'Odaberite miris',
    'product.selectColor': 'Odaberite boju',
    'product.outOfStock': 'Nije dostupno',
    'product.dimensions': 'Dimenzije',
    'product.weight': 'Težina',
    'product.burnTime': 'Vrijeme gorenja',
    'product.materials': 'Materijali',
    'product.instructions': 'Upute za korištenje',
    'product.maintenance': 'Održavanje',
    
    // Košarica
    'cart.title': 'Vaša košarica',
    'cart.empty': 'Vaša košarica je prazna',
    'cart.continue': 'Nastavi s kupovinom',
    'cart.checkout': 'Završi narudžbu',
    'cart.total': 'Ukupno',
    'cart.remove': 'Ukloni',
    
    // Podnožje stranice
    'footer.about': 'O Kerzenwelt by Dani',
    'footer.about.text': 'Ručno izrađene svijeće od prirodnih sastojaka. Od naše obitelji do vašeg doma.',
    'footer.quickLinks': 'Brzi linkovi',
    'footer.support': 'Korisnička podrška',
    'footer.contact': 'Kontakt',
    'footer.followUs': 'Pratite nas',
    'footer.copyright': '© 2023 Kerzenwelt by Dani. Sva prava pridržana.',
  },
  
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.cart': 'Cart',
    'nav.login': 'Login',
    'nav.account': 'My Account',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    'nav.allCategories': 'All Categories',
    'nav.loadingCategories': 'Loading categories...',
    'nav.pictures': 'Pictures',
    
    // Home page
    'home.featured': 'Featured Products',
    'home.collections': 'Collections',
    'home.welcome': 'Welcome to Kerzenwelt by Dani',
    'home.subtitle': 'Handmade candles with natural ingredients',
    'home.shopNow': 'Shop Now',
    
    // Products
    'product.addToCart': 'Add to Cart',
    'product.selectScent': 'Select Scent',
    'product.selectColor': 'Select Color',
    'product.outOfStock': 'Out of Stock',
    'product.dimensions': 'Dimensions',
    'product.weight': 'Weight',
    'product.burnTime': 'Burn Time',
    'product.materials': 'Materials',
    'product.instructions': 'Instructions',
    'product.maintenance': 'Maintenance',
    
    // Cart
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.continue': 'Continue Shopping',
    'cart.checkout': 'Checkout',
    'cart.total': 'Total',
    'cart.remove': 'Remove',
    
    // Footer
    'footer.about': 'About Kerzenwelt by Dani',
    'footer.about.text': 'Handmade candles with natural ingredients. From our family to your home.',
    'footer.quickLinks': 'Quick Links',
    'footer.support': 'Customer Support',
    'footer.contact': 'Contact',
    'footer.followUs': 'Follow Us',
    'footer.copyright': '© 2023 Kerzenwelt by Dani. All rights reserved.',
  },
  
  it: {
    // Navigazione
    'nav.home': 'Home',
    'nav.products': 'Prodotti',
    'nav.about': 'Chi siamo',
    'nav.contact': 'Contatti',
    'nav.cart': 'Carrello',
    'nav.login': 'Accedi',
    'nav.account': 'Il mio account',
    'nav.admin': 'Amministrazione',
    'nav.logout': 'Esci',
    'nav.allCategories': 'Tutte le categorie',
    'nav.loadingCategories': 'Caricamento categorie...',
    'nav.pictures': 'Immagini',
    
    // Pagina iniziale
    'home.featured': 'Prodotti in evidenza',
    'home.collections': 'Collezioni',
    'home.welcome': 'Benvenuti a Kerzenwelt by Dani',
    'home.subtitle': 'Candele artigianali con ingredienti naturali',
    'home.shopNow': 'Acquista ora',
    
    // Prodotti
    'product.addToCart': 'Aggiungi al carrello',
    'product.selectScent': 'Seleziona profumo',
    'product.selectColor': 'Seleziona colore',
    'product.outOfStock': 'Esaurito',
    'product.dimensions': 'Dimensioni',
    'product.weight': 'Peso',
    'product.burnTime': 'Tempo di combustione',
    'product.materials': 'Materiali',
    'product.instructions': 'Istruzioni',
    'product.maintenance': 'Manutenzione',
    
    // Carrello
    'cart.title': 'Il tuo carrello',
    'cart.empty': 'Il tuo carrello è vuoto',
    'cart.continue': 'Continua lo shopping',
    'cart.checkout': 'Procedi all\'acquisto',
    'cart.total': 'Totale',
    'cart.remove': 'Rimuovi',
    
    // Piè di pagina
    'footer.about': 'Chi è Kerzenwelt by Dani',
    'footer.about.text': 'Candele artigianali con ingredienti naturali. Dalla nostra famiglia alla tua casa.',
    'footer.quickLinks': 'Link rapidi',
    'footer.support': 'Assistenza clienti',
    'footer.contact': 'Contatti',
    'footer.followUs': 'Seguici',
    'footer.copyright': '© 2023 Kerzenwelt by Dani. Tutti i diritti riservati.',
  },
  
  sl: {
    // Navigacija
    'nav.home': 'Domov',
    'nav.products': 'Izdelki',
    'nav.about': 'O nas',
    'nav.contact': 'Kontakt',
    'nav.cart': 'Košarica',
    'nav.login': 'Prijava',
    'nav.account': 'Moj račun',
    'nav.admin': 'Administracija',
    'nav.logout': 'Odjava',
    'nav.allCategories': 'Vse kategorije',
    'nav.loadingCategories': 'Nalaganje kategorij...',
    'nav.pictures': 'Slike',
    
    // Domača stran
    'home.featured': 'Izpostavljeni izdelki',
    'home.collections': 'Kolekcije',
    'home.welcome': 'Dobrodošli v Kerzenwelt by Dani',
    'home.subtitle': 'Ročno izdelane sveče iz naravnih sestavin',
    'home.shopNow': 'Nakupujte zdaj',
    
    // Izdelki
    'product.addToCart': 'Dodaj v košarico',
    'product.selectScent': 'Izberite vonj',
    'product.selectColor': 'Izberite barvo',
    'product.outOfStock': 'Ni na zalogi',
    'product.dimensions': 'Dimenzije',
    'product.weight': 'Teža',
    'product.burnTime': 'Čas gorenja',
    'product.materials': 'Materiali',
    'product.instructions': 'Navodila za uporabo',
    'product.maintenance': 'Vzdrževanje',
    
    // Košarica
    'cart.title': 'Vaša košarica',
    'cart.empty': 'Vaša košarica je prazna',
    'cart.continue': 'Nadaljujte z nakupovanjem',
    'cart.checkout': 'Zaključi naročilo',
    'cart.total': 'Skupaj',
    'cart.remove': 'Odstrani',
    
    // Noga strani
    'footer.about': 'O Kerzenwelt by Dani',
    'footer.about.text': 'Ročno izdelane sveče iz naravnih sestavin. Od naše družine do vašega doma.',
    'footer.quickLinks': 'Hitre povezave',
    'footer.support': 'Podpora strankam',
    'footer.contact': 'Kontakt',
    'footer.followUs': 'Sledite nam',
    'footer.copyright': '© 2023 Kerzenwelt by Dani. Vse pravice pridržane.',
  }
};

// Imena jezika za prikaz u izborniku
export const languageNames: Record<Language, string> = {
  de: 'Deutsch',
  hr: 'Hrvatski',
  en: 'English',
  it: 'Italiano',
  sl: 'Slovensko'
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
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
  if (typeof window === "undefined") return "de"; // Zadani jezik je njemački
  
  const savedLanguage = localStorage.getItem("language") as Language;
  return (savedLanguage && ["de", "hr", "en", "it", "sl"].includes(savedLanguage))
    ? savedLanguage
    : "de"; // Zadani jezik je njemački
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  
  const setLanguage = (newLanguage: Language) => {
    localStorage.setItem("language", newLanguage);
    setLanguageState(newLanguage);
    applyLanguage(newLanguage);
  };
  
  // Funkcija za prijevod
  const t = (key: string): string => {
    return translations[language][key] || key;
  };
  
  // Inicijalno postavi jezik
  useEffect(() => {
    applyLanguage(language);
  }, [language]);
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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