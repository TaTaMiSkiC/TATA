import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from 'react-helmet';
import { useLocation } from "wouter";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lock, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export default function CheckoutPage() {
  const { cartItems, cartTotal, isLoading } = useCart();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Calculate shipping and total
  const shipping = cartTotal > 50 ? 0 : 5;
  const total = cartTotal + shipping;
  
  // Redirect to cart if cart is empty
  useEffect(() => {
    if (!isLoading && (!cartItems || cartItems.length === 0)) {
      navigate("/cart");
    }
  }, [cartItems, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <h1 className="heading text-3xl font-bold mb-8 text-center">Učitavanje...</h1>
        </div>
      </Layout>
    );
  }
  
  if (!cartItems || cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <h1 className="heading text-3xl font-bold mb-8 text-center">Košarica je prazna</h1>
          <div className="text-center">
            <Button asChild>
              <Link href="/products">
                <a>Pregledajte proizvode</a>
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
        <title>Plaćanje | Kerzenwelt by Dani</title>
        <meta name="description" content="Dovršite svoju narudžbu ručno izrađenih svijeća i unesite podatke za plaćanje i dostavu." />
      </Helmet>
      
      <div className="bg-neutral py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="heading text-3xl font-bold">Plaćanje</h1>
            <div className="flex items-center text-sm text-gray-500">
              <Link href="/">
                <a className="hover:text-primary">Početna</a>
              </Link>
              <ChevronRight size={14} className="mx-2" />
              <Link href="/cart">
                <a className="hover:text-primary">Košarica</a>
              </Link>
              <ChevronRight size={14} className="mx-2" />
              <span className="text-gray-800 font-medium">Plaćanje</span>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Checkout form */}
            <div className="w-full lg:w-2/3">
              <Card>
                <CardContent className="pt-6">
                  <CheckoutForm />
                </CardContent>
              </Card>
            </div>
            
            {/* Order summary */}
            <div className="w-full lg:w-1/3">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <ShoppingBag size={20} className="mr-2" />
                    Sažetak narudžbe
                  </h2>
                  
                  {/* Product list */}
                  <div className="divide-y">
                    {cartItems.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between">
                        <div className="flex">
                          <div className="w-16 h-16 mr-4 rounded overflow-hidden">
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium">{item.product.name}</h3>
                            <p className="text-sm text-gray-500">Količina: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {(parseFloat(item.product.price) * item.quantity).toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order totals */}
                  <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Međuzbroj</span>
                      <span>{cartTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dostava</span>
                      <span>{shipping === 0 ? "Besplatno" : `${shipping.toFixed(2)} €`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Ukupno</span>
                      <span>{total.toFixed(2)} €</span>
                    </div>
                  </div>
                  
                  {/* Security note */}
                  <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                    <div className="flex items-center mb-2">
                      <Lock size={14} className="mr-2" />
                      <span>Sigurno plaćanje</span>
                    </div>
                    <p>
                      Vaši podaci su šifrirani i sigurni. Podatke o plaćanju nikada ne spremamo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
