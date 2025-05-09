import React from "react";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import ShippingSettingsForm from "@/components/admin/ShippingSettingsForm";
import ContactSettingsForm from "@/components/admin/ContactSettingsForm";
import GeneralSettingsForm from "@/components/admin/GeneralSettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Truck, CreditCard, Globe, MapPin } from "lucide-react";

export default function SettingsPage() {
  return (
    <AdminLayout title="Postavke">
      <Helmet>
        <title>Postavke | Admin Panel</title>
      </Helmet>
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="heading text-3xl font-bold">Postavke</h1>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Općenito
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            Kontakt
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" />
            Dostava
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            Plaćanje
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            Lokalizacija
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsForm />
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <ContactSettingsForm />
        </TabsContent>
        
        <TabsContent value="shipping" className="space-y-4">
          <ShippingSettingsForm />
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Postavke plaćanja</CardTitle>
              <CardDescription>
                Upravljajte metodama plaćanja i postavkama naplate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ova funkcionalnost će biti implementirana uskoro.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="localization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Postavke lokalizacije</CardTitle>
              <CardDescription>
                Upravljajte jezicima, formatima datuma i valutama
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ova funkcionalnost će biti implementirana uskoro.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}