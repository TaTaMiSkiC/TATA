import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings-api";
import { useLanguage } from "@/hooks/use-language";
import { queryClient } from "@/lib/queryClient";
import { Helmet } from 'react-helmet';
import Layout from "@/components/layout/Layout";
import CartItem from "@/components/cart/CartItem";
import { ShippingCostCalculator, FreeShippingProgress } from "@/components/ShippingCostCalculator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, ChevronRight, CreditCard, RefreshCw, Truck, Info, AlertTriangle, ShoppingBasket } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CartPage() {
  const { cartItems, cartTotal, clearCart, isLoading } = useCart();
  const { user } = useAuth();
  const { t, translateText } = useLanguage();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [shippingSettings, setShippingSettings] = useState<{
    freeShippingThreshold: string;
    standardShippingRate: string;
  } | null>(null);
  
  // Total after discount (shipping will be calculated dynamically by ShippingCostCalculator)
  const totalAfterDiscount = cartTotal - discount;
  
  // Direktni pristup API-ju za najsvježije podatke bez keširanja
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const freeThresholdResponse = await fetch("/api/settings/freeShippingThreshold");
        const freeThresholdData = await freeThresholdResponse.json();
        
        const standardRateResponse = await fetch("/api/settings/standardShippingRate");
        const standardRateData = await standardRateResponse.json();
        
        console.log("Direktno dohvaćene postavke u cart-page:", {
          freeShippingThreshold: freeThresholdData.value,
          standardShippingRate: standardRateData.value
        });
        
        // Ažuriraj state i localStorage
        setShippingSettings({
          freeShippingThreshold: freeThresholdData.value,
          standardShippingRate: standardRateData.value
        });
        
        // Ažuriraj localStorage s najnovijim vrijednostima
        localStorage.setItem('freeShippingThreshold', freeThresholdData.value);
        localStorage.setItem('standardShippingRate', standardRateData.value);
        
        // Prisili osvježavanje React Query keša
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/settings", "freeShippingThreshold"] });
        queryClient.invalidateQueries({ queryKey: ["/api/settings", "standardShippingRate"] });
      } catch (error) {
        console.error("Greška pri dohvaćanju postavki:", error);
      }
    };
    
    // Odmah dohvati podatke pri učitavanju komponente
    fetchSettings();
    
    // Osvježavaj podatke svakih 10 sekundi dok je košarica otvorena
    const intervalId = setInterval(fetchSettings, 10000);
    
    // Očisti interval kad se komponenta unmount-a
    return () => clearInterval(intervalId);
  }, []);
  
  // Koristi useSettings hook kao fallback
  const { getSetting } = useSettings();
  const { data: freeShippingThresholdSetting, isLoading: isLoadingFreeThreshold } = getSetting("freeShippingThreshold");
  const { data: standardShippingRateSetting, isLoading: isLoadingStandardRate } = getSetting("standardShippingRate");
  
  // Izračunaj troškove dostave za prikaz ukupnog iznosa
  // Prvo koristi localStorage vrijednosti koje smo upravo ažurirali, kao fallback koristi API podatke
  const localFreeShippingThreshold = typeof window !== 'undefined' ? localStorage.getItem('freeShippingThreshold') : null;
  const localStandardShippingRate = typeof window !== 'undefined' ? localStorage.getItem('standardShippingRate') : null;
  
  const standardShippingRate = parseFloat(localStandardShippingRate || standardShippingRateSetting?.value || "5");
  const freeShippingThreshold = parseFloat(localFreeShippingThreshold || freeShippingThresholdSetting?.value || "50");
  
  // Ako je standardShippingRate 0, dostava je uvijek besplatna
  // Inače, dostava je besplatna ako je ukupan iznos veći od praga za besplatnu dostavu
  const isFreeShipping = standardShippingRate === 0 || (totalAfterDiscount >= freeShippingThreshold && freeShippingThreshold > 0);
  const shippingCost = isFreeShipping ? 0 : standardShippingRate;
  
  // Ukupan iznos s dostavom
  const totalWithShipping = totalAfterDiscount + shippingCost;
  
  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === "dobrodosli") {
      setDiscount(cartTotal * 0.1); // 10% discount
    } else {
      setDiscount(0);
    }
  };
  
  const isLoadingShippingSettings = isLoadingFreeThreshold || isLoadingStandardRate;
  if (isLoading || isLoadingShippingSettings) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <h1 className="heading text-3xl font-bold mb-8 text-center">Učitavanje košarice...</h1>
        </div>
      </Layout>
    );
  }
  
  if (!cartItems || cartItems.length === 0) {
    return (
      <Layout>
        <Helmet>
          <title>{`Košarica | Kerzenwelt by Dani`}</title>
          <meta name="description" content="Pregledajte proizvode u vašoj košarici i dovršite narudžbu." />
        </Helmet>
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBasket size={64} className="mx-auto mb-6 text-gray-300" />
            <h1 className="heading text-3xl font-bold mb-4">Vaša košarica je prazna</h1>
            <p className="text-gray-500 mb-8">
              Izgleda da još niste dodali proizvode u svoju košaricu.
              Istražite našu ponudu i pronađite savršene svijeće za svoj dom.
            </p>
            <Button size="lg" asChild>
              <Link href="/products">
                Pregledajte proizvode
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{`Košarica (${cartItems.length}) | Kerzenwelt by Dani`}</title>
        <meta name="description" content="Pregledajte proizvode u vašoj košarici i dovršite narudžbu." />
      </Helmet>
      
      <div className="bg-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="heading text-3xl font-bold mb-2">Košarica</h1>
          <div className="flex items-center text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-primary">
              Početna
            </Link>
            <ChevronRight size={14} className="mx-2" />
            <span className="text-gray-800 font-medium">Košarica</span>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart items */}
            <div className="w-full lg:w-2/3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Proizvodi u košarici</CardTitle>
                  <CardDescription>
                    {cartItems.length} {cartItems.length === 1 ? 'proizvod' : 
                     cartItems.length % 10 >= 2 && cartItems.length % 10 <= 4 ? 'proizvoda' : 'proizvoda'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cartItems.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => clearCart.mutate()}
                    disabled={clearCart.isPending}
                  >
                    {clearCart.isPending ? "Čišćenje..." : "Očisti košaricu"}
                  </Button>
                  <Button asChild>
                    <Link href="/products">
                      Nastavi kupovinu
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Order summary */}
            <div className="w-full lg:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Sažetak narudžbe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Međuzbroj</span>
                      <span>{cartTotal.toFixed(2)} €</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Popust</span>
                        <span>-{discount.toFixed(2)} €</span>
                      </div>
                    )}
                    
                    {/* Dinamički izračun dostave */}
                    <ShippingCostCalculator subtotal={totalAfterDiscount} />
                    
                    <Separator />
                    
                    {/* Traka napretka do besplatne dostave */}
                    <FreeShippingProgress subtotal={totalAfterDiscount} />
                    
                    {/* Ukupno - uključuje dostavu */}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Ukupno</span>
                      <span>{totalWithShipping.toFixed(2)} €</span>
                    </div>
                    
                    {/* Coupon code input */}
                    <div className="mt-6">
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          placeholder="Promo kod"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={!couponCode}
                        >
                          Primijeni
                        </Button>
                      </div>
                      {couponCode === "dobrodosli" && discount > 0 && (
                        <p className="text-success text-sm mt-2">
                          Kod "DOBRODOSLI" uspješno primijenjen! Ostvarili ste 10% popusta.
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full mt-6" 
                      size="lg"
                      asChild
                    >
                      <Link href={user ? "/checkout" : "/auth?redirect=checkout"} className="flex items-center justify-center">
                        <CreditCard size={18} className="mr-2" />
                        Nastavi na plaćanje
                      </Link>
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center text-sm text-gray-500">
                    <Truck size={14} className="mr-2" />
                    <span>
                      {standardShippingRate === 0 ? (
                        "Besplatna dostava za sve narudžbe"
                      ) : freeShippingThreshold > 0 ? (
                        `Besplatna dostava za narudžbe iznad ${freeShippingThreshold.toFixed(2)}€`
                      ) : (
                        `Dostava: ${standardShippingRate.toFixed(2)}€`
                      )}
                    </span>
                  </div>
                </CardFooter>
              </Card>
              
              {/* Additional info */}
              <div className="mt-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="shipping">
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center">
                        <Info size={16} className="mr-2" />
                        Informacije o dostavi
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-500">
                      <p className="mb-2">Dostava se vrši putem dostavne službe GLS, DPD, UPS ili Pošte.</p>
                      <p className="mb-2">Rok isporuke je 2-5 radna dana od trenutka narudžbe.</p>
                      <p>
                        {standardShippingRate === 0 ? (
                          "Dostava je besplatna za sve narudžbe."
                        ) : freeShippingThreshold > 0 ? (
                          `Za narudžbe iznad ${freeShippingThreshold.toFixed(2)}€ dostava je besplatna. Za ostale narudžbe trošak dostave iznosi ${standardShippingRate.toFixed(2)}€.`
                        ) : (
                          `Trošak dostave iznosi ${standardShippingRate.toFixed(2)}€ za sve narudžbe.`
                        )}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payment">
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center">
                        <CreditCard size={16} className="mr-2" />
                        Načini plaćanja
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-500">
                      <p className="mb-2">Prihvaćamo sljedeće načine plaćanja:</p>
                      <ul className="list-disc list-inside">
                        <li>PayPal</li>
                        <li>Kreditne kartice (Visa, Mastercard)</li>
                        <li>Virmansko plaćanje (po predračunu)</li>
                        <li>Pouzeće (plaćanje prilikom preuzimanja)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
