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
  Loader2, 
  ArrowLeft, 
  PackageCheck, 
  AlertTriangle,
  Clock,
  Truck,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

interface OrderItemWithProduct extends OrderItemType {
  product: Product;
  selectedScent?: string;
  selectedColor?: string;
}

interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
  subtotalAmount?: string;
  shippingAmount?: string;
  taxAmount?: string;
  shippingFullName?: string;
  shippingPhone?: string;
  transactionId?: string;
}

// Komponenta za prikaz statusnih ikona
function OrderStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-8 w-8 text-muted-foreground" />;
    case 'processing':
      return <PackageCheck className="h-8 w-8 text-secondary-foreground" />;
    case 'shipped':
      return <Truck className="h-8 w-8 text-primary" />;
    case 'completed':
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-8 w-8 text-destructive" />;
    default:
      return <AlertTriangle className="h-8 w-8 text-muted-foreground" />;
  }
}

// Komponenta za prikaz statusa narudžbe s Badge komponentom
function OrderStatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  
  switch (status) {
    case "pending":
      variant = "outline";
      return <Badge variant={variant}>Na čekanju</Badge>;
    case "processing":
      variant = "secondary";
      return <Badge variant={variant}>U obradi</Badge>;
    case "shipped":
      variant = "default";
      return <Badge variant={variant}>Poslano</Badge>;
    case "completed":
      variant = "default";
      return <Badge variant={variant}>Završeno</Badge>;
    case "cancelled":
      variant = "destructive";
      return <Badge variant={variant}>Otkazano</Badge>;
    default:
      return <Badge variant={variant}>{status}</Badge>;
  }
}

// Komponenta za prikaz ljudski čitljivog statusnog teksta
function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Narudžba na čekanju';
    case 'processing':
      return 'Narudžba se obrađuje';
    case 'shipped':
      return 'Narudžba je poslana';
    case 'completed':
      return 'Narudžba je uspješno dovršena';
    case 'cancelled':
      return 'Narudžba je otkazana';
    default:
      return 'Nepoznat status';
  }
}

