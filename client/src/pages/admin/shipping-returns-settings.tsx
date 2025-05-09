import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ShippingReturnsPageForm from "@/components/admin/ShippingReturnsPageForm";

export default function ShippingReturnsSettingsPage() {
  // Postavljanje naslova stranice
  useEffect(() => {
    document.title = "Postavke stranice Dostava i povrat | Kerzenwelt Admin";
  }, []);

  // Dohvaćanje sadržaja stranice iz API-ja
  const { data: pageData, isLoading } = useQuery({
    queryKey: ["/api/pages/shipping-returns"],
    queryFn: async () => {
      const res = await fetch("/api/pages/shipping-returns");
      if (!res.ok) {
        // Ako stranica nije pronađena, vraćamo zadani sadržaj
        if (res.status === 404) {
          return {
            title: "Dostava i povrat",
            content: `
              <h2>Naša politika dostave</h2>
              <p>Dostava se vrši putem dostavnih službi na području cijele Hrvatske.</p>
              <p>Rok dostave je 2-5 radnih dana od potvrde narudžbe.</p>
              <p>Za narudžbe iznad 50€ dostava je besplatna.</p>
              <p>Za narudžbe ispod 50€ trošak dostave iznosi 5€.</p>
              
              <h2>Politika povrata</h2>
              <p>Kupac ima pravo na povrat robe u roku od 14 dana od primitka.</p>
              <p>Povrat je moguć samo za neoštećenu i nekorištenu robu u originalnom pakiranju.</p>
              <p>Za povrat nas kontaktirajte putem e-maila ili telefona.</p>
              <p>Troškove povrata snosi kupac osim u slučaju kada je razlog povrata greška s naše strane.</p>
              
              <h2>Reklamacije</h2>
              <p>Ukoliko proizvod ima vidljiva oštećenja, molimo vas da to odmah prijavite.</p>
              <p>Reklamacije se rješavaju u najkraćem mogućem roku, a najkasnije u roku od 15 dana od zaprimanja.</p>
            `
          };
        }
        throw new Error("Neuspješno dohvaćanje stranice");
      }
      return await res.json();
    },
  });

  return (
    <AdminLayout>
      <Helmet>
        <title>Uređivanje stranice Dostava i povrat | Kerzenwelt Admin</title>
      </Helmet>
      
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Uređivanje stranice Dostava i povrat</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ShippingReturnsPageForm 
            initialData={pageData || {
              title: "Dostava i povrat",
              content: ""
            }} 
          />
        )}
      </div>
    </AdminLayout>
  );
}