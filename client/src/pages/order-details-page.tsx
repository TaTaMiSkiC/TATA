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
import { generateInvoicePdf } from "@/lib/generate-invoice-pdf";
import { format } from "date-fns";

// Logo import
import logoImg from "@assets/Kerzenwelt by Dani.png";

// OrderItemWithProduct je već importiran iz @shared/schema

// Definicija strukture fakture
interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  // ostala polja nisu nužna za ovo rješenje
}

// Dodatna struktura koja uključuje fakturu saOrder-om
interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
  invoice?: Invoice | null;
}

// Statusna komponenta
function OrderStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'processing':
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'shipped':
      return <Truck className="h-5 w-5 text-blue-500" />;
    case 'delivered':
      return <PackageCheck className="h-5 w-5 text-green-500" />;
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
}

// Badge komponenta
function OrderStatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  
  switch (status) {
    case 'pending':
      variant = "outline";
      break;
    case 'processing':
    case 'shipped':
      variant = "secondary";
      break;
    case 'delivered':
    case 'completed':
      variant = "default";
      break;
    case 'cancelled':
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }
  
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <OrderStatusIcon status={status} />
      <span>{getStatusText(status)}</span>
    </Badge>
  );
}

// Funkcija za dobivanje teksta statusa na hrvatskom
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
    case 'completed':
      return 'Završeno';
    case 'cancelled':
      return 'Otkazano';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// Funkcija za dobivanje teksta načina plaćanja na hrvatskom
