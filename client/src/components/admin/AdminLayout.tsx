import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminNotifications from "./AdminNotifications";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Redirect if user is not admin
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (!user.isAdmin) {
    return <Redirect to="/" />;
  }
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top Navigation */}
        <header className="sticky top-0 z-10 bg-white flex justify-between items-center px-4 py-2 border-b shadow-sm">
          <div className="flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <AdminSidebar onItemClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-medium ml-4">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Pretraži..." className="pl-8" />
            </div>
            
            <AdminNotifications />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")}>
                  Natrag na trgovinu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Odjava
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
