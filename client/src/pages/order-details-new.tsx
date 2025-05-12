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
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ShoppingBag,
  Download,
  Loader2,
  CreditCard,
  Building2,
  Receipt,
  AlertTriangle,
  Truck,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

// Logo import
import logoImg from "@assets/Kerzenwelt by Dani.png";
import { generateInvoicePdf } from "./admin/invoice-generator-new";

// OrderItemWithProduct je već importiran iz @shared/schema

// Definicija strukture fakture
interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  // ostala polja nisu nužna za ovo rješenje
}

// Odvojeni interface bez nasljeđivanja za rješavanje tipova
interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
  invoice?: Invoice;
}

// Komponenta za prikaz statusa narudžbe pomoću Badge
const OrderStatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Na čekanju';
      case 'processing':
        return 'U obradi';
      case 'completed':
        return 'Završeno';
      case 'cancelled':
        return 'Otkazano';
      default:
        return status;
    }
  };
  
  return (
    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
};

// Komponenta za prikaz načina plaćanja ikonicom i tekstom
const PaymentMethodInfo = ({ method }: { method: string }) => {
  // Narudžba plaćanja kao konstante za izbjegavanje grešaka u pisanju
  const PAYMENT_METHODS = {
    CASH: 'cash',
    BANK_TRANSFER: 'bank_transfer',
    PAYPAL: 'paypal',
    CREDIT_CARD: 'credit_card'
  };
  
  const getIcon = () => {
    switch (method) {
      case PAYMENT_METHODS.CASH:
        return <ShoppingBag className="h-4 w-4 mr-1" />;
      case PAYMENT_METHODS.BANK_TRANSFER:
        return <Building2 className="h-4 w-4 mr-1" />;
      case PAYMENT_METHODS.CREDIT_CARD:
        return <CreditCard className="h-4 w-4 mr-1" />;
      case PAYMENT_METHODS.PAYPAL:
        return <Receipt className="h-4 w-4 mr-1" />;
      default:
        return <AlertTriangle className="h-4 w-4 mr-1" />;
    }
  };
  
  const getText = () => {
    switch (method) {
      case PAYMENT_METHODS.CASH:
        return 'Gotovina';
      case PAYMENT_METHODS.BANK_TRANSFER:
        return 'Bankovni prijenos';
      case PAYMENT_METHODS.CREDIT_CARD:
        return 'Kreditna kartica';
      case PAYMENT_METHODS.PAYPAL:
        return 'PayPal';
      default:
        return method || 'Nije definirano';
    }
  };
  
  return (
    <div className="flex items-center">
      {getIcon()}
      <span>{getText()}</span>
    </div>
  );
};

// Komponenta za prikaz statusa plaćanja
const OrderStatusInfo = ({ status }: { status: string }) => {
  const getIcon = () => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />;
      case 'processing':
        return <Truck className="h-4 w-4 mr-1 text-blue-500" />;
      case 'completed':
        return <Check className="h-4 w-4 mr-1 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 mr-1 text-gray-500" />;
    }
  };
  
  const getText = () => {
    switch (status) {
      case 'pending':
        return 'Na čekanju';
      case 'processing':
        return 'U obradi';
      case 'completed':
        return 'Završeno';
      default:
        return status || 'Nepoznat status';
    }
  };
  
  return (
    <div className="flex items-center">
      {getIcon()}
      <span>{getText()}</span>
    </div>
  );
};

// Komponenta za zaglavlje stranice - neovisna o ostatku
const Header = () => {
  return (
    <div className="bg-gray-50 border-b py-4">
      <div className="container mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Moje narudžbe</h1>
      </div>
    </div>
  );
};

