// Podržani jezici
export type Language = 'de' | 'hr' | 'en' | 'it' | 'sl';

// Struktura prijevoda
export type Translations = {
  [key: string]: string;
};

// Tip za višejezični kontekst
export interface I18nContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Svi podržani jezici s njihovim imenima
export const languages: Record<Language, string> = {
  de: 'Deutsch',
  hr: 'Hrvatski',
  en: 'English',
  it: 'Italiano',
  sl: 'Slovensko'
};

// Prijevodi po ključevima za sve jezike
export const translations: Record<Language, Translations> = {
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
    
    // Korisničke poruke
    'message.addedToCart': 'Produkt wurde in den Warenkorb gelegt',
    'message.removedFromCart': 'Produkt wurde aus dem Warenkorb entfernt',
    'message.errorOccurred': 'Ein Fehler ist aufgetreten',
    'message.thankYou': 'Vielen Dank für Ihre Bestellung!',
    
    // Autentifikacija
    'auth.login': 'Anmelden',
    'auth.register': 'Registrieren',
    'auth.username': 'Benutzername',
    'auth.password': 'Passwort',
    'auth.email': 'E-Mail',
    'auth.firstname': 'Vorname',
    'auth.lastname': 'Nachname',
    'auth.submit': 'Absenden',
    'auth.haveAccount': 'Haben Sie bereits ein Konto?',
    'auth.noAccount': 'Noch kein Konto?',
    'auth.forgotPassword': 'Passwort vergessen?',
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
    
    // Korisničke poruke
    'message.addedToCart': 'Proizvod je dodan u košaricu',
    'message.removedFromCart': 'Proizvod je uklonjen iz košarice',
    'message.errorOccurred': 'Došlo je do pogreške',
    'message.thankYou': 'Hvala na vašoj narudžbi!',
    
    // Autentifikacija
    'auth.login': 'Prijava',
    'auth.register': 'Registracija',
    'auth.username': 'Korisničko ime',
    'auth.password': 'Lozinka',
    'auth.email': 'E-mail',
    'auth.firstname': 'Ime',
    'auth.lastname': 'Prezime',
    'auth.submit': 'Pošalji',
    'auth.haveAccount': 'Već imate račun?',
    'auth.noAccount': 'Nemate račun?',
    'auth.forgotPassword': 'Zaboravili ste lozinku?',
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
    
    // User messages
    'message.addedToCart': 'Product added to cart',
    'message.removedFromCart': 'Product removed from cart',
    'message.errorOccurred': 'An error occurred',
    'message.thankYou': 'Thank you for your order!',
    
    // Authentication
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.email': 'Email',
    'auth.firstname': 'First Name',
    'auth.lastname': 'Last Name',
    'auth.submit': 'Submit',
    'auth.haveAccount': 'Already have an account?',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.forgotPassword': 'Forgot Password?',
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
    
    // Messaggi all\'utente
    'message.addedToCart': 'Prodotto aggiunto al carrello',
    'message.removedFromCart': 'Prodotto rimosso dal carrello',
    'message.errorOccurred': 'Si è verificato un errore',
    'message.thankYou': 'Grazie per il tuo ordine!',
    
    // Autenticazione
    'auth.login': 'Accedi',
    'auth.register': 'Registrati',
    'auth.username': 'Nome utente',
    'auth.password': 'Password',
    'auth.email': 'Email',
    'auth.firstname': 'Nome',
    'auth.lastname': 'Cognome',
    'auth.submit': 'Invia',
    'auth.haveAccount': 'Hai già un account?',
    'auth.noAccount': 'Non hai un account?',
    'auth.forgotPassword': 'Hai dimenticato la password?',
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
    
    // Sporočila uporabnikom
    'message.addedToCart': 'Izdelek dodan v košarico',
    'message.removedFromCart': 'Izdelek odstranjen iz košarice',
    'message.errorOccurred': 'Prišlo je do napake',
    'message.thankYou': 'Hvala za vaše naročilo!',
    
    // Avtentikacija
    'auth.login': 'Prijava',
    'auth.register': 'Registracija',
    'auth.username': 'Uporabniško ime',
    'auth.password': 'Geslo',
    'auth.email': 'E-pošta',
    'auth.firstname': 'Ime',
    'auth.lastname': 'Priimek',
    'auth.submit': 'Pošlji',
    'auth.haveAccount': 'Že imate račun?',
    'auth.noAccount': 'Nimate računa?',
    'auth.forgotPassword': 'Ste pozabili geslo?',
  }
};