import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from 'react-helmet';
import AdminLayout from "@/components/admin/AdminLayout";
import { Order, OrderItemWithProduct, User, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Search, 
  FileText, 
  Download, 
  Plus, 
  X,
  Languages, 
  Printer, 
  RefreshCw
} from "lucide-react";
import jsPDF from "jspdf";
import 'jspdf-autotable';

// Definicija sheme za formular kreiranja novog računa
const createInvoiceSchema = z.object({
  firstName: z.string().min(2, "Ime je obavezno"),
  lastName: z.string().min(2, "Prezime je obavezno"),
  address: z.string().min(5, "Adresa je obavezna"),
  city: z.string().min(2, "Grad je obavezan"),
  postalCode: z.string().min(4, "Poštanski broj je obavezan"),
  country: z.string().min(2, "Država je obavezna"),
  email: z.string().email("Unesite valjanu email adresu"),
  phone: z.string().min(8, "Telefonski broj je obavezan"),
  invoiceNumber: z.string().min(1, "Broj računa je obavezan"),
  language: z.enum(["hr", "en", "de"], {
    required_error: "Odaberite jezik fakture",
  }),
  selectedProducts: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
      price: z.string(),
    })
  ).min(1, "Odaberite barem jedan proizvod"),
});

type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;

// Tip za račune
interface Invoice {
  id: number;
  orderId?: number;
  invoiceNumber: string;
  createdAt: Date;
  customerName: string;
  total: string;
  language: string;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    price: string;
  }[];
}

