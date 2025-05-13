import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Podržani jezici
export type Language = "de" | "hr" | "en" | "it" | "sl";

// Prijevodi po jezicima
export const translations: Record<Language, Record<string, string>> = {
  de: {
    // Navigacija
    "nav.home": "Startseite",
    "nav.products": "Produkte",
    "nav.about": "Über uns",
    "nav.contact": "Kontakt",
    "nav.cart": "Warenkorb",
    "nav.login": "Anmelden",
    "nav.account": "Mein Konto",
    "nav.admin": "Administration",
    "nav.logout": "Abmelden",
    "nav.allCategories": "Alle Kategorien",
    "nav.loadingCategories": "Kategorien werden geladen...",
    "nav.pictures": "Bilder",
    "nav.adminPanel": "Adminbereich",
    "nav.myProfile": "Mein Profil",
    "nav.myOrders": "Meine Bestellungen",

    // Admin Menü
    "admin.dashboard": "Dashboard",
    "admin.products": "Produkte",
    "admin.categories": "Kategorien",
    "admin.scents": "Düfte",
    "admin.colors": "Farben",
    "admin.collections": "Kollektionen",
    "admin.orders": "Bestellungen",
    "admin.invoices": "Rechnungen",
    "admin.users": "Benutzer",
    "admin.delivery": "Liefereinstellungen",
    "admin.settings": "Einstellungen",
    "admin.pageSettings": "Seiteneinstellungen",
    "admin.contactSettings": "Kontakteinstellungen",
    "admin.documents": "Firmendokumente",
    "admin.notifications": "Benachrichtigungen",
    "admin.newOrder": "Neue Bestellung",
    "admin.statistics": "Statistiken",
    "admin.visits": "Seitenbesuche",
    "admin.addNew": "Neu hinzufügen",
    "admin.edit": "Bearbeiten",
    "admin.delete": "Löschen",
    "admin.save": "Speichern",
    "admin.cancel": "Abbrechen",
    "admin.actions": "Aktionen",
    "admin.status": "Status",
    "admin.active": "Aktiv",
    "admin.inactive": "Inaktiv",
    "admin.selectLanguage": "Sprache auswählen",

    // Naslovna stranica
    "home.featured": "Ausgewählte Produkte",
    "home.collections": "Kollektionen",
    "home.welcome": "Willkommen bei Kerzenwelt by Dani",
    "home.subtitle": "Handgemachte Kerzen mit natürlichen Zutaten",
    "home.shopNow": "Jetzt einkaufen",
    "home.categories": "Unsere Kategorien",
    "home.categoriesSubtitle":
      "Entdecken Sie unsere vielfältige Auswahl an handgefertigten Kerzen für jeden Anlass",
    "home.heroTitle": "Handgefertigte Kerzen für besondere Momente",
    "home.heroSubtitle":
      "Entdecken Sie unsere Kollektion von Premium-Duftkerzen, die mit Liebe hergestellt werden",
    "home.exploreCollection": "Kollektion erkunden",
    "home.aboutUs": "Über uns",
    "home.featuredSubtitle":
      "Unsere beliebtesten Produkte, die unsere Kunden lieben",
    "home.viewAllProducts": "Alle Produkte anzeigen",
    "home.errorLoading": "Beim Laden der Produkte ist ein Fehler aufgetreten.",
    "home.ourStory": "Unsere Geschichte",
    "home.storyDescription":
      "Jede unserer Kerzen wird mit Sorgfalt und Liebe hergestellt, wobei auf jedes Detail geachtet wird - von der Auswahl der besten Düfte bis zur Vollendung des ästhetischen Erscheinungsbildes. Wir sind stolz auf unser Handwerk und die Leidenschaft, mit der wir an jedes Produkt herangehen.",
    "home.naturalIngredients": "Natürliche Zutaten",
    "home.naturalIngredientsDesc":
      "Wir verwenden nur natürliches Sojawachs und ätherische Öle",
    "home.handmade": "Handgefertigt",
    "home.handmadeDesc": "Jede Kerze wird sorgfältig und von Hand hergestellt",
    "home.sustainability": "Nachhaltigkeit",
    "home.sustainabilityDesc": "Umweltfreundliche Verpackung und Materialien",
    "home.homeComfort": "Wohnkomfort",
    "home.homeComfortDesc":
      "Schaffen Sie eine gemütliche Atmosphäre in Ihrem Raum",
    "home.learnMore": "Mehr über uns erfahren",
    "home.autumnCollection": "Herbstkollektion",
    "home.autumnCollectionDesc":
      "Entdecken Sie unsere neue Kollektion von Herbstdüften. Warme und angenehme Düfte, die Ihr Zuhause an kühleren Tagen mit einem Gefühl von Gemütlichkeit und Wärme erfüllen.",
    "home.loading": "Laden...",
    "home.noProducts":
      "Dieser Kollektion wurden noch keine Produkte hinzugefügt.",
    "home.viewCollection": "Kollektion ansehen",

    // Proizvodi
    "product.addToCart": "In den Warenkorb",
    "product.selectScent": "Duft auswählen",
    "product.selectColor": "Farbe auswählen",
    "product.outOfStock": "Nicht auf Lager",
    "product.dimensions": "Abmessungen",
    "product.weight": "Gewicht",
    "product.burnTime": "Brenndauer",
    "product.materials": "Materialien",
    "product.instructions": "Anweisungen",
    "product.maintenance": "Pflege",

    // Košarica
    "cart.title": "Ihr Warenkorb",
    "cart.empty": "Ihr Warenkorb ist leer",
    "cart.continue": "Mit dem Einkaufen fortfahren",
    "cart.checkout": "Zur Kasse gehen",
    "cart.total": "Gesamtsumme",
    "cart.remove": "Entfernen",

    // Podnožje stranice
    "footer.about": "Über Kerzenwelt by Dani",
    "footer.about.text":
      "Handgefertigte Kerzen aus natürlichen Inhaltsstoffen. Von unserer Familie zu Ihrem Zuhause.",
    "footer.quickLinks": "Schnelllinks",
    "footer.customerSupport": "Kundenservice",
    "footer.contact": "Kontakt",
    "footer.followUs": "Folgen Sie uns",
    "footer.copyright": "Alle Rechte vorbehalten.",
    "footer.tagline":
      "Handgefertigte Kerzen aus natürlichen Inhaltsstoffen. Von unserer Familie zu Ihrem Zuhause.",
    "footer.myAccount": "Mein Konto",
    "footer.paymentMethods": "Zahlungsmethoden",

    // Testimonials
    "testimonials.title": "Was unsere Kunden sagen",
    "testimonials.subtitle": "Erfahrungen unserer zufriedenen Kunden",
    "testimonials.empty":
      "Wir haben noch keine Bewertungen. Seien Sie der Erste, der seine Erfahrung teilt!",
    "testimonials.browseProducts":
      "Produkte durchsuchen und eine Bewertung hinzufügen",
    "testimonials.loginToReview": "Einloggen und eine Bewertung hinzufügen",

    // Dialog components
    "dialog.areYouSure": "Sind Sie sicher?",
    "dialog.cannotUndo": "Diese Aktion kann nicht rückgängig gemacht werden.",
    "dialog.delete": "Löschen",
    "dialog.cancel": "Abbrechen",
    "dialog.confirm": "Bestätigen",

    // Newsletter
    "newsletter.title": "Abonnieren Sie unseren Newsletter",
    "newsletter.description":
      "Erfahren Sie als Erster von unseren neuen Produkten, Sonderangeboten und Rabatten. Abonnieren Sie unseren Newsletter und erhalten Sie 10% Rabatt auf Ihre erste Bestellung.",
    "newsletter.placeholder": "Ihre E-Mail-Adresse",
    "newsletter.button": "Abonnieren",
    "newsletter.loading": "Laden...",
    "newsletter.privacy":
      "Wir geben Ihre Daten niemals an Dritte weiter. Sie können sich jederzeit abmelden.",
    "newsletter.success":
      "Vielen Dank für Ihr Abonnement! Sie erhalten in Kürze unseren Newsletter.",
    "newsletter.error": "Bitte geben Sie Ihre E-Mail-Adresse ein.",
  },

  hr: {
    // Navigacija
    "nav.home": "Početna",
    "nav.products": "Proizvodi",
    "nav.about": "O nama",
    "nav.contact": "Kontakt",
    "nav.cart": "Košarica",
    "nav.login": "Prijava",
    "nav.account": "Moj račun",
    "nav.admin": "Administracija",
    "nav.logout": "Odjava",
    "nav.adminPanel": "Admin meni",
    "nav.myProfile": "Moj Profil",
    "nav.myOrders": "Moje Narudzbe",
    "nav.allCategories": "Sve kategorije",
    "nav.loadingCategories": "Učitavanje kategorija...",
    "nav.pictures": "Slike",

    // Admin izbornik
    "admin.dashboard": "Nadzorna ploča",
    "admin.products": "Proizvodi",
    "admin.categories": "Kategorije",
    "admin.scents": "Mirisi",
    "admin.colors": "Boje",
    "admin.collections": "Kolekcije",
    "admin.orders": "Narudžbe",
    "admin.invoices": "Računi",
    "admin.users": "Korisnici",
    "admin.delivery": "Postavke dostave",
    "admin.settings": "Postavke",
    "admin.pageSettings": "Postavke stranica",
    "admin.contactSettings": "Kontakt postavke",
    "admin.documents": "Dokumenti tvrtke",
    "admin.notifications": "Obavijesti",
    "admin.newOrder": "Nova narudžba",
    "admin.statistics": "Statistika",
    "admin.visits": "Posjete stranica",
    "admin.addNew": "Dodaj novi",
    "admin.edit": "Uredi",
    "admin.delete": "Obriši",
    "admin.save": "Spremi",
    "admin.cancel": "Odustani",
    "admin.actions": "Akcije",
    "admin.status": "Status",
    "admin.active": "Aktivno",
    "admin.inactive": "Neaktivno",
    "admin.selectLanguage": "Odaberi jezik",

    // Naslovna stranica
    "home.featured": "Izdvojeni proizvodi",
    "home.collections": "Kolekcije",
    "home.welcome": "Dobrodošli u Kerzenwelt by Dani",
    "home.subtitle": "Ručno izrađene svijeće od prirodnih sastojaka",
    "home.shopNow": "Kupite odmah",
    "home.categories": "Naše kategorije",
    "home.categoriesSubtitle":
      "Istražite našu bogatu ponudu ručno izrađenih svijeća za svaku priliku",
    "home.heroTitle": "Ručno izrađene svijeće za posebne trenutke",
    "home.heroSubtitle":
      "Otkrijte našu kolekciju premium mirisnih svijeća izrađenih s ljubavlju",
    "home.exploreCollection": "Istraži kolekciju",
    "home.aboutUs": "O nama",
    "home.featuredSubtitle":
      "Naši najpopularniji proizvodi koje naši kupci vole",
    "home.viewAllProducts": "Vidi sve proizvode",
    "home.errorLoading": "Došlo je do greške prilikom učitavanja proizvoda.",
    "home.ourStory": "Naša priča",
    "home.storyDescription":
      "Svaka naša svijeća je izrađena s pažnjom i ljubavlju, pazeći na svaki detalj - od odabira najboljih mirisa do dovršavanja estetskog izgleda. Ponosni smo na naš obrt i strast kojom pristupamo svakom proizvodu.",
    "home.naturalIngredients": "Prirodni sastojci",
    "home.naturalIngredientsDesc":
      "Koristimo samo prirodni sojin vosak i esencijalna ulja",
    "home.handmade": "Ručna izrada",
    "home.handmadeDesc": "Svaka svijeća je pažljivo i ručno izrađena",
    "home.sustainability": "Održivost",
    "home.sustainabilityDesc": "Ekološki prihvatljiva ambalaža i materijali",
    "home.homeComfort": "Udobnost doma",
    "home.homeComfortDesc": "Stvorite ugodnu atmosferu u svom prostoru",
    "home.learnMore": "Saznajte više o nama",
    "home.autumnCollection": "Jesenska kolekcija",
    "home.autumnCollectionDesc":
      "Otkrijte našu novu kolekciju jesenskih mirisa. Topli i ugodni mirisi koji će vaš dom ispuniti osjećajem udobnosti i topline tijekom hladnijih dana.",
    "home.loading": "Učitavanje...",
    "home.noProducts": "Još nisu dodani proizvodi u ovu kolekciju.",
    "home.viewCollection": "Pregledaj kolekciju",

    // Proizvodi
    "product.addToCart": "Dodaj u košaricu",
    "product.selectScent": "Odaberite miris",
    "product.selectColor": "Odaberite boju",
    "product.outOfStock": "Nije dostupno",
    "product.dimensions": "Dimenzije",
    "product.weight": "Težina",
    "product.burnTime": "Vrijeme gorenja",
    "product.materials": "Materijali",
    "product.instructions": "Upute za korištenje",
    "product.maintenance": "Održavanje",

    // Košarica
    "cart.title": "Vaša košarica",
    "cart.empty": "Vaša košarica je prazna",
    "cart.continue": "Nastavi s kupovinom",
    "cart.checkout": "Završi narudžbu",
    "cart.total": "Ukupno",
    "cart.remove": "Ukloni",

    // Podnožje stranice
    "footer.about": "O Kerzenwelt by Dani",
    "footer.about.text":
      "Ručno izrađene svijeće od prirodnih sastojaka. Od naše obitelji do vašeg doma.",
    "footer.quickLinks": "Brzi linkovi",
    "footer.customerSupport": "Korisnička podrška",
    "footer.contact": "Kontakt",
    "footer.followUs": "Pratite nas",
    "footer.copyright": "Sva prava pridržana.",
    "footer.tagline":
      "Ručno izrađene svijeće od prirodnih sastojaka. Od naše obitelji do vašeg doma.",
    "footer.myAccount": "Moj račun",
    "footer.paymentMethods": "Načini plaćanja",

    // Testimonials
    "testimonials.title": "Što kažu naši kupci",
    "testimonials.subtitle": "Iskustva naših zadovoljnih kupaca",
    "testimonials.empty":
      "Trenutno nemamo recenzija. Budite prvi koji će ostaviti svoje iskustvo!",
    "testimonials.browseProducts": "Pregledaj proizvode i dodaj recenziju",
    "testimonials.loginToReview": "Prijavi se i dodaj recenziju",

    // Dialog komponente
    "dialog.areYouSure": "Jeste li sigurni?",
    "dialog.cannotUndo": "Ova radnja se ne može poništiti.",
    "dialog.delete": "Izbriši",
    "dialog.cancel": "Odustani",
    "dialog.confirm": "Potvrdi",

    // Newsletter
    "newsletter.title": "Pretplatite se na novosti",
    "newsletter.description":
      "Budite prvi koji će saznati o našim novim proizvodima, posebnim ponudama i popustima. Pretplatite se na naš newsletter i dobijte 10% popusta na vašu prvu narudžbu.",
    "newsletter.placeholder": "Vaša email adresa",
    "newsletter.button": "Pretplatite se",
    "newsletter.loading": "Učitavanje...",
    "newsletter.privacy":
      "Nećemo dijeliti vaše podatke s trećim stranama. Možete se odjaviti u bilo kojem trenutku.",
    "newsletter.success":
      "Hvala na prijavi! Uskoro ćete primiti naš newsletter.",
    "newsletter.error": "Molimo unesite vašu email adresu.",
  },

  en: {
    // Navigation
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.cart": "Cart",
    "nav.login": "Login",
    "nav.account": "My Account",
    "nav.admin": "Admin",
    "nav.adminPanel": "Admin Panel",
    "nav.myProfile": "My Profile",
    "nav.myOrders": "My Orders",
    "nav.logout": "Logout",
    "nav.allCategories": "All Categories",
    "nav.loadingCategories": "Loading categories...",
    "nav.pictures": "Pictures",

    // Admin menu
    "admin.dashboard": "Dashboard",
    "admin.products": "Products",
    "admin.categories": "Categories",
    "admin.scents": "Scents",
    "admin.colors": "Colors",
    "admin.collections": "Collections",
    "admin.orders": "Orders",
    "admin.invoices": "Invoices",
    "admin.users": "Users",
    "admin.delivery": "Delivery Settings",
    "admin.settings": "Settings",
    "admin.pageSettings": "Page Settings",
    "admin.contactSettings": "Contact Settings",
    "admin.documents": "Company Documents",
    "admin.notifications": "Notifications",
    "admin.newOrder": "New Order",
    "admin.statistics": "Statistics",
    "admin.visits": "Page Visits",
    "admin.addNew": "Add New",
    "admin.edit": "Edit",
    "admin.delete": "Delete",
    "admin.save": "Save",
    "admin.cancel": "Cancel",
    "admin.actions": "Actions",
    "admin.status": "Status",
    "admin.active": "Active",
    "admin.inactive": "Inactive",
    "admin.selectLanguage": "Select Language",

    // Dialog components
    "dialog.areYouSure": "Are you sure?",
    "dialog.cannotUndo": "This action cannot be undone.",
    "dialog.delete": "Delete",
    "dialog.cancel": "Cancel",
    "dialog.confirm": "Confirm",

    // Home page
    "home.featured": "Featured Products",
    "home.collections": "Collections",
    "home.welcome": "Welcome to Kerzenwelt by Dani",
    "home.subtitle": "Handmade candles with natural ingredients",
    "home.shopNow": "Shop Now",
    "home.categories": "Our Categories",
    "home.categoriesSubtitle":
      "Explore our rich selection of handmade candles for every occasion",
    "home.heroTitle": "Handmade Candles for Special Moments",
    "home.heroSubtitle":
      "Discover our collection of premium scented candles made with love",
    "home.exploreCollection": "Explore Collection",
    "home.aboutUs": "About Us",
    "home.featuredSubtitle":
      "Our most popular products that our customers love",
    "home.viewAllProducts": "View all products",
    "home.errorLoading": "An error occurred while loading products.",
    "home.ourStory": "Our Story",
    "home.storyDescription":
      "Each of our candles is crafted with care and love, paying attention to every detail - from selecting the best scents to finishing the aesthetic appearance. We take pride in our craft and the passion with which we approach every product.",
    "home.naturalIngredients": "Natural Ingredients",
    "home.naturalIngredientsDesc":
      "We use only natural soy wax and essential oils",
    "home.handmade": "Handmade",
    "home.handmadeDesc": "Each candle is carefully and handcrafted",
    "home.sustainability": "Sustainability",
    "home.sustainabilityDesc":
      "Environmentally friendly packaging and materials",
    "home.homeComfort": "Home Comfort",
    "home.homeComfortDesc": "Create a cozy atmosphere in your space",
    "home.learnMore": "Learn more about us",
    "home.autumnCollection": "Autumn Collection",
    "home.autumnCollectionDesc":
      "Discover our new collection of autumn scents. Warm and pleasant fragrances that will fill your home with a sense of comfort and warmth during the cooler days.",
    "home.loading": "Loading...",
    "home.noProducts": "No products have been added to this collection yet.",
    "home.viewCollection": "View collection",

    // Products
    "product.addToCart": "Add to Cart",
    "product.selectScent": "Select Scent",
    "product.selectColor": "Select Color",
    "product.outOfStock": "Out of Stock",
    "product.dimensions": "Dimensions",
    "product.weight": "Weight",
    "product.burnTime": "Burn Time",
    "product.materials": "Materials",
    "product.instructions": "Instructions",
    "product.maintenance": "Maintenance",

    // Cart
    "cart.title": "Your Cart",
    "cart.empty": "Your cart is empty",
    "cart.continue": "Continue Shopping",
    "cart.checkout": "Checkout",
    "cart.total": "Total",
    "cart.remove": "Remove",

    // Footer
    "footer.about": "About Kerzenwelt by Dani",
    "footer.about.text":
      "Handmade candles with natural ingredients. From our family to your home.",
    "footer.quickLinks": "Quick Links",
    "footer.customerSupport": "Customer Support",
    "footer.contact": "Contact",
    "footer.followUs": "Follow Us",
    "footer.copyright": "All rights reserved.",
    "footer.tagline":
      "Handmade candles with natural ingredients. From our family to your home.",
    "footer.myAccount": "My Account",
    "footer.paymentMethods": "Payment Methods",

    // Testimonials
    "testimonials.title": "What Our Customers Say",
    "testimonials.subtitle": "Experiences from our satisfied customers",
    "testimonials.empty":
      "We don't have any reviews yet. Be the first to share your experience!",
    "testimonials.browseProducts": "Browse products and add a review",
    "testimonials.loginToReview": "Log in and add a review",

    // Dialog components
    "dialog.areYouSure": "Are you sure?",
    "dialog.cannotUndo": "This action cannot be undone.",
    "dialog.delete": "Delete",
    "dialog.cancel": "Cancel",
    "dialog.confirm": "Confirm",

    // Newsletter
    "newsletter.title": "Subscribe to our newsletter",
    "newsletter.description":
      "Be the first to know about our new products, special offers and discounts. Subscribe to our newsletter and get 10% off your first order.",
    "newsletter.placeholder": "Your email address",
    "newsletter.button": "Subscribe",
    "newsletter.loading": "Loading...",
    "newsletter.privacy":
      "We'll never share your data with third parties. You can unsubscribe at any time.",
    "newsletter.success":
      "Thank you for subscribing! You'll receive our newsletter soon.",
    "newsletter.error": "Please enter your email address.",
  },

  it: {
    // Navigazione
    "nav.home": "Home",
    "nav.products": "Prodotti",
    "nav.about": "Chi siamo",
    "nav.contact": "Contatti",
    "nav.cart": "Carrello",
    "nav.login": "Accedi",
    "nav.account": "Il mio account",
    "nav.admin": "Amministrazione",
    "nav.logout": "Esci",
    "nav.allCategories": "Tutte le categorie",
    "nav.loadingCategories": "Caricamento categorie...",
    "nav.pictures": "Immagini",

    // Menu amministrazione
    "admin.dashboard": "Dashboard",
    "admin.products": "Prodotti",
    "admin.categories": "Categorie",
    "admin.scents": "Profumi",
    "admin.colors": "Colori",
    "admin.collections": "Collezioni",
    "admin.orders": "Ordini",
    "admin.invoices": "Fatture",
    "admin.users": "Utenti",
    "admin.delivery": "Impostazioni di consegna",
    "admin.settings": "Impostazioni",
    "admin.pageSettings": "Impostazioni pagina",
    "admin.contactSettings": "Impostazioni contatti",
    "admin.documents": "Documenti aziendali",
    "admin.notifications": "Notifiche",
    "admin.newOrder": "Nuovo ordine",
    "admin.statistics": "Statistiche",
    "admin.visits": "Visite pagina",
    "admin.addNew": "Aggiungi nuovo",
    "admin.edit": "Modifica",
    "admin.delete": "Elimina",
    "admin.save": "Salva",
    "admin.cancel": "Annulla",
    "admin.actions": "Azioni",
    "admin.status": "Stato",
    "admin.active": "Attivo",
    "admin.inactive": "Inattivo",
    "admin.selectLanguage": "Seleziona lingua",

    // Pagina iniziale
    "home.featured": "Prodotti in evidenza",
    "home.collections": "Collezioni",
    "home.welcome": "Benvenuti a Kerzenwelt by Dani",
    "home.subtitle": "Candele artigianali con ingredienti naturali",
    "home.shopNow": "Acquista ora",
    "home.categories": "Le nostre categorie",
    "home.categoriesSubtitle":
      "Esplora la nostra ricca selezione di candele fatte a mano per ogni occasione",
    "home.heroTitle": "Candele artigianali per momenti speciali",
    "home.heroSubtitle":
      "Scopri la nostra collezione di candele profumate premium realizzate con amore",
    "home.exploreCollection": "Esplora la collezione",
    "home.aboutUs": "Chi siamo",
    "home.featuredSubtitle":
      "I nostri prodotti più popolari che i nostri clienti amano",
    "home.viewAllProducts": "Vedi tutti i prodotti",
    "home.errorLoading":
      "Si è verificato un errore durante il caricamento dei prodotti.",
    "home.ourStory": "La nostra storia",
    "home.storyDescription":
      "Ogni nostra candela è realizzata con cura e amore, prestando attenzione a ogni dettaglio - dalla selezione delle migliori fragranze alla rifinitura dell'aspetto estetico. Siamo orgogliosi del nostro artigianato e della passione con cui affrontiamo ogni prodotto.",
    "home.naturalIngredients": "Ingredienti naturali",
    "home.naturalIngredientsDesc":
      "Utilizziamo solo cera di soia naturale e oli essenziali",
    "home.handmade": "Fatto a mano",
    "home.handmadeDesc": "Ogni candela è realizzata con cura e artigianalmente",
    "home.sustainability": "Sostenibilità",
    "home.sustainabilityDesc": "Imballaggi e materiali ecologici",
    "home.homeComfort": "Comfort domestico",
    "home.homeComfortDesc": "Crea un'atmosfera accogliente nel tuo spazio",
    "home.learnMore": "Scopri di più su di noi",
    "home.autumnCollection": "Collezione Autunno",
    "home.autumnCollectionDesc":
      "Scopri la nostra nuova collezione di fragranze autunnali. Profumi caldi e piacevoli che riempiranno la tua casa con un senso di comfort e calore durante le giornate più fresche.",
    "home.loading": "Caricamento...",
    "home.noProducts":
      "Non sono ancora stati aggiunti prodotti a questa collezione.",
    "home.viewCollection": "Visualizza collezione",

    // Prodotti
    "product.addToCart": "Aggiungi al carrello",
    "product.selectScent": "Seleziona profumo",
    "product.selectColor": "Seleziona colore",
    "product.outOfStock": "Esaurito",
    "product.dimensions": "Dimensioni",
    "product.weight": "Peso",
    "product.burnTime": "Tempo di combustione",
    "product.materials": "Materiali",
    "product.instructions": "Istruzioni",
    "product.maintenance": "Manutenzione",

    // Carrello
    "cart.title": "Il tuo carrello",
    "cart.empty": "Il tuo carrello è vuoto",
    "cart.continue": "Continua lo shopping",
    "cart.checkout": "Procedi all'acquisto",
    "cart.total": "Totale",
    "cart.remove": "Rimuovi",

    // Piè di pagina
    "footer.about": "Chi è Kerzenwelt by Dani",
    "footer.about.text":
      "Candele artigianali con ingredienti naturali. Dalla nostra famiglia alla tua casa.",
    "footer.quickLinks": "Link rapidi",
    "footer.customerSupport": "Assistenza clienti",
    "footer.contact": "Contatti",
    "footer.followUs": "Seguici",
    "footer.copyright": "Tutti i diritti riservati.",
    "footer.tagline":
      "Candele artigianali con ingredienti naturali. Dalla nostra famiglia alla tua casa.",
    "footer.myAccount": "Il mio account",
    "footer.paymentMethods": "Metodi di pagamento",

    // Testimonials
    "testimonials.title": "Cosa dicono i nostri clienti",
    "testimonials.subtitle": "Esperienze dei nostri clienti soddisfatti",
    "testimonials.empty":
      "Non abbiamo ancora recensioni. Sii il primo a condividere la tua esperienza!",
    "testimonials.browseProducts":
      "Sfoglia i prodotti e aggiungi una recensione",
    "testimonials.loginToReview": "Accedi e aggiungi una recensione",

    // Dialog components
    "dialog.areYouSure": "Sei sicuro?",
    "dialog.cannotUndo": "Questa azione non può essere annullata.",
    "dialog.delete": "Elimina",
    "dialog.cancel": "Annulla",
    "dialog.confirm": "Conferma",

    // Newsletter
    "newsletter.title": "Iscriviti alla nostra newsletter",
    "newsletter.description":
      "Sii il primo a conoscere i nostri nuovi prodotti, offerte speciali e sconti. Iscriviti alla nostra newsletter e ottieni il 10% di sconto sul tuo primo ordine.",
    "newsletter.placeholder": "Il tuo indirizzo email",
    "newsletter.button": "Iscriviti",
    "newsletter.loading": "Caricamento...",
    "newsletter.privacy":
      "Non condivideremo mai i tuoi dati con terze parti. Puoi cancellarti in qualsiasi momento.",
    "newsletter.success":
      "Grazie per l'iscrizione! Riceverai presto la nostra newsletter.",
    "newsletter.error": "Per favore inserisci il tuo indirizzo email.",
  },

  sl: {
    // Navigacija
    "nav.home": "Domov",
    "nav.products": "Izdelki",
    "nav.about": "O nas",
    "nav.contact": "Kontakt",
    "nav.cart": "Košarica",
    "nav.login": "Prijava",
    "nav.account": "Moj račun",
    "nav.admin": "Administracija",
    "nav.logout": "Odjava",
    "nav.allCategories": "Vse kategorije",
    "nav.loadingCategories": "Nalaganje kategorij...",
    "nav.pictures": "Slike",

    // Admin meni
    "admin.dashboard": "Nadzorna plošča",
    "admin.products": "Izdelki",
    "admin.categories": "Kategorije",
    "admin.scents": "Dišave",
    "admin.colors": "Barve",
    "admin.collections": "Kolekcije",
    "admin.orders": "Naročila",
    "admin.invoices": "Računi",
    "admin.users": "Uporabniki",
    "admin.delivery": "Nastavitve dostave",
    "admin.settings": "Nastavitve",
    "admin.pageSettings": "Nastavitve strani",
    "admin.contactSettings": "Kontaktne nastavitve",
    "admin.documents": "Dokumenti podjetja",
    "admin.notifications": "Obvestila",
    "admin.newOrder": "Novo naročilo",
    "admin.statistics": "Statistika",
    "admin.visits": "Obiski strani",
    "admin.addNew": "Dodaj novo",
    "admin.edit": "Uredi",
    "admin.delete": "Izbriši",
    "admin.save": "Shrani",
    "admin.cancel": "Prekliči",
    "admin.actions": "Dejanja",
    "admin.status": "Status",
    "admin.active": "Aktivno",
    "admin.inactive": "Neaktivno",
    "admin.selectLanguage": "Izberi jezik",

    // Domača stran
    "home.featured": "Izpostavljeni izdelki",
    "home.collections": "Kolekcije",
    "home.welcome": "Dobrodošli v Kerzenwelt by Dani",
    "home.subtitle": "Ročno izdelane sveče iz naravnih sestavin",
    "home.shopNow": "Nakupujte zdaj",
    "home.categories": "Naše kategorije",
    "home.categoriesSubtitle":
      "Raziščite našo bogato izbiro ročno izdelanih sveč za vsako priložnost",
    "home.heroTitle": "Ročno izdelane sveče za posebne trenutke",
    "home.heroSubtitle":
      "Odkrijte našo kolekcijo vrhunskih dišečih sveč, narejenih z ljubeznijo",
    "home.exploreCollection": "Raziščite kolekcijo",
    "home.aboutUs": "O nas",
    "home.featuredSubtitle":
      "Naši najbolj priljubljeni izdelki, ki jih naše stranke obožujejo",
    "home.viewAllProducts": "Oglejte si vse izdelke",
    "home.errorLoading": "Pri nalaganju izdelkov je prišlo do napake.",
    "home.ourStory": "Naša zgodba",
    "home.storyDescription":
      "Vsaka naša sveča je izdelana s skrbjo in ljubeznijo, s pozornostjo na vsako podrobnost - od izbire najboljših dišav do končnega estetskega videza. Ponosni smo na naše rokodelstvo in strast, s katero pristopamo k vsakemu izdelku.",
    "home.naturalIngredients": "Naravne sestavine",
    "home.naturalIngredientsDesc":
      "Uporabljamo samo naravni sojin vosek in eterična olja",
    "home.handmade": "Ročno izdelano",
    "home.handmadeDesc": "Vsaka sveča je skrbno in ročno izdelana",
    "home.sustainability": "Trajnostnost",
    "home.sustainabilityDesc": "Okolju prijazna embalaža in materiali",
    "home.homeComfort": "Udobje doma",
    "home.homeComfortDesc": "Ustvarite prijetno vzdušje v vašem prostoru",
    "home.learnMore": "Več o nas",
    "home.autumnCollection": "Jesenska kolekcija",
    "home.autumnCollectionDesc":
      "Odkrijte našo novo kolekcijo jesenskih dišav. Tople in prijetne dišave, ki bodo vaš dom v hladnejših dneh napolnile z občutkom udobja in topline.",
    "home.loading": "Nalaganje...",
    "home.noProducts": "V to kolekcijo še ni bilo dodanih izdelkov.",
    "home.viewCollection": "Oglejte si kolekcijo",

    // Izdelki
    "product.addToCart": "Dodaj v košarico",
    "product.selectScent": "Izberite vonj",
    "product.selectColor": "Izberite barvo",
    "product.outOfStock": "Ni na zalogi",
    "product.dimensions": "Dimenzije",
    "product.weight": "Teža",
    "product.burnTime": "Čas gorenja",
    "product.materials": "Materiali",
    "product.instructions": "Navodila za uporabo",
    "product.maintenance": "Vzdrževanje",

    // Košarica
    "cart.title": "Vaša košarica",
    "cart.empty": "Vaša košarica je prazna",
    "cart.continue": "Nadaljujte z nakupovanjem",
    "cart.checkout": "Zaključi naročilo",
    "cart.total": "Skupaj",
    "cart.remove": "Odstrani",

    // Noga strani
    "footer.about": "O Kerzenwelt by Dani",
    "footer.about.text":
      "Ročno izdelane sveče iz naravnih sestavin. Od naše družine do vašega doma.",
    "footer.quickLinks": "Hitre povezave",
    "footer.customerSupport": "Podpora strankam",
    "footer.contact": "Kontakt",
    "footer.followUs": "Sledite nam",
    "footer.copyright": "Vse pravice pridržane.",
    "footer.tagline":
      "Ročno izdelane sveče iz naravnih sestavin. Od naše družine do vašega doma.",
    "footer.myAccount": "Moj račun",
    "footer.paymentMethods": "Načini plačila",

    // Testimonials
    "testimonials.title": "Kaj pravijo naše stranke",
    "testimonials.subtitle": "Izkušnje naših zadovoljnih strank",
    "testimonials.empty":
      "Trenutno nimamo ocen. Bodite prvi, ki bo delil svojo izkušnjo!",
    "testimonials.browseProducts": "Preglejte izdelke in dodajte oceno",
    "testimonials.loginToReview": "Prijavite se in dodajte oceno",

    // Dialog components
    "dialog.areYouSure": "Ali ste prepričani?",
    "dialog.cannotUndo": "Te akcije ni mogoče razveljaviti.",
    "dialog.delete": "Izbriši",
    "dialog.cancel": "Prekliči",
    "dialog.confirm": "Potrdi",

    // Newsletter
    "newsletter.title": "Naročite se na naše novice",
    "newsletter.description":
      "Bodite prvi, ki bo izvedel za naše nove izdelke, posebne ponudbe in popuste. Naročite se na naše novice in dobite 10% popust na vaše prvo naročilo.",
    "newsletter.placeholder": "Vaš e-poštni naslov",
    "newsletter.button": "Naroči se",
    "newsletter.loading": "Nalaganje...",
    "newsletter.privacy":
      "Vaših podatkov nikoli ne bomo delili s tretjimi osebami. Odjava je mogoča kadarkoli.",
    "newsletter.success": "Hvala za prijavo! Kmalu boste prejeli naše novice.",
    "newsletter.error": "Prosimo, vnesite vaš e-poštni naslov.",
  },
};

// Imena jezika za prikaz u izborniku
export const languageNames: Record<Language, string> = {
  de: "Deutsch",
  hr: "Hrvatski",
  en: "English",
  it: "Italiano",
  sl: "Slovensko",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  translateText: (text: string, sourceLanguage?: Language) => string;
  translateObject: <T extends Record<string, any>>(
    obj: T,
    sourceLanguage?: Language,
  ) => T;
  translateArray: <T extends Record<string, any>>(
    array: T[],
    sourceLanguage?: Language,
  ) => T[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

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
  return savedLanguage && ["de", "hr", "en", "it", "sl"].includes(savedLanguage)
    ? savedLanguage
    : "de"; // Zadani jezik je njemački
}

import {
  translateArray,
  translateObject,
  translateText as translateTextService,
} from "@/lib/translation-service";

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

  // Funkcija za prevođenje teksta
  const translateText = (text: string, sourceLanguage?: Language): string => {
    return translateTextService(text, language, sourceLanguage);
  };

  // Inicijalno postavi jezik
  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateText,
        translateObject: (obj, sourceLanguage) =>
          translateObject(obj, language, sourceLanguage),
        translateArray: (array, sourceLanguage) =>
          translateArray(array, language, sourceLanguage),
      }}
    >
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
