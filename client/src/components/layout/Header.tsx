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
          <Link href="/">
            <a className="text-primary heading text-2xl md:text-3xl font-bold">Kerzenwelt</a>
          </Link>
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <a className={`font-body hover:text-primary transition ${location === '/' ? 'text-primary' : 'text-text-dark'}`}>
                Početna
              </a>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="font-body text-text-dark hover:text-primary transition flex items-center gap-1 outline-none">
                Proizvodi
                <ChevronDown size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/products?category=1">
                    <a className="w-full cursor-pointer">Mirisne svijeće</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/products?category=2">
                    <a className="w-full cursor-pointer">Dekorativne svijeće</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/products?category=3">
                    <a className="w-full cursor-pointer">Personalizirane svijeće</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/products">
                    <a className="w-full cursor-pointer">Posebne ponude</a>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/about">
              <a className={`font-body hover:text-primary transition ${location === '/about' ? 'text-primary' : 'text-text-dark'}`}>
                O nama
              </a>
            </Link>
            <Link href="/blog">
              <a className={`font-body hover:text-primary transition ${location === '/blog' ? 'text-primary' : 'text-text-dark'}`}>
                Blog
              </a>
            </Link>
            <Link href="/contact">
              <a className={`font-body hover:text-primary transition ${location === '/contact' ? 'text-primary' : 'text-text-dark'}`}>
                Kontakt
              </a>
            </Link>
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
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <a className="cursor-pointer w-full">Admin Panel</a>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <a className="cursor-pointer w-full">Moj profil</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">
                      <a className="cursor-pointer w-full">Moje narudžbe</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Odjava
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <a className="text-text-dark hover:text-primary transition">
                  <User size={20} />
                </a>
              </Link>
            )}
            
            <Link href="/cart">
              <a className="text-text-dark hover:text-primary transition relative">
                <ShoppingBag size={20} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </a>
            </Link>
            
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
