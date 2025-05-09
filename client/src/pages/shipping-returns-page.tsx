import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";

export default function ShippingReturnsPage() {
  // Postavljanje naslova stranice
  useEffect(() => {
    document.title = "Dostava i povrat | Kerzenwelt by Dani";
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
    <Layout>
      <Helmet>
        <title>{pageData?.title || "Dostava i povrat"} | Kerzenwelt by Dani</title>
        <meta name="description" content="Informacije o dostavi i povratu proizvoda. Besplatna dostava za narudžbe iznad 50€." />
      </Helmet>
      
      <PageHeader title={pageData?.title || "Dostava i povrat"} />
      
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: pageData?.content || "" }}
          />
        )}
      </div>
    </Layout>
  );
}