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

// OrderItemWithProduct je već importiran iz @shared/schema

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
      
      // Definiranje prijevoda za PDF
      const translations: Record<string, Record<string, string>> = {
        hr: {
          title: "RACUN",
          date: "Datum racuna",
          invoiceNo: "Broj racuna",
          buyer: "Podaci o kupcu",
          seller: "Prodavatelj",
          item: "Proizvod",
          quantity: "Kolicina",
          price: "Cijena/kom",
          total: "Ukupno",
          subtotal: "Meduzboj",
          tax: "PDV (0%)",
          totalAmount: "UKUPNO",
          paymentInfo: "Informacije o placanju",
          paymentMethod: "Nacin placanja",
          paymentStatus: "Status placanja",
          cash: "Gotovina",
          bank: "Bankovni prijenos",
          paypal: "PayPal",
          paid: "Placeno",
          unpaid: "U obradi",
          deliveryAddress: "Adresa za dostavu",
          handInvoice: "Rucni racun",
          thankYou: "Hvala Vam na narudzbi",
          generatedNote: "Ovo je automatski generirani racun i valjan je bez potpisa i pecata",
          exemptionNote: "Poduzetnik nije u sustavu PDV-a, PDV nije obracunat temeljem odredbi posebnog postupka oporezivanja za male porezne obveznike.",
          orderItems: "Stavke narudzbe",
          shipping: "Dostava",
          customerNote: "Napomena kupca"
        },
        en: {
          title: "INVOICE",
          date: "Invoice date",
          invoiceNo: "Invoice number",
          buyer: "Buyer information",
          seller: "Seller",
          item: "Product",
          quantity: "Quantity",
          price: "Price/unit",
          total: "Total",
          subtotal: "Subtotal",
          tax: "VAT (0%)",
          totalAmount: "TOTAL",
          paymentInfo: "Payment information",
          paymentMethod: "Payment method",
          paymentStatus: "Payment status",
          cash: "Cash",
          bank: "Bank transfer",
          paypal: "PayPal",
          paid: "Paid",
          unpaid: "Processing",
          deliveryAddress: "Delivery address",
          handInvoice: "Hand invoice",
          thankYou: "Thank you for your order",
          generatedNote: "This is an automatically generated invoice and is valid without signature or stamp",
          exemptionNote: "The entrepreneur is not in the VAT system, VAT is not calculated based on the provisions of the special taxation procedure for small taxpayers.",
          orderItems: "Order items",
          shipping: "Shipping",
          customerNote: "Customer note"
        },
        de: {
          title: "RECHNUNG",
          date: "Rechnungsdatum",
          invoiceNo: "Rechnungsnummer",
          buyer: "Käuferinformationen",
          seller: "Verkäufer",
          item: "Produkt",
          quantity: "Menge",
          price: "Preis/Stück",
          total: "Gesamt",
          subtotal: "Zwischensumme",
          tax: "MwSt. (0%)",
          totalAmount: "GESAMTBETRAG",
          paymentInfo: "Zahlungsinformationen",
          paymentMethod: "Zahlungsmethode",
          paymentStatus: "Zahlungsstatus",
          cash: "Bargeld",
          bank: "Banküberweisung",
          paypal: "PayPal",
          paid: "Bezahlt",
          unpaid: "In Bearbeitung",
          deliveryAddress: "Lieferadresse",
          handInvoice: "Handrechnung",
          thankYou: "Vielen Dank für Ihre Bestellung",
          generatedNote: "Dies ist eine automatisch generierte Rechnung und ist ohne Unterschrift und Stempel gültig",
          exemptionNote: "Der Unternehmer ist nicht im Mehrwertsteuersystem, MwSt. wird nicht berechnet gemäß den Bestimmungen des Kleinunternehmerregelung.",
          orderItems: "Bestellpositionen",
          shipping: "Versand",
          customerNote: "Kundenhinweis"
        }
      };

      // Odabir prijevoda
      const t = translations[lang] || translations.hr;
      
      // Funkcija za dobivanje teksta načina plaćanja ovisno o odabranoj vrijednosti i jeziku
      const getPaymentStatusText = (status: string) => {
        if (!status) return t.unpaid;
        return status === 'completed' ? t.paid : t.unpaid;
      };
      
      // Kreiraj novi PDF dokument
      const doc = new jsPDF();
      
      // Postavljanje osnovnih detalja
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      // Gornji dio - Logo s lijeve strane i naslov na desnoj
      try {
        // Dodajemo logo
        doc.addImage(logoImg, 'PNG', 20, 15, 30, 30);
      } catch (error) {
        console.error("Pogreška pri učitavanju loga:", error);
      }
      
      // Formatiranje datuma i broja računa
      const currentDate = new Date();
      const formattedDate = format(currentDate, 'dd.MM.yyyy.');
      const invoiceNumber = `${currentDate.getFullYear()}-${orderWithItems.id.toString().padStart(4, '0')}`;
      
      doc.setTextColor(218, 165, 32); // Zlatna boja (RGB)
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Kerzenwelt by Dani", 55, 24);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); // Vraćanje na crnu boju
      doc.setFont("helvetica", "normal");
      doc.text("Ossiacher Zeile 30, 9500 Villach, Österreich", 55, 30);
      doc.text("Email: daniela.svoboda2@gmail.com", 55, 35);
      
      // Naslov i broj računa na desnoj strani
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(t.title, 190, 24, { align: "right" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`${t.invoiceNo}: ${invoiceNumber}`, 190, 32, { align: "right" });
      doc.text(`${t.date}: ${formattedDate}`, 190, 38, { align: "right" });
      
      // Horizontalna linija
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 45, 190, 45);
      
      // Podaci o kupcu
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${t.buyer}:`, 20, 55);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 57, 190, 57);
      doc.setFont("helvetica", "normal");
      
      let customerY = 62;
      
      // Dodajemo informacije o kupcu ako postoje, inače prikazujemo rukom napisani račun
      if (user) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const email = user.email || '';
        const address = orderWithItems.shippingAddress || user.address || '';
        const city = orderWithItems.shippingCity || user.city || '';
        const postalCode = orderWithItems.shippingPostalCode || user.postalCode || '';
        const country = orderWithItems.shippingCountry || user.country || '';
        
        if (fullName) {
          doc.text(fullName, 20, customerY);
          customerY += 5;
        }
        
        if (email) {
          doc.text(`Email: ${email}`, 20, customerY);
          customerY += 5;
        }
        
        if (address) {
          doc.text(`${t.deliveryAddress}: ${address}`, 20, customerY);
          customerY += 5;
        }
        
        if (postalCode || city) {
          doc.text(`${postalCode} ${city}`, 20, customerY);
          customerY += 5;
        }
        
        if (country) {
          doc.text(country, 20, customerY);
          customerY += 5;
        }
      } else {
        doc.text(`${t.deliveryAddress}: N/A - ${t.handInvoice}`, 20, customerY);
        customerY += 5;
      }
      
      // Stavke narudžbe
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${t.orderItems}:`, 20, customerY + 5);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, customerY + 7, 190, customerY + 7);
      
      // Priprema podataka za tablicu
      let items = [];
      
      if (orderWithItems.items && Array.isArray(orderWithItems.items)) {
        items = orderWithItems.items.map((item) => {
          let productName = '';
          if (item.product && typeof item.product === 'object' && item.product.name) {
            productName = item.product.name;
          } else if (item.productName) {
            productName = item.productName;
          } else {
            productName = `Proizvod #${item.productId}`;
          }
          
          let details = [];
          
          // Dodaj miris ako postoji
          if (item.scentName) {
            details.push(`Miris: ${item.scentName}`);
          }
          
          // Dodaj boju/boje
          if (item.colorName) {
            const colorPrefix = item.hasMultipleColors ? 'Boje' : 'Boja';
            details.push(`${colorPrefix}: ${item.colorName}`);
          }
          
          // Spoji naziv proizvoda s detaljima
          const detailsText = details.length > 0 ? `\n${details.join('\n')}` : '';
          const fullName = `${productName}${detailsText}`;
          const price = parseFloat(item.price).toFixed(2);
          const total = (parseFloat(item.price) * item.quantity).toFixed(2);
          
          return [fullName, item.quantity, `${price} €`, `${total} €`];
        });
      } else {
        // Dodajemo ručno barem jednu stavku ako nema podataka
        items = [["Proizvod nije specificiran", 1, "0.00 €", "0.00 €"]];
      }
      
      // Dodavanje tablice
      autoTable(doc, {
        head: [[t.item, t.quantity, t.price, t.total]],
        body: items,
        startY: customerY + 10,
        margin: { left: 20, right: 20 },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'left',
          valign: 'middle',
          fontSize: 10,
          cellPadding: 5,
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 10,
          cellPadding: 5,
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
      });
      
      // Izračunavanje ukupnog iznosa
      let subtotal = orderWithItems.items && Array.isArray(orderWithItems.items)
        ? orderWithItems.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
        : 0;
      
      // Sigurnosna provjera za shippingCost - ako ne postoji, stavi 0
      const shippingCost = orderWithItems.shippingCost 
        ? parseFloat(orderWithItems.shippingCost) 
        : 0;
      
      // Ukupan iznos s dostavom
      const total = parseFloat(orderWithItems.total) || (subtotal + shippingCost);
      
      // Dohvati poziciju nakon tablice
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      
      // Dodavanje ukupnog iznosa
      doc.setFontSize(10);
      doc.text(`${t.subtotal}:`, 160, finalY + 10, { align: "right" });
      doc.text(`${subtotal.toFixed(2)} €`, 190, finalY + 10, { align: "right" });
      
      // Dodaj troškove dostave ako postoje
      doc.text(`${t.shipping}:`, 160, finalY + 15, { align: "right" });
      doc.text(`${shippingCost.toFixed(2)} €`, 190, finalY + 15, { align: "right" });
      
      // Zbog jednostavnosti porezni model, stavljamo PDV 0%
      doc.text(`${t.tax}:`, 160, finalY + 20, { align: "right" });
      doc.text("0.00 €", 190, finalY + 20, { align: "right" });
      
      // Ukupan iznos
      doc.setFont("helvetica", "bold");
      doc.text(`${t.totalAmount}:`, 160, finalY + 25, { align: "right" });
      doc.text(`${total.toFixed(2)} €`, 190, finalY + 25, { align: "right" });
      doc.setFont("helvetica", "normal");
      
      // Informacije o plaćanju
      doc.setDrawColor(200, 200, 200);
      doc.line(20, finalY + 30, 190, finalY + 30);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${t.paymentInfo}:`, 20, finalY + 38);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      const paymentMethod = getPaymentMethodText(orderWithItems.paymentMethod || 'bank_transfer', lang);
      const paymentStatus = getPaymentStatusText(orderWithItems.paymentStatus);
      
      doc.text(`${t.paymentMethod}: ${paymentMethod}`, 20, finalY + 45);
      doc.text(`${t.paymentStatus}: ${paymentStatus}`, 20, finalY + 50);
      
      // Napomena kupca ako postoji
      if (orderWithItems.customerNote) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${t.customerNote || 'Napomena kupca'}:`, 20, finalY + 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        // Napravimo potreban broj redova za napomenu
        const noteLines = doc.splitTextToSize(orderWithItems.customerNote, 160);
        noteLines.forEach((line: string, index: number) => {
          doc.text(line, 20, finalY + 67 + (index * 5));
        });
      }
      
      // Zahvala za narudžbu
      doc.setFontSize(10);
      doc.text(`${t.thankYou}!`, 105, finalY + 65, { align: "center" });
      
      // Podnožje s informacijama o tvrtki
      doc.setFontSize(8);
      doc.text("Kerzenwelt by Dani | Ossiacher Zeile 30, 9500 Villach, Österreich | Email: daniela.svoboda2@gmail.com | Telefon: 004366038787621", 105, finalY + 75, { align: "center" });
      doc.text(`${t.generatedNote}.`, 105, finalY + 80, { align: "center" });
      doc.text("Steuernummer: 61 154/7175", 105, finalY + 85, { align: "center" });
      doc.text(`${t.exemptionNote}`, 105, finalY + 90, { align: "center" });
      
      // Spremi i preuzmi PDF
      doc.save(`invoice-${invoiceNumber}.pdf`);
      
      toast({
        title: "Uspjeh",
        description: "Račun je uspješno generiran",
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
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Greška pri učitavanju narudžbe</h2>
        <p className="mb-4">Došlo je do greške prilikom učitavanja podataka o narudžbi.</p>
        <Button variant="outline" onClick={() => navigate('/orders')}>
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
          
          {orderWithItems.customerNote && (
            <Card>
              <CardHeader>
                <CardTitle>Napomena kupca</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-neutral-50 rounded-md border border-neutral-100 text-neutral-800">
                  {orderWithItems.customerNote}
                </div>
              </CardContent>
            </Card>
          )}
          
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
                  <TableHead className="w-[80px]"></TableHead>
                  <TableHead className="w-[320px]">Proizvod</TableHead>
                  <TableHead className="text-center">Količina</TableHead>
                  <TableHead className="text-right">Cijena</TableHead>
                  <TableHead className="text-right">Ukupno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderWithItems.items.map((item) => {
                  const productName = item.product?.name || 'Proizvod';
                  const scent = item.scentName || '';
                  const color = item.colorName || '';
                  const itemTotal = parseFloat(item.price) * item.quantity;
                  const imageUrl = item.product?.imageUrl || null;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="align-middle">
                        {imageUrl && (
                          <div className="relative h-16 w-16 rounded-md overflow-hidden">
                            <img 
                              src={imageUrl} 
                              alt={productName} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-middle">
                        <div>
                          <div className="font-medium">{productName}</div>
                          <div className="text-sm text-muted-foreground mt-1 space-y-1">
                            {/* Prikaz mirisa s poboljšanim stilom */}
                            {scent && (
                              <div className="p-1 rounded-md border border-gray-100 bg-gray-50 inline-block mb-1">
                                <span className="font-medium mr-1">Miris:</span>
                                <span className="text-primary">{scent}</span>
                              </div>
                            )}
                            
                            {/* Prikaz jedne boje s vizualnim indikatorom */}
                            {color && !item.hasMultipleColors && (
                              <div className="p-1 rounded-md border border-gray-100 bg-gray-50 inline-block">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium mr-1">Boja:</span>
                                  {/* Pokušaj pronaći hex vrijednost boje */}
                                  {products?.flatMap(p => 
                                    p.id === item.productId ? (p as any).colors || [] : []
                                  ).find(c => c?.name === color)?.hexValue ? (
                                    <div 
                                      className="w-3 h-3 rounded-full inline-block border border-gray-200" 
                                      style={{ backgroundColor: products?.flatMap(p => 
                                        p.id === item.productId ? (p as any).colors || [] : []
                                      ).find(c => c?.name === color)?.hexValue }}
                                    />
                                  ) : null}
                                  <span className="text-primary">{color}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Prikaz višestrukih boja - sve boje prikazujemo kao listu s vizualnim indikatorima */}
                            {item.hasMultipleColors && color && (
                              <div className="p-1 rounded-md border border-gray-100 bg-gray-50 inline-block">
                                <div className="flex items-start gap-2">
                                  <span className="font-medium mr-1">Boje:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {color.split(',').map((colorName, index) => {
                                      const trimmedColor = colorName.trim();
                                      // Pronađi odgovarajuću boju u svim proizvodima ako je moguće
                                      const productColor = products?.flatMap(p => 
                                        p.id === item.productId ? (p as any).colors || [] : []
                                      ).find(c => c?.name === trimmedColor);
                                      
                                      return (
                                        <div key={index} className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                          {productColor?.hexValue ? (
                                            <div 
                                              className="w-3 h-3 rounded-full inline-block border border-gray-200" 
                                              style={{ backgroundColor: productColor.hexValue }}
                                            />
                                          ) : null}
                                          <span className="text-sm text-primary">{trimmedColor}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
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