import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  CreditCard,
  Flame,
  TagsIcon,
  Sparkles,
  Palette,
  Truck,
  Mail,
  FileText,
  RefreshCw,
  Grid,
  Layers
} from "lucide-react";

interface AdminSidebarProps {
  onItemClick?: () => void;
}

export default function AdminSidebar({ onItemClick }: AdminSidebarProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const menuItems = [
    {
      name: "Nadzorna ploča",
      path: "/admin",
      icon: <LayoutDashboard size={20} />
    },
    {
      name: "Proizvodi",
      path: "/admin/products",
      icon: <Package size={20} />
    },
    {
      name: "Kategorije",
      path: "/admin/categories",
      icon: <TagsIcon size={20} />
    },
    {
      name: "Mirisi",
      path: "/admin/scents",
      icon: <Sparkles size={20} />
    },
    {
      name: "Boje",
      path: "/admin/colors",
      icon: <Palette size={20} />
    },
    {
      name: "Kolekcije",
      path: "/admin/collections",
      icon: <Layers size={20} />
    },
    {
      name: "Narudžbe",
      path: "/admin/orders",
      icon: <ShoppingCart size={20} />
    },
    {
      name: "Računi",
      path: "/admin/invoices",
      icon: <FileText size={20} />
    },
    {
      name: "Korisnici",
      path: "/admin/users",
      icon: <Users size={20} />
    },
    {
      name: "Plaćanja",
      path: "/admin/payments",
      icon: <CreditCard size={20} />
    },
    // Postavke grupa
    {
      name: "Postavke stranica",
      path: "/admin/page-settings",
      icon: <Settings size={20} />
    },
    {
      name: "Kontakt podaci",
      path: "/admin/contact-settings",
      icon: <Mail size={20} />
    },
    {
      name: "Postavke dostave",
      path: "/admin/delivery-settings",
      icon: <Truck size={20} />
    },
  ];

  return (
    <div className="h-full bg-primary text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-6 py-6 border-b border-primary-foreground/10">
        <Flame size={24} className="mr-2" />
        <span className="text-xl font-bold">Kerzenwelt Admin</span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            onClick={onItemClick}
            className={`flex items-center px-4 py-3 rounded-md transition-colors ${
              isActive(item.path)
                ? "bg-white/10 text-white"
                : "text-primary-foreground/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-primary-foreground/10">
        <Link 
          href="/"
          className="flex items-center text-sm text-primary-foreground/70 hover:text-white"
          onClick={onItemClick}
        >
          ← Povratak na trgovinu
        </Link>
      </div>
    </div>
  );
}