// Komponenta za tablicu računa
function InvoiceTable({ invoices, onGeneratePdf, onDelete }: { 
  invoices: Invoice[]; 
  onGeneratePdf: (invoice: Invoice) => void;
  onDelete: (id: number) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pretraži račune..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Broj računa</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Kupac</TableHead>
              <TableHead>Iznos</TableHead>
              <TableHead>Jezik</TableHead>
              <TableHead className="text-right">Opcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{parseFloat(invoice.total).toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {invoice.language === "hr" ? "Hrvatski" : 
                       invoice.language === "en" ? "Engleski" : "Njemački"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onGeneratePdf(invoice)}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Preuzmi
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(invoice.id)}
                      className="text-destructive hover:text-destructive gap-1"
                    >
                      <X className="h-4 w-4" />
                      Obriši
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nije pronađen nijedan račun
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Komponenta za odabir proizvoda u formi
function ProductSelector({ 
  products, 
  selectedProducts, 
  onAddProduct, 
  onUpdateProduct, 
  onRemoveProduct
}: {
  products: Product[];
  selectedProducts: any[];
  onAddProduct: (product: any) => void;
  onUpdateProduct: (index: number, key: string, value: any) => void;
  onRemoveProduct: (index: number) => void;
}) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedScent, setSelectedScent] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // Dohvati mirise i boje za odabrani proizvod
  const { data: scents, isLoading: isLoadingScents } = useQuery<any[]>({
    queryKey: ['/api/scents', selectedProductId],
    enabled: !!selectedProductId
  });
  
  const { data: colors, isLoading: isLoadingColors } = useQuery<any[]>({
    queryKey: ['/api/colors', selectedProductId],
    enabled: !!selectedProductId
  });
  
  // Dohvati mirise i boje za specifični proizvod
  const { data: productScents, isLoading: isLoadingProductScents } = useQuery<any[]>({
    queryKey: [`/api/products/${selectedProductId}/scents`],
    enabled: !!selectedProductId
  });
  
  const { data: productColors, isLoading: isLoadingProductColors } = useQuery<any[]>({
    queryKey: [`/api/products/${selectedProductId}/colors`],
    enabled: !!selectedProductId
  });
  
  // Resetiraj odabire kad se promijeni proizvod
  useEffect(() => {
    setSelectedScent(null);
    setSelectedColor(null);
  }, [selectedProductId]);
  
  const handleAddProduct = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      const hasScents = productScents && productScents.length > 0;
      const hasColors = productColors && productColors.length > 0;
      
      // Ako proizvod ima mirise ili boje, moraju biti odabrani
      if ((hasScents && !selectedScent) || (hasColors && !selectedColor)) {
        return;
      }
      
      onAddProduct({
        productId: product.id,
        productName: product.name,
        selectedScent: selectedScent,
        selectedColor: selectedColor,
        quantity: 1,
        price: product.price
      });
      
      // Resetiraj odabire nakon dodavanja
      setSelectedProductId(null);
      setSelectedScent(null);
      setSelectedColor(null);
    }
  };
  
  // Provjeri ima li proizvod mirise i boje
  const selectedProduct = products?.find(p => p.id === selectedProductId);
  
  // Dodajmo console.log za debugging
  useEffect(() => {
    if (selectedProductId) {
      console.log("Odabrani proizvod ID:", selectedProductId);
      console.log("Dohvaćeni mirisi:", productScents);
      console.log("Dohvaćene boje:", productColors);
    }
  }, [selectedProductId, productScents, productColors]);
  
  const hasScents = productScents && productScents.length > 0;
  const hasColors = productColors && productColors.length > 0;
  
  // Provjeri je li gumb za dodavanje omogućen
  const isAddButtonDisabled = !selectedProductId || 
                           (hasScents && !selectedScent) || 
                           (hasColors && !selectedColor);
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <FormLabel>Odaberite proizvod</FormLabel>
          <Select 
            value={selectedProductId?.toString() || ""}
            onValueChange={(value) => setSelectedProductId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Odaberite proizvod" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name} - {parseFloat(product.price).toFixed(2)} €
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Odabir mirisa ako proizvod ima mirise */}
        {selectedProductId && hasScents && (
          <div>
            <FormLabel>Odaberite miris</FormLabel>
            <Select 
              value={selectedScent || ""}
              onValueChange={setSelectedScent}
            >
              <SelectTrigger>
                <SelectValue placeholder="Odaberite miris" />
              </SelectTrigger>
              <SelectContent>
                {productScents.map((scent) => (
                  <SelectItem key={scent.id} value={scent.name}>
                    {scent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Odabir boje ako proizvod ima boje */}
        {selectedProductId && hasColors && (
          <div>
            <FormLabel>Odaberite boju</FormLabel>
            <Select 
              value={selectedColor || ""}
              onValueChange={setSelectedColor}
            >
              <SelectTrigger>
                <SelectValue placeholder="Odaberite boju" />
              </SelectTrigger>
              <SelectContent>
                {productColors.map((color) => (
                  <SelectItem key={color.id} value={color.name}>
                    {color.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="mt-2">
          <Button 
            type="button" 
            disabled={isAddButtonDisabled}
            onClick={handleAddProduct}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Dodaj proizvod
          </Button>
        </div>
      </div>
      
      {selectedProducts.length > 0 ? (
        <div className="border rounded-md p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proizvod</TableHead>
                <TableHead>Miris/Boja</TableHead>
                <TableHead>Cijena (€)</TableHead>
                <TableHead>Količina</TableHead>
                <TableHead>Ukupno (€)</TableHead>
                <TableHead className="text-right">Opcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product, index) => (
                <TableRow key={`${product.productId}-${index}`}>
                  <TableCell>
                    {products.find(p => p.id === product.productId)?.name || 'Nepoznati proizvod'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {product.selectedScent && (
                        <div className="flex items-center">
                          <span className="font-medium mr-1">Miris:</span> {product.selectedScent}
                        </div>
                      )}
                      {product.selectedColor && (
                        <div className="flex items-center">
                          <span className="font-medium mr-1">Boja:</span> {product.selectedColor}
                        </div>
                      )}
                      {!product.selectedScent && !product.selectedColor && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={product.price}
                      onChange={(e) => onUpdateProduct(index, 'price', e.target.value)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => onUpdateProduct(index, 'quantity', parseInt(e.target.value))}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    {(parseFloat(product.price) * product.quantity).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemoveProduct(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-right">
            <span className="font-medium">Ukupno: </span>
            <span>
              {selectedProducts
                .reduce((sum, product) => sum + parseFloat(product.price) * product.quantity, 0)
                .toFixed(2)
              } €
            </span>
          </div>
        </div>
      ) : (
        <div className="border rounded-md p-4 text-center text-muted-foreground">
          Odaberite proizvode za dodavanje na račun
        </div>
      )}
    </div>
  );
}

// Glavna komponenta za upravljanje računima
export default function AdminInvoices() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("existing");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Dohvaćanje računa s API-ja
  const { data: invoiceData, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      const response = await fetch('/api/invoices');
      if (!response.ok) {
        throw new Error('Greška prilikom dohvaćanja računa');
      }
      return response.json();
    }
  });
  
  const invoices = invoiceData || [];
  
  // Koristimo stvarne podatke iz baze podataka
  
  // Dohvati narudžbe za odabir
  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });
  
  // Dohvati proizvode
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Dohvati korisnike
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Forma za kreiranje novog računa
  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      postalCode: "",
      country: "Hrvatska",
      email: "",
      phone: "",
      invoiceNumber: `${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      language: "hr",
      selectedProducts: [],
    },
  });
  
  // Polja za odabrane proizvode
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  
  // Dodaj proizvod na listu
  const handleAddProduct = (product: any) => {
    setSelectedProducts([...selectedProducts, product]);
  };
  
  // Ažuriraj informacije o proizvodu
  const handleUpdateProduct = (index: number, key: string, value: any) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index][key] = value;
    setSelectedProducts(updatedProducts);
  };
  
  // Ukloni proizvod s liste
  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };
  
  // Učitaj podatke narudžbe u formu
  const loadOrderData = async (orderId: number) => {
    try {
      // Dohvati stavke narudžbe
      const response = await apiRequest("GET", `/api/orders/${orderId}/items`);
      const orderItems: OrderItemWithProduct[] = await response.json();
      
      // Pronađi korisnika
      const order = orders?.find(o => o.id === orderId);
      const user = users?.find(u => u.id === order?.userId);
      
      if (order && user) {
        // Postavi podatke u formu
        form.reset({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          address: user.address || "",
          city: user.city || "",
          postalCode: user.postalCode || "",
          country: user.country || "Hrvatska",
          email: user.email || "",
          phone: user.phone || "",
          invoiceNumber: `${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
          language: "hr",
          selectedProducts: []
        });
        
        // Postavi odabrane proizvode
        const products = orderItems.map(item => ({
          productId: item.productId,
          productName: item.product?.name || 'Nepoznati proizvod',
          quantity: item.quantity,
          price: item.price
        }));
        
        setSelectedProducts(products);
      }
    } catch (error) {
      console.error("Error loading order data:", error);
      toast({
        title: "Greška",
        description: "Došlo je do pogreške prilikom učitavanja podataka narudžbe",
        variant: "destructive",
      });
    }
  };
  
  // Kreiranje i preuzimanje PDF računa
  const generatePdf = (invoiceData: any) => {
    try {
      console.log("PDF generiranje započinje...", invoiceData);
      
      // Odabir jezika za ispis računa
      const translations = {
        hr: {
          title: "RAČUN",
          invoiceNumber: "Broj računa",
          date: "Datum",
          buyer: "Kupac",
          seller: "Prodavatelj",
          address: "Adresa",
          phone: "Telefon",
          email: "Email",
          item: "Stavka",
          quantity: "Količina",
          price: "Cijena",
          total: "Ukupno",
          subtotal: "Međuzbroj",
          tax: "PDV (25%)",
          grandTotal: "UKUPNO",
          thankYou: "Hvala na kupnji!",
          footer: "Kerzenwelt by Dani - Obrt za proizvodnju svijeća"
        },
        en: {
          title: "INVOICE",
          invoiceNumber: "Invoice Number",
          date: "Date",
          buyer: "Customer",
          seller: "Seller",
          address: "Address",
          phone: "Phone",
          email: "Email",
          item: "Item",
          quantity: "Quantity",
          price: "Price",
          total: "Total",
          subtotal: "Subtotal",
          tax: "VAT (25%)",
          grandTotal: "GRAND TOTAL",
          thankYou: "Thank you for your purchase!",
          footer: "Kerzenwelt by Dani - Candle Manufacturing Business"
        },
        de: {
          title: "RECHNUNG",
          invoiceNumber: "Rechnungsnummer",
          date: "Datum",
          buyer: "Kunde",
          seller: "Verkäufer",
          address: "Adresse",
          phone: "Telefon",
          email: "Email",
          item: "Artikel",
          quantity: "Menge",
          price: "Preis",
          total: "Summe",
          subtotal: "Zwischensumme",
          tax: "MwSt. (25%)",
          grandTotal: "GESAMTSUMME",
          thankYou: "Danke für Ihren Einkauf!",
          footer: "Kerzenwelt by Dani - Kerzenherstellungsbetrieb"
        }
      };
      
      const lang = invoiceData.language || "hr";
      const t = translations[lang as keyof typeof translations];
      
      // Inicijalizacija PDF dokumenta
      const doc = new jsPDF();
      
      // Naslov i broj računa
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(t.title, 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${t.invoiceNumber}: ${invoiceData.invoiceNumber}`, 20, 30);
      doc.text(`${t.date}: ${new Date(invoiceData.createdAt).toLocaleDateString()}`, 20, 35);
      
      // Podaci o prodavatelju
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(t.seller, 20, 45);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Kerzenwelt by Dani", 20, 50);
      doc.text("Ossiacher Zeile, 30", 20, 55);
      doc.text("9570 Ossiach", 20, 60);
      doc.text("Österreich", 20, 65);
      doc.text(`${t.phone}: +43 660 762 1948`, 20, 70);
      doc.text(`${t.email}: kerzenwelt@dani.at`, 20, 75);
      
      // Podaci o kupcu
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(t.buyer, 120, 45);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${invoiceData.firstName} ${invoiceData.lastName}`, 120, 50);
      doc.text(invoiceData.address, 120, 55);
      doc.text(`${invoiceData.postalCode} ${invoiceData.city}`, 120, 60);
      doc.text(invoiceData.country, 120, 65);
      if (invoiceData.phone) doc.text(`${t.phone}: ${invoiceData.phone}`, 120, 70);
      if (invoiceData.email) doc.text(`${t.email}: ${invoiceData.email}`, 120, 75);
      
      // Tablica proizvoda
      const tableColumn = [t.item, t.quantity, t.price, t.total];
      const tableRows = [];
      
      // Dodavanje stavki u tablicu
      let subtotal = 0;
      for (const item of invoiceData.items) {
        const itemTotal = parseFloat(item.price) * item.quantity;
        subtotal += itemTotal;
        
        // Dodaj informacije o proizvodu, uključujući miris i boju
        let productName = item.productName;
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
        
        tableRows.push([
          productName,
          item.quantity,
          `${parseFloat(item.price).toFixed(2)} €`,
          `${itemTotal.toFixed(2)} €`
        ]);
      }
      
      // Izračun PDV-a i ukupnog iznosa
      const tax = subtotal * 0.25;
      const total = subtotal + tax;
      
      // Dodavanje tablice u PDF
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        foot: [
          [`${t.subtotal}:`, '', '', `${subtotal.toFixed(2)} €`],
          [`${t.tax}:`, '', '', `${tax.toFixed(2)} €`],
          [`${t.grandTotal}:`, '', '', `${total.toFixed(2)} €`]
        ],
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: 0,
          fontStyle: 'bold'
        }
      });
      
      // Dodavanje podnožja
      const finalY = (doc as any).lastAutoTable.finalY || 120;
      
      doc.setFontSize(10);
      doc.text(t.thankYou, 105, finalY + 10, { align: "center" });
      
      doc.setFontSize(8);
      doc.text(t.footer, 105, 280, { align: "center" });
      
      try {
        // Preuzimanje PDF-a
        doc.save(`Racun-${invoiceData.invoiceNumber}.pdf`);
        console.log("PDF uspješno generiran i preuzet");
        return true;
      } catch (pdfError) {
        console.error("Greška pri preuzimanju PDF-a:", pdfError);
        toast({
          title: "Greška pri preuzimanju PDF-a",
          description: pdfError?.toString() || "Nepoznata greška pri preuzimanju",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Greška pri generiranju PDF-a:", error);
      toast({
        title: "Greška",
        description: error?.toString() || "Došlo je do pogreške prilikom generiranja PDF-a",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Kreiranje novog računa
  const handleCreateInvoice = (data: CreateInvoiceFormValues) => {
    console.log("handleCreateInvoice pokrenut");
    
    try {
      // Ažuriraj form podatke sa odabranim proizvodima
      data.selectedProducts = selectedProducts;
      
      if (selectedProducts.length === 0) {
        toast({
          title: "Greška",
          description: "Morate dodati barem jedan proizvod",
          variant: "destructive"
        });
        return;
      }
      
      // Izračunaj ukupni iznos
      const total = selectedProducts.reduce(
        (sum, product) => sum + parseFloat(product.price) * product.quantity, 
        0
      ).toFixed(2);
      
      // Pripremi podatke za API
      const invoiceData = {
        invoice: {
          orderId: selectedOrder?.id || null,
          invoiceNumber: data.invoiceNumber,
          customerName: `${data.firstName} ${data.lastName}`,
          customerEmail: data.email || null,
          customerAddress: data.address || null,
          customerCity: data.city || null,
          customerPostalCode: data.postalCode || null,
          customerCountry: data.country || null,
          customerPhone: data.phone || null,
          subtotal: total,
          tax: "0.00",
          total: total,
          language: data.language || "hr"
        },
        items: selectedProducts.map(product => ({
          productId: product.productId,
          productName: product.productName,
          quantity: product.quantity,
          price: product.price,
          selectedScent: product.selectedScent || null,
          selectedColor: product.selectedColor || null
        }))
      };
      
      console.log("Šaljem na API:", invoiceData);
      
      // Direktno pozivam API bez apiRequest da vidim što se događa
      console.log("Šaljem createInvoice fetch zahtjev...");
      
      fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(invoiceData),
        credentials: 'include'
      })
      .then(response => {
        console.log("API odgovor status:", response.status);
        if (!response.ok) {
          return response.text().then(text => {
            console.error("API odgovor error:", text);
            throw new Error(`Greška prilikom spremanja računa u bazu (${response.status}): ${text}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("API odgovor uspješan:", data);
        
        try {
          // Generiranje PDF-a
          console.log("Generiram PDF s podacima:", {
            ...data,
            items: selectedProducts,
            createdAt: new Date()
          });
          
          generatePdf({
            ...data,
            items: selectedProducts,
            createdAt: new Date()
          });
        } catch (error) {
          console.error("Greška pri generiranju PDF-a:", error);
        }
        
        toast({
          title: "Uspješno kreiran račun",
          description: `Račun ${data.invoiceNumber} je uspješno kreiran i preuzet`,
        });
        
        // Osvježi popis računa
        refetchInvoices();
        
        // Reset forme
        form.reset();
        setSelectedProducts([]);
        setSelectedOrder(null);
        
        // Prebaci na karticu s postojećim računima
        setActiveTab("existing");
      })
      .catch(error => {
        console.error("Greška pri kreiranju računa:", error);
        
        // Detaljnija poruka o grešci za lakše debugiranje
        let errorMessage = "Došlo je do greške prilikom spremanja računa";
        
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        toast({
          title: "Greška",
          description: errorMessage,
          variant: "destructive"
        });
      });
    } catch (e) {
      console.error("Neočekivana greška:", e);
      toast({
        title: "Neočekivana greška",
        description: e?.toString() || "Došlo je do neočekivane greške",
        variant: "destructive"
      });
    }
  };
  
  // Brisanje računa
  const handleDeleteInvoice = (id: number) => {
    apiRequest('DELETE', `/api/invoices/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Greška prilikom brisanja računa");
        }
        refetchInvoices(); // Osvježi popis računa nakon brisanja
        toast({
          title: "Račun obrisan",
          description: "Račun je uspješno obrisan iz sustava",
        });
      })
      .catch(error => {
        console.error("Greška pri brisanju računa:", error);
        toast({
          title: "Greška",
          description: "Došlo je do greške prilikom brisanja računa",
          variant: "destructive"
        });
      });
  };
  
  // Preuzimanje PDF-a za postojeći račun
  const handleDownloadInvoice = (invoice: Invoice) => {
    // Pripremi podatke za PDF
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      firstName: invoice.customerName.split(' ')[0],
      lastName: invoice.customerName.split(' ').slice(1).join(' '),
      address: "Adresa kupca", // Ovo bi trebalo biti dostupno iz stvarnih podataka
      city: "Grad kupca",
      postalCode: "12345",
      country: "Hrvatska",
      items: invoice.items,
      language: invoice.language
    };
    
    generatePdf(invoiceData);
  };
  
  return (
    <AdminLayout>
      <Helmet>
        <title>Upravljanje računima | Kerzenwelt by Dani</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Računi</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="existing">
              <FileText className="h-4 w-4 mr-2" />
              Postojeći računi
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-2" />
              Kreiraj novi račun
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Postojeći računi</CardTitle>
                <CardDescription>
                  Pregledajte, preuzmite ili obrišite postojeće račune
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <InvoiceTable 
                    invoices={invoices} 
                    onGeneratePdf={handleDownloadInvoice}
                    onDelete={handleDeleteInvoice}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kreiraj novi račun</CardTitle>
                <CardDescription>
                  Kreirajte novi račun odabirom postojeće narudžbe ili unosom novih podataka
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Odabir postojeće narudžbe */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Odaberi postojeću narudžbu (opcionalno)</h3>
                    <div className="flex gap-2">
                      <Select 
                        disabled={isLoadingOrders} 
                        value={selectedOrder?.id.toString() || ""}
                        onValueChange={(value) => {
                          const orderId = parseInt(value);
                          const order = orders?.find(o => o.id === orderId) || null;
                          setSelectedOrder(order);
                          if (order) {
                            loadOrderData(orderId);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[300px]">
                          <SelectValue placeholder="Odaberite narudžbu" />
                        </SelectTrigger>
                        <SelectContent>
                          {orders?.map((order) => (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              Narudžba #{order.id} - {parseFloat(order.total).toFixed(2)} €
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="outline" 
                        disabled={!selectedOrder}
                        onClick={() => {
                          setSelectedOrder(null);
                          form.reset();
                          setSelectedProducts([]);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resetiraj
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t my-6"></div>
                  
                  {/* Forma za kreiranje računa */}
                  <Form {...form}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      console.log("Form submit event triggered");
                      console.log("Form values:", form.getValues());
                      console.log("Selected products:", selectedProducts);
                      
                      if (selectedProducts.length === 0) {
                        toast({
                          title: "Greška",
                          description: "Morate dodati barem jedan proizvod",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      form.handleSubmit(handleCreateInvoice)(e);
                    }} className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ime</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Ime kupca" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prezime</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Prezime kupca" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email"
                                  placeholder="Email kupca" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Telefon kupca" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresa</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Adresa kupca" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid gap-6 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grad</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Grad" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poštanski broj</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Poštanski broj" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Država</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Država" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="invoiceNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Broj računa</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Broj računa" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Format: GODINA-BROJ (npr. 2023-001)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jezik računa</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Odaberite jezik" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="hr">Hrvatski</SelectItem>
                                  <SelectItem value="en">Engleski</SelectItem>
                                  <SelectItem value="de">Njemački</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="border-t my-6"></div>
                      
                      {/* Odabir proizvoda */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Proizvodi na računu</h3>
                        
                        {isLoadingProducts ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : (
                          <ProductSelector 
                            products={products || []}
                            selectedProducts={selectedProducts}
                            onAddProduct={handleAddProduct}
                            onUpdateProduct={handleUpdateProduct}
                            onRemoveProduct={handleRemoveProduct}
                          />
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            form.reset();
                            setSelectedProducts([]);
                            setSelectedOrder(null);
                          }}
                        >
                          Odustani
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isLoadingProducts || selectedProducts.length === 0}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Kreiraj račun
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}