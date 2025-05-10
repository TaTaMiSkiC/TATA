import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { User, Order } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
import { Loader2, PackageOpen, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";

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

export default function OrdersPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Preusmjeri na stranicu za prijavu ako korisnik nije prijavljen
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);
  
  // Dohvati narudžbe korisnika
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/orders/user"],
    enabled: !!user,
  });
  
  if (!user) {
    return null;
  }
  
  return (
    <>
      <Helmet>
        <title>Moje narudžbe | Kerzenwelt by Dani</title>
        <meta name="description" content="Pregled vaših narudžbi u trgovini Kerzenwelt by Dani." />
      </Helmet>
      
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Moje narudžbe</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Povijest narudžbi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <p>Došlo je do greške prilikom učitavanja narudžbi.</p>
                <p className="text-sm mt-2">Molimo pokušajte ponovno kasnije.</p>
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broj narudžbe</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Ukupno</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Način plaćanja</TableHead>
                      <TableHead>Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          {order.createdAt 
                            ? format(new Date(order.createdAt), 'dd.MM.yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {parseFloat(String(order.total)).toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          {order.paymentMethod === 'bank_transfer' 
                            ? 'Bankovni transfer' 
                            : order.paymentMethod === 'paypal' 
                              ? 'PayPal' 
                              : order.paymentMethod}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.location.href = `/orders/${order.id}`}
                          >
                            Detalji
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <PackageOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nemate nijednu narudžbu</h3>
                <p className="text-muted-foreground mt-2 mb-6">
                  Vrijeme je da započnete svoju prvu kupovinu!
                </p>
                <Button 
                  onClick={() => window.location.href = '/products'}
                  className="mt-2"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Pregledaj proizvode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}