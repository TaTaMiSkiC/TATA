import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, MessageCircle, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="bg-text-dark text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: About */}
          <div>
            <h3 className="heading text-xl font-semibold mb-4">Kerzenwelt</h3>
            <p className="text-gray-400 mb-6">
              Ručno izrađene svijeće od prirodnih sastojaka. Od naše obitelji do vašeg doma.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <Linkedin size={18} />
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="heading text-xl font-semibold mb-4">Brzi linkovi</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products">
                  <a className="text-gray-400 hover:text-white transition">Naši proizvodi</a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="text-gray-400 hover:text-white transition">O nama</a>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <a className="text-gray-400 hover:text-white transition">Blog</a>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <a className="text-gray-400 hover:text-white transition">Često postavljana pitanja</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-gray-400 hover:text-white transition">Kontakt</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Customer Service */}
          <div>
            <h3 className="heading text-xl font-semibold mb-4">Korisnička podrška</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/profile">
                  <a className="text-gray-400 hover:text-white transition">Moj račun</a>
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns">
                  <a className="text-gray-400 hover:text-white transition">Dostava i povrat</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-gray-400 hover:text-white transition">Uvjeti korištenja</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="text-gray-400 hover:text-white transition">Politika privatnosti</a>
                </Link>
              </li>
              <li>
                <Link href="/payment">
                  <a className="text-gray-400 hover:text-white transition">Načini plaćanja</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Contact */}
          <div>
            <h3 className="heading text-xl font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={18} className="mt-1 mr-3 text-secondary" />
                <span className="text-gray-400">Ulica grada Vukovara 224, 10000 Zagreb</span>
              </li>
              <li className="flex items-start">
                <Phone size={18} className="mt-1 mr-3 text-secondary" />
                <span className="text-gray-400">+385 1 234 5678</span>
              </li>
              <li className="flex items-start">
                <Mail size={18} className="mt-1 mr-3 text-secondary" />
                <span className="text-gray-400">info@kerzenwelt.hr</span>
              </li>
              <li className="flex items-start">
                <Clock size={18} className="mt-1 mr-3 text-secondary" />
                <span className="text-gray-400">Pon - Pet: 9:00 - 17:00</span>
              </li>
            </ul>
          </div>
        </div>
        
        <Separator className="bg-gray-800 mb-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">&copy; 2023 Kerzenwelt by Dani. Sva prava pridržana.</p>
          <div className="flex items-center space-x-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard" className="h-6" />
          </div>
        </div>
      </div>
    </footer>
  );
}
