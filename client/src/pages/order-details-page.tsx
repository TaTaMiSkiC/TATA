import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useParams, useLocation } from "wouter";
import { 
  Order, 
  OrderItem as OrderItemType,
  Product,
  OrderItemWithProduct
} from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import Header from "@/components/layout/Header";
import { 
  Loader2, 
  ArrowLeft, 
  PackageCheck, 
  AlertTriangle,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  FileText,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { prepareInvoiceDataFromOrder, generateOrderInvoice } from "@/lib/generate-invoice-functions";
import LoadingSpinner from "@/components/LoadingSpinner";

// Logo import
import logoImg from "@assets/Kerzenwelt by Dani.png";

// Definicija strukture fakture
interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  // ostala polja nisu nužna za ovo rješenje
}

// Odvojeni interface bez nasljeđivanja za rješavanje tipova
interface OrderWithItems {
  id: number;
  userId: number;
  status: string;
  total: string;
  createdAt: Date;
  items: OrderItemWithProduct[];
  subtotal?: string | null;
  discountAmount?: string | null;
  shippingCost?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  // Dodatna polja koja možda nisu u originalnom Order tipu
  taxAmount?: string | null;
  shippingFullName?: string | null;
  shippingPhone?: string | null;
  transactionId?: string | null;
  customerNote?: string | null;
  // Dodano polje za fakturu
  invoice?: Invoice | null;
}

function OrderStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'processing':
      return <PackageCheck className="h-4 w-4 text-blue-500" />;
    case 'shipped':
      return <Truck className="h-4 w-4 text-purple-500" />;
    case 'delivered':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}

