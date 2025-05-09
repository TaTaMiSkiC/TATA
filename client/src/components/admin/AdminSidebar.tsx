import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  CreditCard,
  Flame
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
      name: "Narudžbe",
      path: "/admin/orders",
      icon: <ShoppingCart size={20} />
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
    {
      name: "Postavke",
      path: "/admin/settings",
      icon: <Settings size={20} />
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
          <Link key={item.path} href={item.path}>
            <a
              className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                isActive(item.path)
                  ? "bg-white/10 text-white"
                  : "text-primary-foreground/70 hover:bg-white/5 hover:text-white"
              }`}
              onClick={onItemClick}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </a>
          </Link>
        ))}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-primary-foreground/10">
        <Link href="/">
          <a 
            className="flex items-center text-sm text-primary-foreground/70 hover:text-white"
            onClick={onItemClick}
          >
            ← Povratak na trgovinu
          </a>
        </Link>
      </div>
    </div>
  );
}
