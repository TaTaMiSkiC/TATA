import React from "react";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import { Mail, MapPin } from "lucide-react";
import ContactSettingsForm from "@/components/admin/ContactSettingsForm";

export default function ContactSettingsPage() {
  return (
    <AdminLayout title="Kontakt podaci">
      <Helmet>
        <title>Kontakt podaci | Admin Panel</title>
      </Helmet>
      
      <div className="flex items-center mb-6">
        <MapPin className="mr-2 h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Kontakt podaci</h1>
          <p className="text-muted-foreground">Uredite kontakt podatke koji se prikazuju korisnicima</p>
        </div>
      </div>
      
      <div className="space-y-4 bg-card p-6 rounded-md border">
        <ContactSettingsForm />
      </div>
    </AdminLayout>
  );
}