function OrderStatusBadge({ status }: { status: string }) {
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' | null = null;
  
  switch (status) {
    case 'pending':
      variant = 'secondary';
      break;
    case 'processing':
      variant = 'default';
      break;
    case 'shipped':
      variant = 'outline';
      break;
    case 'delivered':
      variant = 'default';
      break;
    case 'cancelled':
      variant = 'destructive';
      break;
    default:
      variant = 'outline';
  }
  
  return (
    <Badge variant={variant}>
      <OrderStatusIcon status={status} />
      <span className="ml-1">{getStatusText(status)}</span>
    </Badge>
  );
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Na čekanju';
    case 'processing':
      return 'U obradi';
    case 'shipped':
      return 'Poslano';
    case 'delivered':
      return 'Dostavljeno';
    case 'cancelled':
      return 'Otkazano';
    default:
      return status;
  }
}

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<'hr' | 'en' | 'de'>('hr');
  
  // Funkcija za prijevod tekstova sučelja
  const translate = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      hr: {
        scent: "Miris",
        color: "Boja",
        colors: "Boje",
        invoiceNumber: "Broj računa"
      },
      en: {
        scent: "Scent",
        color: "Color",
        colors: "Colors",
        invoiceNumber: "Invoice number"
      },
      de: {
        scent: "Duft",
        color: "Farbe",
        colors: "Farben",
        invoiceNumber: "Rechnungsnummer"
      }
    };
    
    return translations[selectedLanguage]?.[key] || translations.hr[key] || key;
  };
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  
  // Dohvat narudžbe
  const { 
    data: order, 
    isLoading: isLoadingOrder,
    error: orderError
  } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!user && !!orderId,
  });
  
  // Dohvat stavki narudžbe
  const { 
    data: orderItems, 
    isLoading: isLoadingItems,
    error: itemsError
  } = useQuery<OrderItemWithProduct[]>({
    queryKey: [`/api/orders/${orderId}/items`],
    enabled: !!user && !!orderId,
  });

  // Dohvat svih proizvoda
  const {
    data: products,
    isLoading: isLoadingProducts,
  } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: !!user,
  });
  
  // Dohvat fakture za narudžbu
  const {
    data: invoice,
    isLoading: isLoadingInvoice,
    error: invoiceError
  } = useQuery<Invoice | null>({
    queryKey: [`/api/orders/${orderId}/invoice`],
    enabled: !!user && !!orderId
  });

  // Kombiniranje podataka o narudžbi i stavkama
  const orderWithItems: OrderWithItems | undefined = order && orderItems ? {
    ...order,
    items: orderItems || [],
    invoice: invoice
  } : undefined;
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  const isLoading = isLoadingOrder || isLoadingItems || isLoadingProducts || isLoadingInvoice;
  const error = orderError || itemsError || invoiceError;
  
  // Funkcija za prevođenje načina plaćanja
  const getPaymentMethodText = (method: string | undefined, lang: string) => {
    if (!method) return lang === 'hr' ? 'Nije definirano' : lang === 'de' ? 'Nicht definiert' : 'Not defined';
    
    switch(method) {
      case 'cash': 
        return lang === 'hr' ? 'Gotovina' : lang === 'de' ? 'Barzahlung' : 'Cash';
      case 'bank_transfer': 
        return lang === 'hr' ? 'Bankovni transfer' : lang === 'de' ? 'Banküberweisung' : 'Bank Transfer';
      case 'paypal': 
        return 'PayPal';
      case 'credit_card':
        return lang === 'hr' ? 'Kreditna kartica' : lang === 'de' ? 'Kreditkarte' : 'Credit Card';
      default:
        // Za nepoznati tip, vrati formatiran tekst
        const formattedMethod = method
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return formattedMethod;
    }
  };
  
  // Funkcija za generiranje PDF računa
  const generateInvoice = () => {
    if (!orderWithItems || !user || !orderItems) return;
    
    setGeneratingInvoice(true);
    
    // Dodajmo dodatno logiranje
    console.log("Podaci o narudžbi:", JSON.stringify(orderWithItems));
    console.log("Način plaćanja:", orderWithItems.paymentMethod || 'Nije definirano');
    
    // Sigurna provjera stavki narudžbe
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      console.error("Nema stavki narudžbe ili nije ispravan format:", orderItems);
      toast({
        title: "Greška pri generiranju računa",
        description: "Nije moguće generirati račun jer nema stavki narudžbe.",
        variant: "destructive",
      });
      setGeneratingInvoice(false);
      return;
    }
    
    try {
      // Određivanje jezika računa
      const lang = selectedLanguage || "hr";
      
      // Koristi pomoćne funkcije iz novog modula za generiranje fakture
      const invoiceData = prepareInvoiceDataFromOrder(orderWithItems, orderItems, user, lang);
      
      // Koristi zajedničku funkciju za generiranje PDF-a
      generateOrderInvoice(invoiceData);
      
      toast({
        title: lang === 'hr' ? "Račun je generiran" : lang === 'de' ? "Rechnung wurde generiert" : "Invoice has been generated",
        description: lang === 'hr' ? "Račun je uspješno preuzet" : lang === 'de' ? "Rechnung wurde erfolgreich heruntergeladen" : "Invoice has been successfully downloaded",
      });
    } catch (error) {
      console.error("Pogreška pri generiranju PDF-a:", error);
      toast({
        title: "Greška",
        description: "Pogreška pri generiranju PDF-a",
        variant: "destructive",
      });
    } finally {
      setGeneratingInvoice(false);
    }
  };
  
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-4 h-[70vh] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }
  
  if (error || !orderWithItems) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-4">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <h2 className="text-lg font-semibold">Greška pri učitavanju narudžbe</h2>
            <p>Nije moguće učitati podatke o narudžbi. Molimo pokušajte ponovno kasnije.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/orders')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Povratak na popis narudžbi
            </Button>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Detalji narudžbe #{orderWithItems.id} | Kerzenwelt by Dani</title>
      </Helmet>
      <Header />
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-2"
              onClick={() => navigate('/orders')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Povratak
            </Button>
            <h1 className="text-2xl font-bold">Narudžba #{orderWithItems.id}</h1>
            <OrderStatusBadge status={orderWithItems.status} />
          </div>
          
          {orderWithItems.invoice && (
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                {translate('invoiceNumber')}: {orderWithItems.invoice.invoiceNumber}
              </p>
              <Select value={selectedLanguage} onValueChange={(value: any) => setSelectedLanguage(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Jezik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">Hrvatski</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={generateInvoice}
                disabled={generatingInvoice}
              >
                {generatingInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generiranje...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Preuzmi račun
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Podaci o narudžbi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Datum:</span>
                <span>{format(new Date(orderWithItems.createdAt), 'dd.MM.yyyy. HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="flex items-center">
                  <OrderStatusIcon status={orderWithItems.status} />
                  <span className="ml-2">{getStatusText(orderWithItems.status)}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metoda plaćanja:</span>
                <span>{getPaymentMethodText(orderWithItems.paymentMethod, selectedLanguage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status plaćanja:</span>
                <span>{orderWithItems.paymentStatus === 'completed' ? 'Plaćeno' : 'Na čekanju'}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Podaci o kupcu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ime:</span>
                <span>{user.name || user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{user.email}</span>
              </div>
              {orderWithItems.shippingAddress && (
                <div className="pt-2">
                  <span className="font-medium">Adresa za dostavu:</span>
                  <div className="mt-1 text-sm">
                    {orderWithItems.shippingFullName && <div>{orderWithItems.shippingFullName}</div>}
                    {orderWithItems.shippingAddress && <div>{orderWithItems.shippingAddress}</div>}
                    {(orderWithItems.shippingPostalCode || orderWithItems.shippingCity) && (
                      <div>
                        {orderWithItems.shippingPostalCode} {orderWithItems.shippingCity}
                      </div>
                    )}
                    {orderWithItems.shippingCountry && <div>{orderWithItems.shippingCountry}</div>}
                    {orderWithItems.shippingPhone && <div>Tel: {orderWithItems.shippingPhone}</div>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sažetak narudžbe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orderWithItems.subtotal && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Međuzbroj:</span>
                  <span>{parseFloat(orderWithItems.subtotal).toFixed(2)} €</span>
                </div>
              )}
              {orderWithItems.discountAmount && parseFloat(orderWithItems.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Popust:</span>
                  <span>-{parseFloat(orderWithItems.discountAmount).toFixed(2)} €</span>
                </div>
              )}
              {orderWithItems.shippingCost && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dostava:</span>
                  <span>{parseFloat(orderWithItems.shippingCost).toFixed(2)} €</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Ukupno:</span>
                <span>{parseFloat(orderWithItems.total).toFixed(2)} €</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {orderWithItems.customerNote && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Napomena kupca</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{orderWithItems.customerNote}</p>
            </CardContent>
          </Card>
        )}
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Stavke narudžbe</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proizvod</TableHead>
                  <TableHead className="text-center">Količina</TableHead>
                  <TableHead className="text-right">Cijena</TableHead>
                  <TableHead className="text-right">Ukupno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems?.map(item => {
                  const itemTotal = item.quantity * parseFloat(item.price);
                  const color = item.colorName;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          {item.scentName && (
                            <div className="inline-flex items-center text-sm bg-blue-50 rounded-full px-2 py-0.5 border border-blue-100">
                              <span className="font-medium text-blue-800 mr-1">{translate('scent')}:</span>
                              <span>{item.scentName}</span>
                            </div>
                          )}
                          
                          {/* Prikaz boja - nova implementacija s multiple colors */}
                          {item.hasMultipleColors && item.colorIds && typeof item.colorIds === 'string' && (
                            <div className="inline-flex items-center text-sm bg-blue-50 rounded-full px-2 py-0.5 border border-blue-100 flex-wrap">
                              <span className="font-medium text-blue-800 mr-1">{translate('colors')}:</span>
                              {item.colorName && (
                                <span className="inline-flex items-center mx-0.5">
                                  {item.colorName}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Falback za stare načine prikaza (ako postoji) */}
                          {item.hasMultipleColors && color && !item.colorIds && (
                            <div className="inline-flex items-center text-sm bg-blue-50 rounded-full px-2 py-0.5 border border-blue-100 flex-wrap">
                              <span className="font-medium text-blue-800 mr-1">{translate('colors')}:</span>
                              {color.split(',').map((colorName, index) => {
                                const trimmedColor = colorName.trim();
                                const productColor = products?.flatMap(p => 
                                  p.id === item.productId ? (p as any).colors || [] : []
                                ).find(c => c?.name === trimmedColor);
                                
                                return (
                                  <span key={index} className="inline-flex items-center mx-0.5">
                                    {productColor?.hexValue && (
                                      <div 
                                        className="w-3 h-3 rounded-full inline-block border border-gray-200 mr-0.5" 
                                        style={{ backgroundColor: productColor.hexValue }}
                                      />
                                    )}
                                    {trimmedColor}{index < color.split(',').length - 1 ? ',' : ''}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle">{item.quantity}</TableCell>
                      <TableCell className="text-right align-middle">{parseFloat(item.price).toFixed(2)} €</TableCell>
                      <TableCell className="text-right align-middle">{itemTotal.toFixed(2)} €</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t p-4 flex justify-end">
            <div className="text-sm text-muted-foreground">
              Prikazane cijene uključuju PDV.
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}