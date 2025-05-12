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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Logo import
import logoImg from "@assets/Kerzenwelt by Dani.png";

// Import funkcija za generiranje računa
import { generateInvoicePdf } from "@/pages/admin/new-invoice-generator";

// OrderItemWithProduct je već importiran iz @shared/schema

// Definicija strukture fakture
interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number | null;
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  customerAddress: string | null;
  customerCity: string | null;
  customerPostalCode: string | null;
  customerCountry: string | null;
  customerPhone: string | null;
  total: string;
  subtotal: string;
  tax: string;
  notes: string | null;
  language: string;
  paymentMethod: string;
  createdAt: Date;
}

// Definicija strukture narudžbe s fakturom
interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
  invoice?: Invoice;
  shippingFullName?: string;
  shippingPhone?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  transactionId?: string;
  tax?: string; // Dodano za podržavanje PDV polja
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const orderId = parseInt(id as string, 10);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState("hr");
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  
  // Dohvat narudžbe s API-ja
  const { 
    data: orderWithItems,
    isLoading, 
    error,
    refetch
  } = useQuery<OrderWithItems, Error>({
    queryKey: [`/api/orders/${orderId}`],
    queryFn: ({ queryKey }) => {
      return fetch(queryKey[0])
        .then(response => {
          if (!response.ok) {
            throw new Error('Narudžba nije pronađena');
          }
          return response.json();
        });
    },
    enabled: Boolean(orderId) && Boolean(user),
  });
  
  // Funkcija za prevođenje statusa narudžbe
  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending': return 'Na čekanju';
      case 'processing': return 'U obradi';
      case 'shipped': return 'Poslano';
      case 'delivered': return 'Isporučeno';
      case 'cancelled': return 'Otkazano';
      default: return status;
    }
  };
  
  // Funkcija za dobivanje boje statusa
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-orange-500';
      case 'processing': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Funkcija za formatiranje datuma
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "dd.MM.yyyy");
  };
  
  // Funkcija za prevođenje načina plaćanja
  const getPaymentMethodText = (method: string, lang: string) => {
    if (!method) return lang === 'hr' ? 'Nije definirano' : lang === 'de' ? 'Nicht definiert' : 'Not defined';
    
    switch(method) {
      case 'cash': 
        return lang === 'hr' ? 'Gotovina' : 
               lang === 'de' ? 'Bargeld' : 'Cash';
      case 'bank_transfer': 
        return lang === 'hr' ? 'Bankovni prijenos' : 
               lang === 'de' ? 'Banküberweisung' : 'Bank transfer';
      case 'paypal': 
        return 'PayPal';
      case 'credit_card':
        return lang === 'hr' ? 'Kreditna kartica' : 
               lang === 'de' ? 'Kreditkarte' : 'Credit card';
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
    if (!orderWithItems || !user) return;
    
    setGeneratingInvoice(true);
    
    // Dodajmo dodatno logiranje
    console.log("Podaci o narudžbi:", JSON.stringify(orderWithItems));
    console.log("Način plaćanja:", orderWithItems.paymentMethod || 'Nije definirano');
    
    // Sigurna provjera stavki narudžbe
    if (!orderWithItems.items || !Array.isArray(orderWithItems.items) || orderWithItems.items.length === 0) {
      console.error("Nema stavki narudžbe ili nije ispravan format:", orderWithItems.items);
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
      
      // Pripremimo podatke za generateInvoicePdf funkciju u istom formatu kao admin panel
      const invoiceData = {
        invoiceNumber: orderWithItems.invoice?.invoiceNumber || `TEMP-${orderWithItems.id}`,
        createdAt: orderWithItems.createdAt,
        customerName: orderWithItems.shippingFullName || user.username,
        firstName: orderWithItems.shippingFullName?.split(' ')[0] || user.username,
        lastName: orderWithItems.shippingFullName?.split(' ').slice(1).join(' ') || "",
        address: orderWithItems.shippingAddress || "",
        city: orderWithItems.shippingCity || "",
        postalCode: orderWithItems.shippingPostalCode || "",
        country: orderWithItems.shippingCountry || "",
        email: user.email || "",
        phone: orderWithItems.shippingPhone || "",
        items: orderWithItems.items || [],
        language: lang,
        paymentMethod: orderWithItems.paymentMethod || "cash",
        subtotal: orderWithItems.subtotal || "0",
        tax: orderWithItems.tax || "0",
        total: orderWithItems.total || "0",
        notes: orderWithItems.customerNote || "",
      };
      
      // Koristimo zajedničku funkciju za generiranje PDF-a
      generateInvoicePdf(invoiceData, toast);
    } catch (error) {
      console.error("Greška kod generiranja PDF-a:", error);
      toast({
        title: "Greška",
        description: "Nije moguće generirati račun. Pokušajte ponovno.",
        variant: "destructive",
      });
    } finally {
      setGeneratingInvoice(false);
    }
  };
  
  // Računanje ukupne količine stavki
  const totalItems = orderWithItems?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  
  return (
    <>
      <Helmet>
        <title>{`Detalji narudžbe #${orderId} | Kerzenwelt by Dani`}</title>
        <meta name="description" content={`Pregledajte detalje vaše narudžbe #${orderId} uključujući stavke, adresu dostave i status.`} />
      </Helmet>
      
      <Header />
      
      <div className="container mx-auto my-8 px-4">
        <div className="flex items-center space-x-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/moje-narudzbe')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Natrag na narudžbe
          </Button>
          
          {orderWithItems && (
            <h1 className="text-2xl font-bold">
              Narudžba #{orderWithItems.id}
            </h1>
          )}
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        )}
        
        {error && (
          <div className="text-center my-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold mt-4">Greška pri dohvaćanju narudžbe</h2>
            <p className="text-muted-foreground mt-2">
              {error.message || "Nije moguće dohvatiti podatke o narudžbi. Molimo pokušajte ponovno."}
            </p>
            <Button
              className="mt-4"
              onClick={() => refetch()}
            >
              Pokušaj ponovno
            </Button>
          </div>
        )}
        
        {orderWithItems && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Badge
                className={`px-3 py-1 ${getStatusColor(orderWithItems.status)}`}
              >
                {getStatusText(orderWithItems.status)}
              </Badge>
              <span className="text-muted-foreground">
                {formatDate(orderWithItems.createdAt)}
              </span>
            </div>
            
            <Select
              value={selectedLanguage}
              onValueChange={setSelectedLanguage}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Jezik računa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hr">Hrvatski</SelectItem>
                <SelectItem value="en">Engleski</SelectItem>
                <SelectItem value="de">Njemački</SelectItem>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Podaci o narudžbi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Datum:</span>
                <span>{orderWithItems && formatDate(orderWithItems.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ukupni iznos:</span>
                <span className="font-medium">{orderWithItems && parseFloat(orderWithItems.total).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ukupno stavki:</span>
                <span>{totalItems}</span>
              </div>
              
              {orderWithItems?.invoice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Broj računa:</span>
                  <span className="font-medium text-primary">{orderWithItems.invoice.invoiceNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Način plaćanja:</span>
                <span>
                  {orderWithItems?.paymentMethod ? getPaymentMethodText(orderWithItems.paymentMethod, 'hr') : 'Nije specificirano'}
                </span>
              </div>
              {orderWithItems?.paymentStatus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status plaćanja:</span>
                  <span>{orderWithItems.paymentStatus === 'completed' ? 'Plaćeno' : 'Na čekanju'}</span>
                </div>
              )}
              {orderWithItems?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID transakcije:</span>
                  <span className="font-mono text-xs">{orderWithItems.transactionId}</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Dostava</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orderWithItems?.shippingFullName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ime:</span>
                  <span>{orderWithItems.shippingFullName}</span>
                </div>
              )}
              {orderWithItems?.shippingAddress && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adresa:</span>
                  <span>{orderWithItems.shippingAddress}</span>
                </div>
              )}
              {(orderWithItems?.shippingCity || orderWithItems?.shippingPostalCode) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grad, poštanski broj:</span>
                  <span>
                    {orderWithItems.shippingCity}
                    {orderWithItems.shippingPostalCode && `, ${orderWithItems.shippingPostalCode}`}
                  </span>
                </div>
              )}
              {orderWithItems?.shippingCountry && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Država:</span>
                  <span>{orderWithItems.shippingCountry}</span>
                </div>
              )}
              {orderWithItems?.shippingPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon:</span>
                  <span>{orderWithItems.shippingPhone}</span>
                </div>
              )}
              {orderWithItems?.shippingMethod && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Način dostave:</span>
                  <span>{orderWithItems.shippingMethod}</span>
                </div>
              )}
              {orderWithItems?.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Broj za praćenje:</span>
                  <span className="font-mono text-xs">{orderWithItems.trackingNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Status narudžbe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`rounded-full w-6 h-6 flex items-center justify-center 
                    ${['pending', 'processing', 'shipped', 'delivered'].includes(orderWithItems?.status || '') ? 'bg-primary' : 'bg-muted'}`}>
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Zaprimljena</p>
                    <p className="text-sm text-muted-foreground">Narudžba je zaprimljena</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`rounded-full w-6 h-6 flex items-center justify-center 
                    ${['processing', 'shipped', 'delivered'].includes(orderWithItems?.status || '') ? 'bg-primary' : 'bg-muted'}`}>
                    {['processing', 'shipped', 'delivered'].includes(orderWithItems?.status || '') ? 
                      <CheckCircle className="h-4 w-4 text-white" /> : 
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">U obradi</p>
                    <p className="text-sm text-muted-foreground">Vaša narudžba se priprema</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`rounded-full w-6 h-6 flex items-center justify-center 
                    ${['shipped', 'delivered'].includes(orderWithItems?.status || '') ? 'bg-primary' : 'bg-muted'}`}>
                    {['shipped', 'delivered'].includes(orderWithItems?.status || '') ? 
                      <CheckCircle className="h-4 w-4 text-white" /> : 
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Poslano</p>
                    <p className="text-sm text-muted-foreground">Vaša narudžba je poslana</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`rounded-full w-6 h-6 flex items-center justify-center 
                    ${orderWithItems?.status === 'delivered' ? 'bg-primary' : 'bg-muted'}`}>
                    {orderWithItems?.status === 'delivered' ? 
                      <CheckCircle className="h-4 w-4 text-white" /> : 
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Isporučeno</p>
                    <p className="text-sm text-muted-foreground">Vaša narudžba je isporučena</p>
                  </div>
                </div>
                
                {orderWithItems?.status === 'cancelled' && (
                  <div className="flex items-center mt-4">
                    <div className="rounded-full w-6 h-6 flex items-center justify-center bg-destructive">
                      <XCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Otkazano</p>
                      <p className="text-sm text-muted-foreground">Narudžba je otkazana</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {orderWithItems?.customerNote && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Napomena kupca</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{orderWithItems.customerNote}</p>
            </CardContent>
          </Card>
        )}
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Stavke narudžbe</CardTitle>
          </CardHeader>
          <CardContent>
            {orderWithItems?.items && orderWithItems.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proizvod</TableHead>
                    <TableHead>Detalji</TableHead>
                    <TableHead className="text-right">Količina</TableHead>
                    <TableHead className="text-right">Cijena</TableHead>
                    <TableHead className="text-right">Ukupno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderWithItems.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          {item.product && item.product.imageUrl && (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.productName || `Proizvod #${item.productId}`}
                              className="w-12 h-12 object-cover rounded-md"
                            />
                          )}
                          <div>
                            {item.productName || (item.product && item.product.name) || `Proizvod #${item.productId}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.scentName && (
                            <div className="mb-1">
                              <span className="text-muted-foreground">Miris:</span> {item.scentName}
                            </div>
                          )}
                          {item.colorName && (
                            <div>
                              <span className="text-muted-foreground">Boja:</span> {item.colorName}
                            </div>
                          )}
                          {!item.scentName && !item.colorName && (
                            <span className="text-muted-foreground">Standardni proizvod</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{parseFloat(item.price).toFixed(2)} €</TableCell>
                      <TableCell className="text-right">{(parseFloat(item.price) * item.quantity).toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Nema stavki u narudžbi</p>
              </div>
            )}
            
            {orderWithItems && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-end">
                  <span className="w-24 text-muted-foreground">Međuzbroj:</span>
                  <span className="w-24 text-right">{parseFloat(orderWithItems.subtotal).toFixed(2)} €</span>
                </div>
                <div className="flex justify-end">
                  <span className="w-24 text-muted-foreground">PDV (0%):</span>
                  <span className="w-24 text-right">{parseFloat(orderWithItems.tax || "0").toFixed(2)} €</span>
                </div>
                <div className="flex justify-end">
                  <span className="w-24 font-medium">Ukupno:</span>
                  <span className="w-24 text-right font-medium">{parseFloat(orderWithItems.total).toFixed(2)} €</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}