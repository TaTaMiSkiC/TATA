import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Tabs, TabsList, TabsTrigger, TabsContent 
} from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Trash2, Download, ShoppingCart } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Order, Product, Scent, Color } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Pomoćna funkcija za generiranje broja fakture
const createInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${year}-${randomDigits}`;
};

interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number | null;
  userId: number;
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
  language: string;
  createdAt: Date;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: number;
  invoiceId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: string;
  selectedScent: string | null;
  selectedColor: string | null;
}

interface SelectedProduct {
  productId: number;
  productName: string;
  quantity: number;
  price: string;
  selectedScent: string | null;
  selectedColor: string | null;
}

// Validacijska shema za formu
const createInvoiceSchema = z.object({
  firstName: z.string().min(2, "Ime je obavezno"),
  lastName: z.string().min(2, "Prezime je obavezno"),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email("Unesite valjanu email adresu").optional().or(z.literal('')),
  phone: z.string().optional(),
  invoiceNumber: z.string().min(1, "Broj računa je obavezan"),
  language: z.string().min(1, "Odaberite jezik računa"),
  selectedProducts: z.array(z.any()).optional(),
});

type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;

// Komponenta za odabir proizvoda
function ProductSelector({
  addProduct
}: {
  addProduct: (product: SelectedProduct) => void
}) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<string>("");
  const [selectedScent, setSelectedScent] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // Dohvati sve proizvode
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Dohvati mirise za odabrani proizvod
  const { data: productScents = [] } = useQuery<Scent[]>({
    queryKey: ['/api/products', selectedProductId, 'scents'],
    enabled: !!selectedProductId,
  });
  
  // Dohvati boje za odabrani proizvod
  const { data: productColors = [] } = useQuery<Color[]>({
    queryKey: ['/api/products', selectedProductId, 'colors'],
    enabled: !!selectedProductId,
  });
  
  // Postavi cijenu kada se odabere proizvod
  const handleProductChange = (productId: string) => {
    const id = parseInt(productId);
    setSelectedProductId(id);
    
    const product = products.find(p => p.id === id);
    if (product) {
      setPrice(product.price);
    }
    
    // Reset scent and color
    setSelectedScent(null);
    setSelectedColor(null);
    
    console.log("Odabrani proizvod ID:", id);
    console.log("Dohvaćeni mirisi:", productScents);
    console.log("Dohvaćene boje:", productColors);
  };
  
  // Dodaj proizvod u listu
  const handleAddProduct = () => {
    if (!selectedProductId) {
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      return;
    }
    
    addProduct({
      productId: selectedProductId,
      productName: product.name,
      quantity,
      price,
      selectedScent,
      selectedColor
    });
    
    // Reset form
    setSelectedProductId(null);
    setQuantity(1);
    setPrice("");
    setSelectedScent(null);
    setSelectedColor(null);
  };
  
  return (
    <div className="bg-background border rounded-lg p-4 space-y-4">
      <h3 className="font-medium">Dodaj proizvod</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Proizvod</label>
          <Select onValueChange={handleProductChange} value={selectedProductId?.toString() || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Odaberi proizvod" />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {productScents && productScents.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Miris</label>
            <Select onValueChange={setSelectedScent} value={selectedScent || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Odaberi miris" />
              </SelectTrigger>
              <SelectContent>
                {productScents.map(scent => (
                  <SelectItem key={scent.id} value={scent.name}>
                    {scent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {productColors && productColors.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Boja</label>
            <Select onValueChange={setSelectedColor} value={selectedColor || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Odaberi boju" />
              </SelectTrigger>
              <SelectContent>
                {productColors.map(color => (
                  <SelectItem key={color.id} value={color.name}>
                    {color.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Količina</label>
          <Input 
            type="number" 
            min="1" 
            value={quantity} 
            onChange={e => setQuantity(parseInt(e.target.value))} 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Cijena (€)</label>
          <Input 
            type="text" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
          />
        </div>
      </div>
      
      <Button 
        type="button" 
        onClick={handleAddProduct} 
        disabled={!selectedProductId}
        className="w-full md:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        Dodaj proizvod
      </Button>
    </div>
  );
}

// Komponenta za cijeli admin modul računa
export default function AdminInvoices() {
  const [activeTab, setActiveTab] = useState<string>("existing");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dohvati račune
  const { data: invoices = [], refetch: refetchInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices']
  });
  
  // Dohvati narudžbe
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders']
  });
  
  // Form za kreiranje računa
  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
      invoiceNumber: createInvoiceNumber(),
      language: "hr",
    }
  });
  
  // Funkcija za generiranje PDF-a
  const generatePdf = (data: any) => {
    try {
      // Određivanje jezika računa
      const lang = data.language || "hr";
      
      // Definiranje prijevoda za PDF
      const translations: Record<string, Record<string, string>> = {
        hr: {
          title: "RAČUN",
          date: "Datum:",
          invoiceNo: "Broj računa:",
          buyer: "Kupac:",
          seller: "Prodavatelj:",
          item: "Stavka",
          quantity: "Količina",
          price: "Cijena",
          total: "Ukupno",
          subtotal: "Međuzbroj:",
          tax: "PDV (0%):",
          totalAmount: "Ukupan iznos:"
        },
        en: {
          title: "INVOICE",
          date: "Date:",
          invoiceNo: "Invoice No.:",
          buyer: "Buyer:",
          seller: "Seller:",
          item: "Item",
          quantity: "Quantity",
          price: "Price",
          total: "Total",
          subtotal: "Subtotal:",
          tax: "VAT (0%):",
          totalAmount: "Total amount:"
        },
        de: {
          title: "RECHNUNG",
          date: "Datum:",
          invoiceNo: "Rechnungsnummer:",
          buyer: "Käufer:",
          seller: "Verkäufer:",
          item: "Artikel",
          quantity: "Menge",
          price: "Preis",
          total: "Gesamt",
          subtotal: "Zwischensumme:",
          tax: "MwSt. (0%):",
          totalAmount: "Gesamtbetrag:"
        }
      };

      // Odabir prijevoda
      const t = translations[lang] || translations.hr;
      
      const doc = new jsPDF();
      
      // Dodavanje loga
      // doc.addImage(logoImg, 'PNG', 10, 10, 40, 40);
      
      // Naslov
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(t.title, 105, 20, { align: "center" });
      
      // Osnovni podaci računa
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Formatiranje datuma
      const date = data.createdAt 
        ? format(new Date(data.createdAt), "dd.MM.yyyy") 
        : format(new Date(), "dd.MM.yyyy");
      
      doc.text(`${t.date} ${date}`, 20, 40);
      doc.text(`${t.invoiceNo} ${data.invoiceNumber}`, 20, 45);
      
      // Podaci o prodavatelju
      doc.setFont("helvetica", "bold");
      doc.text(t.seller, 20, 55);
      doc.setFont("helvetica", "normal");
      doc.text("Kerzenwelt by Dani", 20, 60);
      doc.text("Majetići 43", 20, 65);
      doc.text("51211 Matulji", 20, 70);
      doc.text("Hrvatska", 20, 75);
      doc.text("Email: kerzenwelt@gmail.com", 20, 80);
      
      // Podaci o kupcu
      doc.setFont("helvetica", "bold");
      doc.text(t.buyer, 120, 55);
      doc.setFont("helvetica", "normal");
      doc.text(`${data.firstName} ${data.lastName}`, 120, 60);
      
      if (data.address) {
        doc.text(data.address, 120, 65);
      }
      
      if (data.city && data.postalCode) {
        doc.text(`${data.postalCode} ${data.city}`, 120, 70);
      } else if (data.city) {
        doc.text(data.city, 120, 70);
      }
      
      if (data.country) {
        doc.text(data.country, 120, 75);
      }
      
      if (data.email) {
        doc.text(`Email: ${data.email}`, 120, 80);
      }
      
      if (data.phone) {
        doc.text(`Tel: ${data.phone}`, 120, 85);
      }
      
      // Tablica sa stavkama računa
      let items = [];
      
      if (data.items && Array.isArray(data.items)) {
        items = data.items.map((item: any) => {
          const itemName = item.productName || '';
          let details = '';
          
          if (item.selectedScent) {
            details += `Miris: ${item.selectedScent}`;
          }
          
          if (item.selectedColor) {
            if (details) details += ', ';
            details += `Boja: ${item.selectedColor}`;
          }
          
          const fullName = details ? `${itemName} (${details})` : itemName;
          const price = parseFloat(item.price).toFixed(2);
          const total = (parseFloat(item.price) * item.quantity).toFixed(2);
          
          return [fullName, item.quantity, `${price} €`, `${total} €`];
        });
      }
      
      // Dodaj tablicu u PDF
      autoTable(doc, {
        head: [[t.item, t.quantity, t.price, t.total]],
        body: items,
        startY: 95,
        theme: 'striped',
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9
        }
      });
      
      // Izračunavanje ukupnog iznosa
      const subtotal = data.items && Array.isArray(data.items)
        ? data.items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2)
        : "0.00";
        
      const tax = "0.00"; // PDV je 0% za male poduzetnike
      const total = subtotal; // Ukupan iznos je jednak međuzbroju jer je PDV 0%
      
      // Dodavanje ukupnog iznosa
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.text(t.subtotal, 140, finalY);
      doc.text(`${subtotal} €`, 175, finalY, { align: "right" });
      
      doc.text(t.tax, 140, finalY + 5);
      doc.text(`${tax} €`, 175, finalY + 5, { align: "right" });
      
      doc.setFont("helvetica", "bold");
      doc.text(t.totalAmount, 140, finalY + 10);
      doc.text(`${total} €`, 175, finalY + 10, { align: "right" });
      
      // Dodavanje napomene o PDV-u
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      if (lang === "hr") {
        doc.text("* PDV nije obračunat temeljem čl. 90 st. 2 Zakona o PDV-u.", 20, finalY + 20);
      } else if (lang === "en") {
        doc.text("* VAT is not calculated based on Art. 90 para. 2 of the VAT Act.", 20, finalY + 20);
      } else if (lang === "de") {
        doc.text("* MwSt. wird nicht berechnet gemäß Art. 90 Abs. 2 des MwSt-Gesetzes.", 20, finalY + 20);
      }
      
      // Dodavanje potpisa
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Potpis / Signature", 150, finalY + 35, { align: "center" });
      
      // Spremanje PDF-a
      doc.save(`Invoice_${data.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Greška pri generiranju PDF-a:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom generiranja PDF-a",
        variant: "destructive"
      });
    }
  };
  
  // Dodaj proizvod u listu
  const addProduct = (product: SelectedProduct) => {
    setSelectedProducts([...selectedProducts, product]);
  };
  
  // Ukloni proizvod iz liste
  const removeProduct = (index: number) => {
    const newProducts = [...selectedProducts];
    newProducts.splice(index, 1);
    setSelectedProducts(newProducts);
  };
  
  // Postavi podatke iz narudžbe
  const setOrderData = (order: any) => {
    setSelectedOrder(order);
    
    // Dohvati podatke za korisnika iz API-ja
    const userId = order.userId;
    if (userId) {
      // Ovdje bismo mogli dohvatiti korisničke podatke iz API-ja
      // Za sada samo postavljamo dostupne vrijednosti
      form.setValue("firstName", "");
      form.setValue("lastName", "");
      form.setValue("address", "");
      form.setValue("city", "");
      form.setValue("postalCode", "");
      form.setValue("country", "");
      form.setValue("email", "");
      form.setValue("phone", "");
    }
    
    // Prazna implementacija - trebali bismo dohvatiti stavke iz API-ja
    // Za sada samo postavljamo praznu listu
    setSelectedProducts([]);
  };
  
  // Kreiranje novog računa
  const handleCreateInvoice = (data: CreateInvoiceFormValues) => {
    console.log("handleCreateInvoice pokrenut s podacima:", data);
    
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
      
      // Direktno pozivam API umjesto fetch-a i XMLHttpRequest - koristim apiRequest umjesto
      apiRequest('POST', '/api/invoices', invoiceData)
        .then(response => {
          console.log("API odgovor status:", response.status);
          return response.json();
        })
        .then(data => {
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
            
            toast({
              title: "Uspješno kreiran račun",
              description: `Račun ${data.invoiceNumber} je uspješno kreiran i preuzet`,
            });
            
            // Osvježi popis računa
            refetchInvoices();
            
            // Reset forme
            form.reset();
            form.setValue("invoiceNumber", createInvoiceNumber());
            form.setValue("language", "hr");
            setSelectedProducts([]);
            setSelectedOrder(null);
            
            // Prebaci na karticu s postojećim računima
            setActiveTab("existing");
          } catch (error) {
            console.error("Greška pri generiranju PDF-a:", error);
          }
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
    } catch (error) {
      console.error("Neočekivana greška:", error);
      toast({
        title: "Neočekivana greška",
        description: (error as Error)?.toString() || "Došlo je do neočekivane greške",
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
      address: invoice.customerAddress || "Adresa kupca",
      city: invoice.customerCity || "Grad kupca",
      postalCode: invoice.customerPostalCode || "12345",
      country: invoice.customerCountry || "Hrvatska",
      email: invoice.customerEmail || "",
      phone: invoice.customerPhone || "",
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
            <div className="rounded-md border">
              <Table>
                <TableCaption>Lista svih računa</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broj računa</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Kupac</TableHead>
                    <TableHead>Iznos</TableHead>
                    <TableHead>Jezik</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length > 0 ? (
                    invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(invoice.createdAt), "dd.MM.yyyy")}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{parseFloat(invoice.total).toFixed(2)} €</TableCell>
                        <TableCell>
                          {invoice.language === "hr" && "Hrvatski"}
                          {invoice.language === "en" && "Engleski"}
                          {invoice.language === "de" && "Njemački"}
                        </TableCell>
                        <TableCell className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDownloadInvoice(invoice)}
                            title="Preuzmi PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="icon"
                                title="Obriši račun"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Jeste li sigurni?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ova akcija će trajno obrisati račun {invoice.invoiceNumber} iz sustava.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Odustani</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Obriši
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Nema pronađenih računa
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-6">
            <div className="bg-background border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4">Izaberi narudžbu (opcionalno)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Možete kreirati račun na temelju postojeće narudžbe ili ručno unijeti podatke.
              </p>
              
              <div className="rounded-md border">
                <Table>
                  <TableCaption>Lista nedavnih narudžbi</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Iznos</TableHead>
                      <TableHead>Akcija</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length > 0 ? (
                      orders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{format(new Date(order.createdAt), "dd.MM.yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === "completed" ? "bg-green-100 text-green-800" : 
                                order.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {order.status === "completed" ? "Završeno" :
                                 order.status === "pending" ? "U obradi" :
                                 order.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{parseFloat(order.total).toFixed(2)} €</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setOrderData(order)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Odaberi
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Nema pronađenih narudžbi
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Form submit event:", e);
                  form.handleSubmit((data) => {
                    console.log("Form handleSubmit callback s podacima:", data);
                    handleCreateInvoice(data);
                  })(e);
                }} 
                className="space-y-6"
              >
                {/* Podaci o kupcu */}
                <div className="bg-background border rounded-md p-4 space-y-4">
                  <h3 className="text-lg font-medium">Podaci o kupcu</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ime*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ime kupca" {...field} />
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
                          <FormLabel>Prezime*</FormLabel>
                          <FormControl>
                            <Input placeholder="Prezime kupca" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email kupca" type="email" {...field} />
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
                            <Input placeholder="Telefon kupca" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Adresa kupca" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grad</FormLabel>
                          <FormControl>
                            <Input placeholder="Grad kupca" {...field} />
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
                            <Input placeholder="Poštanski broj" {...field} />
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
                            <Input placeholder="Država kupca" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Podaci o računu */}
                <div className="bg-background border rounded-md p-4 space-y-4">
                  <h3 className="text-lg font-medium">Podaci o računu</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Broj računa*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jezik računa*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Odaberi jezik" />
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
                </div>
                
                {/* Stavke računa */}
                <div className="bg-background border rounded-md p-4 space-y-4">
                  <h3 className="text-lg font-medium">Stavke računa</h3>
                  
                  <ProductSelector addProduct={addProduct} />
                  
                  <Separator className="my-4" />
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableCaption>Odabrane stavke za račun</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proizvod</TableHead>
                          <TableHead>Miris</TableHead>
                          <TableHead>Boja</TableHead>
                          <TableHead>Količina</TableHead>
                          <TableHead>Cijena</TableHead>
                          <TableHead>Ukupno</TableHead>
                          <TableHead>Akcija</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProducts.length > 0 ? (
                          selectedProducts.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{product.productName}</TableCell>
                              <TableCell>{product.selectedScent || '-'}</TableCell>
                              <TableCell>{product.selectedColor || '-'}</TableCell>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell>{parseFloat(product.price).toFixed(2)} €</TableCell>
                              <TableCell>
                                {(parseFloat(product.price) * product.quantity).toFixed(2)} €
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="destructive" 
                                  size="icon"
                                  onClick={() => removeProduct(index)}
                                  title="Ukloni stavku"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              Nema odabranih proizvoda
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {selectedProducts.length > 0 && (
                    <div className="flex flex-col items-end mt-4 space-y-2">
                      <div className="flex justify-between w-full max-w-xs">
                        <span className="font-medium">Međuzbroj:</span>
                        <span>
                          {selectedProducts.reduce(
                            (sum, product) => sum + parseFloat(product.price) * product.quantity, 
                            0
                          ).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between w-full max-w-xs">
                        <span className="font-medium">PDV (0%):</span>
                        <span>0.00 €</span>
                      </div>
                      <div className="flex justify-between w-full max-w-xs font-bold text-lg">
                        <span>Ukupno:</span>
                        <span>
                          {selectedProducts.reduce(
                            (sum, product) => sum + parseFloat(product.price) * product.quantity, 
                            0
                          ).toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={selectedProducts.length === 0}
                    onClick={(e) => {
                      console.log("Klik na gumb za kreiranje računa");
                      // Ne moramo ništa činiti, samo dodatno logiranje
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Kreiraj račun
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}