function getPaymentMethodText(method: string | undefined): string {
  if (!method) return 'Nije definirano';
  
  switch (method) {
    case 'cash':
      return 'Gotovina';
    case 'bank_transfer':
      return 'Bankovni prijenos';
    case 'paypal':
      return 'PayPal';
    case 'credit_card':
      return 'Kreditna kartica';
    default:
      // Za nepoznati tip, vrati formatiran tekst
      const formattedMethod = method
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return formattedMethod;
  }
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const orderIdNumber = parseInt(id, 10);
  const [selectedLanguage, setSelectedLanguage] = useState<"hr" | "en" | "de">("hr");
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  
  const {
    data: orderWithItems,
    error: orderError,
    isLoading: isLoadingOrder,
  } = useQuery<OrderWithItems, Error>({
    queryKey: [`/api/orders/${id}`],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string);
      if (!res.ok) throw new Error("Narudžba nije pronađena");
      return await res.json();
    },
    enabled: !!id && !!user,
  });
  
  const {
    data: orderItems,
    error: itemsError,
    isLoading: isLoadingItems,
  } = useQuery<OrderItemWithProduct[], Error>({
    queryKey: [`/api/orders/${id}/items`],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string);
      if (!res.ok) throw new Error("Stavke narudžbe nisu pronađene");
      return await res.json();
    },
    enabled: !!id && !!user,
  });
  
  const {
    data: products,
    error: productsError,
    isLoading: isLoadingProducts,
  } = useQuery<Product[], Error>({
    queryKey: ["/api/products"],
    enabled: !!user,
  });
  
  const {
    data: invoice,
    error: invoiceError,
    isLoading: isLoadingInvoice,
  } = useQuery<Invoice | null, Error>({
    queryKey: [`/api/orders/${id}/invoice`],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Greška pri dohvaćanju fakture");
      }
      return await res.json();
    },
    enabled: !!id && !!user,
  });
  
  // Samo za sigurnost, provjeravamo je li faktura automatski dodana objektu narudžbe
  useEffect(() => {
    if (orderWithItems && !orderWithItems.invoice && invoice) {
      orderWithItems.invoice = invoice;
    }
  }, [orderWithItems, invoice]);
  
  const error = orderError || itemsError || productsError || invoiceError;
  const isLoading = isLoadingOrder || isLoadingItems || isLoadingProducts || isLoadingInvoice;
  
  const navigateBack = () => {
    navigate("/orders");
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
      
      // Dobivanje broja računa iz baze ili generiranje privremenog ako ne postoji
      let invoiceNumber = "i450";
      
      // Ako postoji faktura u bazi, koristi njen broj
      if (orderWithItems.invoice && orderWithItems.invoice.invoiceNumber) {
        invoiceNumber = orderWithItems.invoice.invoiceNumber;
        console.log("Korištenje stvarnog broja računa iz baze:", invoiceNumber);
      } else {
        // Ako nema fakture, koristimo ID narudžbe za generiranje
        const baseNumber = 450;
        invoiceNumber = orderWithItems.id < baseNumber ? `i${baseNumber}` : `i${orderWithItems.id}`;
        console.log("Korištenje privremenog broja računa:", invoiceNumber);
      }
      
      // Priprema podataka za invoice
      const invoiceItems = orderItems.map(item => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        price: typeof item.price === 'string' ? item.price : item.price.toString(),
        selectedScent: item.scentName || undefined,
        selectedColor: item.colorName || undefined,
        hasMultipleColors: item.hasMultipleColors || (item.colorIds && typeof item.colorIds === 'string' && item.colorIds.includes('['))
      }));
      
      // Formatiranje datuma
      const orderDate = new Date(orderWithItems.createdAt);
      const formattedDate = orderDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      // Priprema podataka za generiranje PDF-a
      const invoiceData = {
        invoiceNumber,
        createdAt: formattedDate,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        address: orderWithItems.shippingAddress || user.address || '',
        city: orderWithItems.shippingCity || user.city || '',
        postalCode: orderWithItems.shippingPostalCode || user.postalCode || '',
        country: orderWithItems.shippingCountry || user.country || '',
        email: user.email || '',
        phone: user.phone || '',
        customerNote: orderWithItems.customerNote || undefined,
        items: invoiceItems,
        language: lang,
        paymentMethod: orderWithItems.paymentMethod || 'bank_transfer'
      };
      
      // Koristi zajedničku funkciju za generiranje PDF-a
      generateInvoicePdf(invoiceData);
      
      // Uspješno završeno
      toast({
        title: lang === 'hr' ? "Račun preuzet" : lang === 'de' ? "Rechnung heruntergeladen" : "Invoice downloaded",
        description: lang === 'hr' ? "Račun je uspješno preuzet" : lang === 'de' ? "Rechnung wurde erfolgreich heruntergeladen" : "Invoice has been successfully downloaded",
      });
    } catch (error) {
      console.error("Pogreška pri generiranju PDF-a:", error);
      toast({
        title: "Greška pri generiranju računa",
        description: "Došlo je do pogreške prilikom generiranja PDF računa.",
        variant: "destructive",
      });
    } finally {
      setGeneratingInvoice(false);
    }
  };
  
  // Prijevodi za UI
  const translations = {
    hr: {
      downloadInvoice: "Preuzmi račun",
      generateInvoice: "Generiraj račun",
      selectLanguage: "Odaberi jezik",
      croatian: "Hrvatski",
      english: "Engleski",
      german: "Njemački",
      orderDetails: "Detalji narudžbe",
      orderNumber: "Broj narudžbe",
      orderDate: "Datum narudžbe",
      orderStatus: "Status narudžbe",
      paymentMethod: "Način plaćanja",
      paymentStatus: "Status plaćanja",
      shippingAddress: "Adresa za dostavu",
      customerNote: "Napomena kupca",
      orderItems: "Stavke narudžbe",
      product: "Proizvod",
      quantity: "Količina",
      price: "Cijena",
      total: "Ukupno",
      back: "Natrag na moje narudžbe",
      includingVAT: "Prikazane cijene uključuju PDV."
    },
    en: {
      downloadInvoice: "Download Invoice",
      generateInvoice: "Generate Invoice",
      selectLanguage: "Select Language",
      croatian: "Croatian",
      english: "English",
      german: "German",
      orderDetails: "Order Details",
      orderNumber: "Order Number",
      orderDate: "Order Date",
      orderStatus: "Order Status",
      paymentMethod: "Payment Method",
      paymentStatus: "Payment Status",
      shippingAddress: "Shipping Address",
      customerNote: "Customer Note",
      orderItems: "Order Items",
      product: "Product",
      quantity: "Quantity",
      price: "Price",
      total: "Total",
      back: "Back to My Orders",
      includingVAT: "Prices shown include VAT."
    },
    de: {
      downloadInvoice: "Rechnung herunterladen",
      generateInvoice: "Rechnung generieren",
      selectLanguage: "Sprache auswählen",
      croatian: "Kroatisch",
      english: "Englisch",
      german: "Deutsch",
      orderDetails: "Bestelldetails",
      orderNumber: "Bestellnummer",
      orderDate: "Bestelldatum",
      orderStatus: "Bestellstatus",
      paymentMethod: "Zahlungsart",
      paymentStatus: "Zahlungsstatus",
      shippingAddress: "Lieferadresse",
      customerNote: "Kundenhinweis",
      orderItems: "Bestellpositionen",
      product: "Produkt",
      quantity: "Menge",
      price: "Preis",
      total: "Gesamt",
      back: "Zurück zu Meinen Bestellungen",
      includingVAT: "Angezeigte Preise inklusive MwSt."
    }
  };
  
  // Lokalizirani tekstovi
  const t = translations[selectedLanguage];
  
  // Provjera stanja učitavanja i greške
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !orderWithItems) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Greška</CardTitle>
            <CardDescription>
              Narudžba nije pronađena ili nemate pristup ovoj narudžbi.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={navigateBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Natrag na moje narudžbe
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Izračun ukupne cijene svake stavke
  const orderItemsWithTotals = orderItems?.map(item => {
    const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
    const itemTotal = itemPrice * item.quantity;
    return { ...item, total: itemTotal };
  }) || [];

  return (
    <>
      <Helmet>
        <title>Detalji narudžbe #{orderWithItems.id} | Kerzenwelt by Dani</title>
      </Helmet>
      
      <Header />
      
      <div className="container mx-auto py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
          <Button 
            onClick={navigateBack}
            variant="outline" 
            className="mb-4 sm:mb-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back}
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedLanguage}
              onValueChange={(value) => setSelectedLanguage(value as "hr" | "en" | "de")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.selectLanguage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hr">{t.croatian}</SelectItem>
                <SelectItem value="en">{t.english}</SelectItem>
                <SelectItem value="de">{t.german}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={generateInvoice}
              disabled={generatingInvoice}
            >
              {generatingInvoice ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.generateInvoice}...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {orderWithItems.invoice ? t.downloadInvoice : t.generateInvoice}
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t.orderDetails}</CardTitle>
            <CardDescription>
              {t.orderNumber}: #{orderWithItems.id} 
              {orderWithItems.invoice && (
                <> | {t.downloadInvoice}: {orderWithItems.invoice.invoiceNumber}</>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.orderDetails}</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">{t.orderDate}:</span>{" "}
                    {format(new Date(orderWithItems.createdAt), 'dd.MM.yyyy.')}
                  </div>
                  <div>
                    <span className="font-medium">{t.orderStatus}:</span>{" "}
                    <OrderStatusBadge status={orderWithItems.status} />
                  </div>
                  <div>
                    <span className="font-medium">{t.paymentMethod}:</span>{" "}
                    {getPaymentMethodText(orderWithItems.paymentMethod)}
                  </div>
                  <div>
                    <span className="font-medium">{t.paymentStatus}:</span>{" "}
                    {orderWithItems.paymentStatus === 'completed' ? 'Plaćeno' : 'Na čekanju'}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.shippingAddress}</h3>
                <div className="space-y-1">
                  {orderWithItems.shippingFullName && <div>{orderWithItems.shippingFullName}</div>}
                  {orderWithItems.shippingAddress && <div>{orderWithItems.shippingAddress}</div>}
                  {orderWithItems.shippingPostalCode && orderWithItems.shippingCity && (
                    <div>{orderWithItems.shippingPostalCode} {orderWithItems.shippingCity}</div>
                  )}
                  {orderWithItems.shippingCountry && <div>{orderWithItems.shippingCountry}</div>}
                  {orderWithItems.shippingPhone && <div>{orderWithItems.shippingPhone}</div>}
                </div>
              </div>
            </div>
            
            {orderWithItems.customerNote && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{t.customerNote}</h3>
                <p>{orderWithItems.customerNote}</p>
              </div>
            )}
            
            <Separator className="my-6" />
            
            <h3 className="text-lg font-semibold mb-4">{t.orderItems}</h3>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">{t.product}</TableHead>
                  <TableHead className="text-center">{t.quantity}</TableHead>
                  <TableHead className="text-right">{t.price}</TableHead>
                  <TableHead className="text-right">{t.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItemsWithTotals.map((item) => {
                  const itemTotal = parseFloat(typeof item.price === 'string' ? item.price : item.price.toString()) * item.quantity;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">{item.productName}</div>
                        <div className="flex flex-col text-sm text-muted-foreground mt-1">
                          {item.scentName && (
                            <span>Miris: {item.scentName}</span>
                          )}
                          
                          {item.colorName && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span>
                                {item.hasMultipleColors ? 'Boje:' : 'Boja:'}
                              </span>
                              {/* Ako imamo više boja, razdvojene su zarezom */}
                              {item.colorName.split(',').map((color, index) => {
                                const trimmedColor = color.trim();
                                // Traži po imenu boje među svim proizvodima
                                const productColor = products?.flatMap(p => 
                                  p.colors?.filter(c => c.name.toLowerCase() === trimmedColor.toLowerCase()) || []
                                )[0];
                                
                                return (
                                  <span key={index} className="flex items-center gap-1">
                                    {productColor && (
                                      <span 
                                        className="inline-block w-3 h-3 rounded-full" 
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
              {t.includingVAT}
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}