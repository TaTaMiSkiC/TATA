import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useParams, useLocation } from "wouter";
import { 
  Order, 
  OrderItem as OrderItemType,
  Product 
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

interface OrderItemWithProduct extends OrderItemType {
  product: Product;
  selectedScent?: string;
  selectedColor?: string;
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
}

function OrderStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'processing':
      return <PackageCheck className="h-5 w-5 text-blue-500" />;
    case 'shipped':
      return <Truck className="h-5 w-5 text-blue-700" />;
    case 'delivered':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
}

function OrderStatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  
  switch (status) {
    case 'pending':
      variant = "outline";
      break;
    case 'processing':
      variant = "secondary";
      break;
    case 'cancelled':
      variant = "destructive";
      break;
    default:
      variant = "default";
      break;
  }
  
  return (
    <Badge variant={variant} className="ml-2">
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

  // Kombiniranje podataka o narudžbi i stavkama
  const orderWithItems: OrderWithItems | undefined = order && orderItems ? {
    ...order,
    items: orderItems || [],
  } : undefined;
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  const isLoading = isLoadingOrder || isLoadingItems || isLoadingProducts;
  const error = orderError || itemsError;
  
  // Funkcija za prevođenje načina plaćanja
  const getPaymentMethodText = (method: string, lang: string) => {
    switch(method) {
      case 'cash': 
        return lang === 'hr' ? 'Gotovina' : 'Cash';
      case 'bank_transfer': 
        return lang === 'hr' ? 'Bankovni transfer' : 'Bank Transfer';
      case 'paypal': 
        return 'PayPal';
      case 'credit_card':
        return lang === 'hr' ? 'Kreditna kartica' : 'Credit Card';
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
      // Pripremamo za preuzimanje HTML fakturu umjesto PDF-a
      // Ovo je privremeno rješenje dok ne popravimo probleme s PDF generiranjem
      const orderDate = new Date(orderWithItems.createdAt).toLocaleDateString();
      
      // Stvaramo HTML sadržaj
      let htmlContent = `
        <html>
        <head>
          <title>Račun #${orderWithItems.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-section { margin-bottom: 20px; }
            .info-section h3 { margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { text-align: right; margin-top: 20px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            .company-info { margin-top: 50px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RAČUN</h1>
            <p>Broj računa: INV-${orderWithItems.id}</p>
            <p>Datum: ${orderDate}</p>
          </div>
          
          <div class="info-section">
            <h3>Prodavatelj:</h3>
            <p>Kerzenwelt by Dani</p>
            <p>Ossiacher Zeile 30/3</p>
            <p>9500 Villach, Austrija</p>
          </div>
          
          <div class="info-section">
            <h3>Kupac:</h3>
            <p>${user.firstName || ''} ${user.lastName || ''}</p>
            <p>${user.address || ''}</p>
            <p>${user.postalCode || ''} ${user.city || ''}</p>
            <p>${user.country || ''}</p>
            ${user.email ? `<p>Email: ${user.email}</p>` : ''}
            ${user.phone ? `<p>Telefon: ${user.phone}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Stavka</th>
                <th>Količina</th>
                <th>Cijena</th>
                <th>Ukupno</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // Dodajemo stavke
      let subtotal = 0;
      for (const item of orderWithItems.items) {
        const itemTotal = parseFloat(item.price) * item.quantity;
        subtotal += itemTotal;
        
        // Generiramo naziv proizvoda s opcijama
        let productName = '';
        if (item.product && typeof item.product === 'object' && item.product.name) {
          productName = item.product.name;
        } else if (item.productName) {
          productName = item.productName;
        } else {
          productName = `Proizvod #${item.productId}`;
        }
        
        // Dodajemo opcije ako postoje
        if (item.selectedScent || item.selectedColor) {
          productName += " (";
          if (item.selectedScent) {
            productName += item.selectedScent;
            if (item.selectedColor) productName += ", ";
          }
          if (item.selectedColor) {
            productName += item.selectedColor;
          }
          productName += ")";
        }
        
        htmlContent += `
          <tr>
            <td>${productName}</td>
            <td>${item.quantity}</td>
            <td>${parseFloat(item.price).toFixed(2)} €</td>
            <td>${itemTotal.toFixed(2)} €</td>
          </tr>
        `;
      }
      
      // Izračun PDV-a i ukupnog iznosa
      const tax = subtotal * 0.25;
      const total = subtotal + tax;
      
      // Dodajemo ukupne iznose i završavamo HTML
      htmlContent += `
            </tbody>
          </table>
          
          <div class="totals">
            <p>Međuzbroj: ${subtotal.toFixed(2)} €</p>
            <p>PDV (25%): ${tax.toFixed(2)} €</p>
            <p><strong>UKUPNO: ${total.toFixed(2)} €</strong></p>
            <p>Način plaćanja: ${orderWithItems.paymentMethod ? getPaymentMethodText(orderWithItems.paymentMethod, 'hr') : 'Bankovni transfer'}</p>
          </div>
          
          <div class="company-info">
            <p>Steuernummer: 61 154/7175</p>
            <p>Poslovanje prema regulaciji malog biznisa u Austriji.</p>
          </div>
          
          <div class="footer">
            <p>Hvala na kupnji!</p>
          </div>
        </body>
        </html>
      `;
      
      // Konvertiramo HTML u Blob i stvaramo URL za preuzimanje
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Stvaramo link za preuzimanje i simuliramo klik
      const a = document.createElement('a');
      a.href = url;
      a.download = `racun-${orderWithItems.id}.html`;
      document.body.appendChild(a);
      a.click();
      
      // Čistimo
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Račun generiran",
        description: "HTML verzija računa je preuzeta. Otvorite je u pregledniku za ispis.",
      });
    } catch (error) {
      console.error("Greška pri generiranju računa:", error);
      toast({
        title: "Greška pri generiranju računa",
        description: "Došlo je do pogreške prilikom generiranja računa.",
        variant: "destructive",
      });
    } finally {
      setGeneratingInvoice(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !orderWithItems) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Greška pri učitavanju narudžbe</h2>
        <p className="mb-4">Došlo je do greške prilikom učitavanja podataka o narudžbi.</p>
        <Button variant="outline" onClick={() => navigate('/account/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Povratak na popis narudžbi
        </Button>
      </div>
    );
  }

  const totalItems = orderWithItems.items.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <>
      <Helmet>
        <title>Narudžba #{orderWithItems.id} | Kerzenwelt by Dani</title>
        <meta name="description" content={`Detalji narudžbe #${orderWithItems.id} - Kerzenwelt by Dani`} />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            Narudžba #{orderWithItems.id}
            <OrderStatusBadge status={orderWithItems.status} />
          </h1>
          
          <Button variant="outline" onClick={() => navigate('/account/orders')}>
            <ArrowLeft className="h-4 w-4" />
            Natrag na narudžbe
          </Button>
        </div>
        
        {orderWithItems && (
          <div className="flex items-center gap-3">
            <Select 
              value={selectedLanguage} 
              onValueChange={(value: 'hr' | 'en' | 'de') => setSelectedLanguage(value)}
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
                <span className="text-muted-foreground">Ukupno stavki:</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Način plaćanja:</span>
                <span>
                  {orderWithItems.paymentMethod ? getPaymentMethodText(orderWithItems.paymentMethod, 'hr') : 'Nije specificirano'}
                </span>
              </div>
              {orderWithItems.paymentStatus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status plaćanja:</span>
                  <span>{orderWithItems.paymentStatus === 'completed' ? 'Plaćeno' : 'Na čekanju'}</span>
                </div>
              )}
              {orderWithItems.transactionId && (
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
              {orderWithItems.shippingFullName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ime:</span>
                  <span>{orderWithItems.shippingFullName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adresa:</span>
                <span>{orderWithItems.shippingAddress || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grad:</span>
                <span>{orderWithItems.shippingCity || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Poštanski broj:</span>
                <span>{orderWithItems.shippingPostalCode || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Država:</span>
                <span>{orderWithItems.shippingCountry || 'N/A'}</span>
              </div>
              {orderWithItems.shippingPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon:</span>
                  <span>{orderWithItems.shippingPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sažetak cijene</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Podzbir:</span>
                <span>{orderWithItems.subtotal || '0.00'} €</span>
              </div>
              {orderWithItems.discountAmount && parseFloat(orderWithItems.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Popust:</span>
                  <span className="text-red-500">-{orderWithItems.discountAmount} €</span>
                </div>
              )}
              {orderWithItems.shippingCost && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dostava:</span>
                  <span>{orderWithItems.shippingCost} €</span>
                </div>
              )}
              {orderWithItems.taxAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PDV (25%):</span>
                  <span>{orderWithItems.taxAmount} €</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Ukupno:</span>
                <span>{orderWithItems.total} €</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Stavke narudžbe</CardTitle>
            <CardDescription>
              {orderWithItems.items.length} {orderWithItems.items.length === 1 ? 'proizvod' : 'proizvoda'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Proizvod</TableHead>
                  <TableHead className="text-center">Količina</TableHead>
                  <TableHead className="text-right">Cijena</TableHead>
                  <TableHead className="text-right">Ukupno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderWithItems.items.map((item) => {
                  const productName = item.product?.name || 'Proizvod';
                  const scent = item.selectedScent ? ` - ${item.selectedScent}` : '';
                  const color = item.selectedColor ? ` - ${item.selectedColor}` : '';
                  const itemTotal = parseFloat(item.price) * item.quantity;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">
                          {productName}
                          {scent}{color}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{parseFloat(item.price).toFixed(2)} €</TableCell>
                      <TableCell className="text-right">{itemTotal.toFixed(2)} €</TableCell>
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