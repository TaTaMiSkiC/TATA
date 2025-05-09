import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Clock, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export default function OrderSuccessPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Extract order ID from URL query parameter
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const orderId = searchParams.get("orderId");
  
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await apiRequest("GET", `/api/orders/${orderId}`);
        const orderData = await response.json();
        setOrder(orderData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order:", error);
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <h1 className="heading text-3xl font-bold mb-8 text-center">Učitavanje...</h1>
        </div>
      </Layout>
    );
  }
  
  if (!orderId || !order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Narudžba nije pronađena</h1>
                <p className="text-gray-500 mb-4">
                  Nismo mogli pronaći informacije o vašoj narudžbi.
                </p>
                <Button asChild>
                  <Link href="/products">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Pregledajte proizvode
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Helmet>
        <title>Narudžba uspješna | Kerzenwelt by Dani</title>
        <meta name="description" content="Vaša narudžba je uspješno zaprimljena." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Narudžba uspješno zaprimljena!</h1>
              <p className="text-gray-500">
                Hvala vam na vašoj narudžbi. Poslali smo potvrdu na vašu email adresu.
              </p>
            </div>
            
            <Separator className="my-6" />
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Detalji narudžbe</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Broj narudžbe</p>
                  <p className="font-medium">#{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Datum</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ukupno</p>
                  <p className="font-medium">{parseFloat(order.total).toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Način plaćanja</p>
                  <p className="font-medium">
                    {order.paymentMethod === "paypal" ? "PayPal" : "Bankovni prijenos"}
                  </p>
                </div>
              </div>
              
              <div className="bg-neutral rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium mb-2">Status narudžbe</h3>
                <div className="flex items-center">
                  {order.status === "completed" ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-medium">Završeno</span>
                    </>
                  ) : order.status === "processing" ? (
                    <>
                      <Package className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-medium">U obradi</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-medium">Na čekanju</span>
                    </>
                  )}
                </div>
              </div>
              
              {order.paymentMethod === "bank_transfer" && (
                <div className="border rounded-lg p-4 bg-neutral mb-4">
                  <h3 className="text-sm font-medium mb-2">Podaci za plaćanje</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="font-medium w-32">Primatelj:</span>
                      <span>Kerzenwelt by Dani d.o.o.</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">IBAN:</span>
                      <span>HR1234567890123456789</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">Model:</span>
                      <span>HR00</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">Poziv na broj:</span>
                      <span>{order.id}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">Iznos:</span>
                      <span>{parseFloat(order.total).toFixed(2)} €</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">Opis plaćanja:</span>
                      <span>Kerzenwelt narudžba #{order.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex justify-between">
              <Button asChild variant="outline">
                <Link href="/account/orders">
                  Moje narudžbe
                </Link>
              </Button>
              
              <Button asChild>
                <Link href="/products">
                  Nastavite kupovinu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}