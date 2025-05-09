import React from "react";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import ShippingSettingsForm from "@/components/admin/ShippingSettingsForm";
import StoreSettingsForm from "@/components/admin/StoreSettingsForm";
import UserAccountSettingsForm from "@/components/admin/UserAccountSettingsForm";
import AppearanceSettingsForm from "@/components/admin/AppearanceSettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Truck, 
  User, 
  Palette, 
  Store 
} from "lucide-react";

export default function SettingsPage() {
  return (
    <AdminLayout title="Postavke">
      <Helmet>
        <title>Postavke | Admin Panel</title>
      </Helmet>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Postavke</h1>
        <p className="text-muted-foreground">Upravljajte postavkama vašeg računa i trgovine</p>
      </div>
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="mb-4">
          <TabsTrigger value="account" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Korisnički račun
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center">
            <Palette className="mr-2 h-4 w-4" />
            Izgled i jezik
          </TabsTrigger>
          <TabsTrigger value="store" className="flex items-center">
            <Store className="mr-2 h-4 w-4" />
            Postavke trgovine
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" />
            Dostava
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-4 bg-card p-6 rounded-md border">
          <UserAccountSettingsForm />
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4 bg-card p-6 rounded-md border">
          <AppearanceSettingsForm />
        </TabsContent>
        
        <TabsContent value="store" className="space-y-4 bg-card p-6 rounded-md border">
          <StoreSettingsForm />
        </TabsContent>
        
        <TabsContent value="shipping" className="space-y-4 bg-card p-6 rounded-md border">
          <ShippingSettingsForm />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}