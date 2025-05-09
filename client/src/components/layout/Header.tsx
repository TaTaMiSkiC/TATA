import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Search, 
  User, 
  ShoppingBag, 
  ChevronDown, 
  Menu 
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { cartItems } = useCart();
  const [location] = useLocation();

  const cartItemCount = cartItems?.length || 0;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="text-primary heading text-2xl md:text-3xl font-bold cursor-pointer">
            <Link href="/">Kerzenwelt</Link>
          </div>
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <div className={`font-body hover:text-primary transition cursor-pointer ${location === '/' ? 'text-primary' : 'text-text-dark'}`}>
              <Link href="/">Početna</Link>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="font-body text-text-dark hover:text-primary transition flex items-center gap-1 outline-none">
                Proizvodi
                <ChevronDown size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem>
                  <div className="w-full cursor-pointer" onClick={() => window.location.href = '/products?category=1'}>
                    Mirisne svijeće
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="w-full cursor-pointer" onClick={() => window.location.href = '/products?category=2'}>
                    Dekorativne svijeće
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="w-full cursor-pointer" onClick={() => window.location.href = '/products?category=3'}>
                    Personalizirane svijeće
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="w-full cursor-pointer" onClick={() => window.location.href = '/products'}>
                    Posebne ponude
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className={`font-body hover:text-primary transition cursor-pointer ${location === '/about' ? 'text-primary' : 'text-text-dark'}`}>
              <Link href="/about">O nama</Link>
            </div>
            
            <div className={`font-body hover:text-primary transition cursor-pointer ${location === '/blog' ? 'text-primary' : 'text-text-dark'}`}>
              <Link href="/blog">Blog</Link>
            </div>
            
            <div className={`font-body hover:text-primary transition cursor-pointer ${location === '/contact' ? 'text-primary' : 'text-text-dark'}`}>
              <Link href="/contact">Kontakt</Link>
            </div>
          </nav>
          
          {/* User actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-text-dark hover:text-primary hover:bg-transparent">
              <Search size={20} />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-text-dark hover:text-primary hover:bg-transparent">
                    <User size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user.isAdmin && (
                    <DropdownMenuItem>
                      <div className="cursor-pointer w-full" onClick={() => window.location.href = '/admin'}>
                        Admin Panel
                      </div>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <div className="cursor-pointer w-full" onClick={() => window.location.href = '/profile'}>
                      Moj profil
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <div className="cursor-pointer w-full" onClick={() => window.location.href = '/orders'}>
                      Moje narudžbe
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Odjava
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="text-text-dark hover:text-primary transition cursor-pointer" onClick={() => window.location.href = '/auth'}>
                <User size={20} />
              </div>
            )}
            
            <div className="text-text-dark hover:text-primary transition relative cursor-pointer" onClick={() => window.location.href = '/cart'}>
              <ShoppingBag size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </div>
            
            {/* Mobile menu toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-text-dark hover:text-primary hover:bg-transparent"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
    </header>
  );
}