const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'hr' | 'en' | 'de'>('hr');
  
  // Dohvaćanje detalja narudžbe s API-ja, uključujući i stavke
  const {
    data: orderWithItems,
    isLoading,
    error,
  } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("Greška pri dohvaćanju narudžbe");
      return res.json();
    },
    enabled: !!id,
  });
  
  // Funkcija za formatiranje datuma u čitljiv format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd.MM.yyyy. HH:mm');
  };
  
  // Funkcija za pretvaranje načina plaćanja u čitljiv tekst
  const getPaymentMethodText = (method: string) => {
    if (!method) return 'Nije definirano';
    
    switch (method.toLowerCase()) {
      case 'cash':
        return 'Gotovina';
      case 'bank_transfer':
        return 'Bankovni prijenos';
      case 'paypal':
        return 'PayPal';
      case 'credit_card':
        return 'Kreditna kartica';
      default:
        return method;
    }
  };
  
  // Funkcija za generiranje PDF računa koristeći novu implementaciju
  const generateInvoice = () => {
    if (!orderWithItems || !user) return;
    
    setGeneratingInvoice(true);
    
    try {
      // Određivanje jezika računa
      const lang = selectedLanguage || "hr";
      
      // Formatiranje datuma
      const formattedDate = format(new Date(), 'dd.MM.yyyy.');
      
      // Dobivanje broja računa
      const baseNumber = 450;
      let invoiceNumber = orderWithItems.invoice?.invoiceNumber || 
                         (orderWithItems.id < baseNumber ? `i${baseNumber}` : `i${orderWithItems.id}`);
      
      // Priprema podataka za račun
      const invoiceData = {
        invoiceNumber: invoiceNumber,
        date: formattedDate,
        language: lang,
        paymentMethod: orderWithItems.paymentMethod || 'cash',
        buyer: {
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email || '',
          address: user.address || '',
          zipCode: user.postalCode || '',
          city: user.city || '',
          country: user.country || 'Austrija'
        },
        items: orderWithItems.items.map(item => ({
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          scentName: item.scentName || '',
          colorName: item.colorName || ''
        })),
        shippingCost: orderWithItems.shippingCost || '0.00'
      };
      
      // Izvršimo novu implementaciju generiranja PDF-a
      generateInvoicePdf(invoiceData, toast);
      
      // Obavijestimo korisnika da je PDF uspješno generiran
      toast({
        title: "Uspjeh",
        description: "Račun je uspješno generiran.",
      });
    } catch (error) {
      console.error("Greška pri generiranju PDF-a:", error);
      toast({
        title: "Greška pri generiranju računa",
        description: "Došlo je do pogreške prilikom generiranja računa. Pokušajte ponovno kasnije.",
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
      <div className="container mx-auto py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Greška</h2>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : "Nije moguće dohvatiti podatke o narudžbi."}
          </p>
          <Button variant="outline" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Natrag na narudžbe
          </Button>
        </div>
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
      
      <Header />
      
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            Narudžba #{orderWithItems.id}
            <OrderStatusBadge status={orderWithItems.status} />
          </h1>
          
          <Button variant="outline" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
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
                  <Download className="h-4 w-4 mr-2" />
                  Preuzmi račun
                </>
              )}
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Podaci o narudžbi */}
          <Card>
            <CardHeader>
              <CardTitle>Detalji narudžbe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-gray-500 font-medium text-sm">Datum narudžbe:</span>
                <p>{formatDate(orderWithItems.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium text-sm">Status narudžbe:</span>
                <div className="mt-1">
                  <OrderStatusInfo status={orderWithItems.status} />
                </div>
              </div>
              <div>
                <span className="text-gray-500 font-medium text-sm">Broj proizvoda:</span>
                <p>{totalItems}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium text-sm">Ukupan iznos:</span>
                <p className="font-semibold">{parseFloat(orderWithItems.total).toFixed(2)} €</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Podaci o plaćanju */}
          <Card>
            <CardHeader>
              <CardTitle>Podaci o plaćanju</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-gray-500 font-medium text-sm">Način plaćanja:</span>
                <div className="mt-1">
                  <PaymentMethodInfo method={orderWithItems.paymentMethod || 'Nije definirano'} />
                </div>
              </div>
              <div>
                <span className="text-gray-500 font-medium text-sm">Status plaćanja:</span>
                <p>{orderWithItems.status === 'completed' ? 'Plaćeno' : 'U obradi'}</p>
              </div>
              {orderWithItems.paymentMethod === 'bank_transfer' && (
                <div className="bg-blue-50 p-3 rounded mt-2">
                  <p className="text-sm text-blue-800">
                    Molimo izvršite uplatu na naš bankovni račun. Nakon potvrde uplate, vaša narudžba će biti poslana.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Podaci o dostavi */}
          <Card>
            <CardHeader>
              <CardTitle>Adresa dostave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                <p>{user?.address}</p>
                <p>{user?.postalCode} {user?.city}</p>
                <p>{user?.country}</p>
              </div>
              {orderWithItems.notes && (
                <div className="mt-4">
                  <span className="text-gray-500 font-medium text-sm">Napomena:</span>
                  <p className="text-sm mt-1 bg-gray-50 p-2 rounded">
                    {orderWithItems.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Stavke narudžbe */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Stavke narudžbe</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Proizvod</TableHead>
                  <TableHead>Detalji</TableHead>
                  <TableHead className="text-center">Količina</TableHead>
                  <TableHead className="text-right">Cijena</TableHead>
                  <TableHead className="text-right">Ukupno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderWithItems.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell>
                      {(item.scentName || item.colorName) && (
                        <div className="flex flex-col gap-1 text-sm">
                          {item.scentName && (
                            <span className="text-gray-600">
                              Miris: <span className="font-medium">{item.scentName}</span>
                            </span>
                          )}
                          {item.colorName && (
                            <span className="text-gray-600">
                              Boja: <span className="font-medium">{item.colorName}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{parseFloat(item.price).toFixed(2)} €</TableCell>
                    <TableCell className="text-right font-medium">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Sažetak troškova */}
        <div className="flex justify-end mt-6">
          <div className="w-full md:w-96">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between py-2">
                <span>Međuzbroj:</span>
                <span className="font-medium">
                  {orderWithItems.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span>Dostava:</span>
                <span className="font-medium">
                  {orderWithItems.shippingCost ? parseFloat(orderWithItems.shippingCost).toFixed(2) : "0.00"} €
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between py-2 font-bold">
                <span>Ukupno:</span>
                <span>{parseFloat(orderWithItems.total).toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsPage;