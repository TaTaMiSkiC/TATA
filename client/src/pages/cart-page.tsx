import { useState } from "react";
import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
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
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  
  // Total after discount (shipping will be calculated dynamically by ShippingCostCalculator)
  const totalAfterDiscount = cartTotal - discount;
  
  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === "dobrodosli") {
      setDiscount(cartTotal * 0.1); // 10% discount
    } else {
      setDiscount(0);
    }
  };
  
  if (isLoading) {
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
                    
                    {/* Ukupno - izračunat će se nakon što se učitaju podaci o dostavi */}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Ukupno</span>
                      <span>{totalAfterDiscount.toFixed(2)} €</span>
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
                <CardFooter className="flex-col">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <RefreshCw size={14} className="mr-2" />
                    <span>Besplatan povrat u roku od 14 dana</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Truck size={14} className="mr-2" />
                    <span>Besplatna dostava za narudžbe iznad 50€</span>
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
                      <p className="mb-2">Dostava se vrši putem dostavne službe GLS ili Hrvatska Pošta.</p>
                      <p className="mb-2">Rok isporuke je 2-4 radna dana od trenutka narudžbe.</p>
                      <p>Za narudžbe iznad 50€ dostava je besplatna. Za ostale narudžbe trošak dostave iznosi 5€.</p>
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
                  <AccordionItem value="returns">
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center">
                        <AlertTriangle size={16} className="mr-2" />
                        Politika povrata
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-500">
                      <p className="mb-2">Pravo na povrat robe imate u roku od 14 dana od primitka narudžbe.</p>
                      <p className="mb-2">Proizvod mora biti u originalnom, neoštećenom pakiranju.</p>
                      <p>Za povrat ili reklamaciju, molimo kontaktirajte našu korisničku podršku na info@kerzenwelt.hr.</p>
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
