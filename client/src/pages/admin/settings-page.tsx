import React from "react";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import ShippingSettingsForm from "@/components/admin/ShippingSettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck } from "lucide-react";

export default function SettingsPage() {
  return (
    <AdminLayout title="Postavke">
      <Helmet>
        <title>Postavke dostave | Admin Panel</title>
      </Helmet>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Postavke dostave</h1>
        <p className="text-muted-foreground">Upravljajte postavkama dostave</p>
      </div>
      
      <Tabs defaultValue="shipping" className="space-y-4">
        <TabsList className="mb-4">
          <TabsTrigger value="shipping" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" />
            Dostava
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shipping" className="space-y-4 bg-card p-6 rounded-md border">
          <ShippingSettingsForm />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}