export default function OrderDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const orderId = params.id;
  const [, setLocation] = useLocation();
  
  // Preusmjeri na stranicu za prijavu ako korisnik nije prijavljen
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);
  
  // Dohvati osnovne informacije o narudžbi
  const { data: order, isLoading: isLoadingOrder, error: orderError } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!user && !!orderId,
  });
  
  // Dohvati stavke narudžbe
  const { data: orderItems, isLoading: isLoadingItems, error: itemsError } = useQuery<OrderItemWithProduct[]>({
    queryKey: [`/api/orders/${orderId}/items`],
    enabled: !!user && !!orderId && !!order,
  });
  
  // Kombiniramo podatke u jednu strukturu
  const orderWithItems: OrderWithItems | undefined = order 
    ? { ...order, items: orderItems || [] }
    : undefined;
    
  const isLoading = isLoadingOrder || isLoadingItems;
  const error = orderError || itemsError;
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Detalji narudžbe | Kerzenwelt by Dani</title>
        <meta name="description" content="Detalji vaše narudžbe u trgovini Kerzenwelt by Dani." />
      </Helmet>
      
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.location.href = '/orders'}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Natrag na narudžbe
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Detalji narudžbe #{orderId}</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Došlo je do greške prilikom učitavanja detalja narudžbe.</p>
          <p className="text-sm mt-2">Molimo pokušajte ponovno kasnije.</p>
        </div>
      ) : orderWithItems ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Glavni detalji narudžbe */}
          <Card className="md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Narudžba #{orderWithItems.id}</CardTitle>
                <CardDescription>
                  Naručeno {orderWithItems.createdAt 
                    ? format(new Date(orderWithItems.createdAt), 'dd.MM.yyyy u HH:mm')
                    : 'N/A'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusIcon status={orderWithItems.status} />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <OrderStatusBadge status={orderWithItems.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-2">{getStatusText(orderWithItems.status)}</h3>
                <p className="text-muted-foreground">
                  {orderWithItems.status === 'pending' && 'Vaša narudžba je zaprimljena i čeka obradu.'}
                  {orderWithItems.status === 'processing' && 'Vaša narudžba se trenutno obrađuje i priprema za slanje.'}
                  {orderWithItems.status === 'shipped' && 'Vaša narudžba je poslana i uskoro će biti isporučena.'}
                  {orderWithItems.status === 'completed' && 'Vaša narudžba je uspješno isporučena. Hvala na povjerenju!'}
                  {orderWithItems.status === 'cancelled' && 'Vaša narudžba je otkazana. Za više informacija kontaktirajte nas.'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium mb-2">Podaci o narudžbi</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Datum narudžbe:</span> {orderWithItems.createdAt 
                      ? format(new Date(orderWithItems.createdAt), 'dd.MM.yyyy HH:mm')
                      : 'N/A'}</p>
                    <p><span className="text-muted-foreground">Način plaćanja:</span> {orderWithItems.paymentMethod === 'bank_transfer' 
                      ? 'Bankovni transfer' 
                      : orderWithItems.paymentMethod === 'paypal' 
                        ? 'PayPal' 
                        : orderWithItems.paymentMethod}</p>
                    {orderWithItems.transactionId && (
                      <p><span className="text-muted-foreground">ID transakcije:</span> {orderWithItems.transactionId}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Podaci o dostavi</h3>
                  <div className="text-sm space-y-1">
                    {orderWithItems.shippingFullName && (
                      <p><span className="text-muted-foreground">Ime i prezime:</span> {orderWithItems.shippingFullName}</p>
                    )}
                    <p><span className="text-muted-foreground">Adresa:</span> {orderWithItems.shippingAddress || 'Nije navedeno'}</p>
                    <p><span className="text-muted-foreground">Grad:</span> {orderWithItems.shippingCity || 'Nije navedeno'}{orderWithItems.shippingPostalCode ? `, ${orderWithItems.shippingPostalCode}` : ''}</p>
                    <p><span className="text-muted-foreground">Država:</span> {orderWithItems.shippingCountry || 'Nije navedeno'}</p>
                    {orderWithItems.shippingPhone && (
                      <p><span className="text-muted-foreground">Telefon:</span> {orderWithItems.shippingPhone}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium mb-4">Stavke narudžbe</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proizvod</TableHead>
                      <TableHead>Cijena</TableHead>
                      <TableHead>Količina</TableHead>
                      <TableHead className="text-right">Ukupno</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderWithItems.items && orderWithItems.items.length > 0 ? (
                      orderWithItems.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-muted rounded-md overflow-hidden">
                                {item.product && item.product.imageUrl ? (
                                  <img 
                                    src={item.product.imageUrl} 
                                    alt={item.product.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-primary/10"></div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{item.product ? item.product.name : 'Proizvod'}</p>
                                {item.selectedScent && <p className="text-xs">Miris: {item.selectedScent}</p>}
                                {item.selectedColor && <p className="text-xs">Boja: {item.selectedColor}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{parseFloat(String(item.price)).toFixed(2)} €</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {(parseFloat(String(item.price)) * item.quantity).toFixed(2)} €
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          Nema stavki narudžbe
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-end border-t pt-6">
              <div className="space-y-2 text-right min-w-[200px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Međuzbroj:</span>
                  <span>{parseFloat(String(orderWithItems.subtotalAmount || orderWithItems.total)).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dostava:</span>
                  <span>{parseFloat(String(orderWithItems.shippingAmount || "0")).toFixed(2)} €</span>
                </div>
                {orderWithItems.taxAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PDV:</span>
                    <span>{parseFloat(String(orderWithItems.taxAmount)).toFixed(2)} €</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Ukupno:</span>
                  <span>{parseFloat(String(orderWithItems.total)).toFixed(2)} €</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Narudžba nije pronađena</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Narudžba s brojem #{orderId} ne postoji ili nemate pristup ovoj narudžbi.
          </p>
          <Button 
            onClick={() => window.location.href = '/orders'}
            className="mt-2"
          >
            Povratak na narudžbe
          </Button>
        </div>
      )}
    </div>
  );
}