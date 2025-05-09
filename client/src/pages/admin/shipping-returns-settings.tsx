import { useEffect } from "react";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import ShippingReturnsPageForm from "@/components/admin/ShippingReturnsPageForm";

export default function ShippingReturnsSettingsPage() {
  useEffect(() => {
    document.title = "Uredi Dostavu i povrat | Admin Panel";
  }, []);

  return (
    <AdminLayout>
      <Helmet>
        <title>Uredi Dostavu i povrat | Admin Panel</title>
      </Helmet>
      
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-6">Uređivanje stranice Dostava i povrat</h1>
        <p className="text-gray-500 mb-8">
          Ovdje možete urediti sadržaj stranice Dostava i povrat koji će biti vidljiv na vašoj web stranici.
        </p>
        
        <ShippingReturnsPageForm />
      </div>
    </AdminLayout>
  );
}