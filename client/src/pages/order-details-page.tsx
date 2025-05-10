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
  
  // Funkcija za generiranje računa
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
      // Pripremamo za preuzimanje HTML fakturu prema priloženom primjeru
      const currentDate = new Date();
      const orderDate = format(currentDate, 'dd.MM.yyyy'); // Format datuma: dd.mm.yyyy
      const invoiceNumber = `${currentDate.getFullYear()}-${orderWithItems.id.toString().padStart(4, '0')}`;
      
      // Stvaramo HTML sadržaj prema zadanom formatu
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rechnung ${invoiceNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.5;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .logo-container {
              display: flex;
              align-items: center;
            }
            .logo {
              font-size: 40px;
              color: #D4AF37;
              font-family: serif;
              margin-right: 10px;
            }
            .company-name {
              font-size: 24px;
              color: #D4AF37;
              font-weight: bold;
            }
            .company-info {
              font-size: 12px;
              line-height: 1.4;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .divider {
              border-top: 1px solid #ddd;
              margin: 20px 0;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 10px;
            }
            .customer-info {
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 10px;
              text-align: left;
            }
            thead {
              background-color: #f5f5f5;
            }
            .amount-summary {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              font-weight: bold;
              background-color: #f5f5f5;
              padding: 10px;
              text-align: right;
            }
            .payment-info {
              margin-top: 30px;
            }
            .thank-you {
              text-align: center;
              margin: 40px 0 20px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: #666;
              margin-top: 40px;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-section">
                <div class="logo-container">
                  <div class="logo">K</div>
                  <div>
                    <div class="company-name">Kerzenwelt by Dani</div>
                    <div class="company-info">
                      Ossiacher Zeile 30, 9500 Villach, Österreich<br>
                      Email: daniela.svoboda2@gmail.com
                    </div>
                  </div>
                </div>
              </div>
              <div class="invoice-details">
                <div class="invoice-title">RECHNUNG</div>
                <div>Rechnungsnummer: ${invoiceNumber}</div>
                <div>Rechnungsdatum: ${orderDate}</div>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="customer-info">
              <div class="section-title">Käuferinformationen:</div>
              <div>${user.firstName || ''} ${user.lastName || ''}</div>
              <div>Email: ${user.email || ''}</div>
              <div>Lieferadresse: ${orderWithItems.shippingAddress || user.address || ''}</div>
              <div>${orderWithItems.shippingPostalCode || user.postalCode || ''} ${orderWithItems.shippingCity || user.city || ''}</div>
              <div>${orderWithItems.shippingCountry || user.country || 'Österreich'}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="section-title">Bestellpositionen:</div>
            
            <table>
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Menge</th>
                  <th>Preis/Stück</th>
                  <th>Gesamt</th>
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
          productName += " ";
          if (item.selectedScent) {
            productName += item.selectedScent;
          }
          if (item.selectedColor) {
            productName += " - " + item.selectedColor;
          }
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
      
      // Dodajemo ukupne iznose i završavamo HTML
      // Shippingcost
      const shippingCost = orderWithItems.shippingCost ? parseFloat(orderWithItems.shippingCost) : 0.00;
      const total = parseFloat(orderWithItems.total) || subtotal + shippingCost;
      
      htmlContent += `
              </tbody>
            </table>
            
            <div class="amount-summary">
              <div>Zwischensumme: ${subtotal.toFixed(2)} €</div>
              <div>Dostava: ${shippingCost.toFixed(2)} €</div>
              <div class="total-row">GESAMTBETRAG: ${total.toFixed(2)} €</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="payment-info">
              <div class="section-title">Zahlungsinformationen:</div>
              <div>Zahlungsmethode: ${getPaymentMethodText(orderWithItems.paymentMethod || 'bank_transfer', 'de')}</div>
              <div>Zahlungsstatus: ${orderWithItems.paymentStatus === 'completed' ? 'Bezahlt' : 'Ausstehend'}</div>
            </div>
            
            <div class="thank-you">
              Vielen Dank für Ihre Bestellung!
            </div>
            
            <div class="footer">
              Kerzenwelt by Dani | Ossiacher Zeile 30, 9500 Villach, Österreich | Email: daniela.svoboda2@gmail.com | Telefon: 004366038787621<br>
              Dies ist eine automatisch generierte Rechnung und ist ohne Unterschrift und Stempel gültig.<br>
              Steuernummer: 61 154/7175<br>
              Gemäss § 6 Abs. 1 Z 27 UStG. (Kleinunternehmerregelung) wird keine Umsatzsteuer berechnet.
            </div>
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
        <title>{`Narudžba #${orderWithItems.id} | Kerzenwelt by Dani`}</title>
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