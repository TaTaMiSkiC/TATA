import React, { useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Tabs, TabsList, TabsTrigger, TabsContent 
} from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { 
  Plus, FileText, Trash2, Download, ShoppingCart, Upload, File, Calendar, X
} from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Order, Product, Scent, Color } from "@shared/schema";
import logoImg from "@assets/Kerzenwelt by Dani.png";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import DocumentManager from "@/components/admin/DocumentManager";
import { generateInvoicePdf, getPaymentMethodText } from "./new-invoice-generator";

// Pomoćna funkcija za generiranje broja fakture
const createInvoiceNumber = async (orderId?: number) => {
  // Generiranje broja računa u formatu i450, i451, itd.
  try {
    const response = await fetch('/api/invoices/last');
    const lastInvoice = await response.json();
    
    console.log("Dohvaćen posljednji račun:", lastInvoice);
    
    if (lastInvoice && lastInvoice.invoiceNumber) {
      // Parsiranje postojećeg broja računa
      const currentNumber = lastInvoice.invoiceNumber.substring(1); // Isključi 'i' prefix
      const nextNumber = parseInt(currentNumber) + 1;
      return `i${nextNumber}`;
    } else {
      // Ako nema postojećih računa, počni od 450
      return "i450";
    }
  } catch (error) {
    console.error("Greška pri dohvaćanju posljednjeg broja računa:", error);
    return orderId ? `i${orderId + 450}` : "i450";
  }
};

// Komponenta za odabir jezika računa
function LanguageSelector({ invoice, onSelectLanguage }: { invoice: any, onSelectLanguage: (invoice: any, language: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Preuzmi PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onSelectLanguage(invoice, "hr")}>
          <img 
            src="https://flagcdn.com/24x18/hr.png" 
            width="24" 
            height="18" 
            alt="Croatian flag"
            className="mr-2"
          />
          Hrvatski
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectLanguage(invoice, "en")}>
          <img 
            src="https://flagcdn.com/24x18/gb.png" 
            width="24" 
            height="18" 
            alt="English flag"
            className="mr-2"
          />
          Engleski
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectLanguage(invoice, "de")}>
          <img 
            src="https://flagcdn.com/24x18/de.png" 
            width="24" 
            height="18" 
            alt="German flag"
            className="mr-2"
          />
          Njemački
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Tipovi za fakture
interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerAddress: string | null;
  customerCity: string | null;
  customerPostalCode: string | null;
  customerCountry: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  paymentMethod: string;
  total: string;
  subtotal: string;
  tax: string;
  language: string;
  createdAt: string;
}

// Odabrani proizvod
interface SelectedProduct {
  id: number;
  name: string;
  price: string;
  quantity: number;
  scentId?: number | null;
  scentName?: string | null;
  colorId?: number | null;
  colorName?: string | null;
  colorIds?: string | null;
  hasMultipleColors?: boolean;
}

// Schema za kreiranje računa
const createInvoiceSchema = z.object({
  firstName: z.string().min(1, "Ime je obavezno"),
  lastName: z.string().min(1, "Prezime je obavezno"),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email("Unesite ispravnu email adresu").optional(),
  phone: z.string().optional(),
  invoiceNumber: z.string().min(1, "Broj računa je obavezan"),
  paymentMethod: z.string().min(1, "Način plaćanja je obavezan"),
  language: z.string().min(1, "Jezik računa je obavezan"),
  customerNote: z.string().optional(),
});

// Tipovi za form
type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;

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
    defaultValues: async () => {
      // Dohvati inicijalni broj računa
      const invoiceNumber = await createInvoiceNumber();
      
      return {
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
        email: "",
        phone: "",
        invoiceNumber,
        language: "hr",
        paymentMethod: "cash",
      };
    }
  });
  
  // Funkcija za generiranje PDF-a
  const generatePdf = (data: any) => {
    // Koristimo novu metodu iz new-invoice-generator.ts koja daje identičan izgled kao u korisničkom dijelu
    generateInvoicePdf(data, toast);
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
      form.setValue('firstName', order.firstName || '');
      form.setValue('lastName', order.lastName || '');
      form.setValue('address', order.shippingAddress || '');
      form.setValue('city', order.shippingCity || '');
      form.setValue('postalCode', order.shippingPostalCode || '');
      form.setValue('country', order.shippingCountry || '');
      form.setValue('email', order.email || '');
      form.setValue('phone', order.phone || '');
      form.setValue('paymentMethod', order.paymentMethod || 'cash');
    }
    
    // Postavi proizvode iz narudžbe
    apiRequest('GET', `/api/orders/${order.id}/items`)
      .then(response => response.json())
      .then(items => {
        console.log("Dohvaćene stavke narudžbe:", items);
        
        // Pripremi odabrane proizvode za račun
        const orderProducts: SelectedProduct[] = items.map((item: any) => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          scentId: item.scentId,
          scentName: item.scentName,
          colorId: item.colorId,
          colorName: item.colorName,
          colorIds: item.colorIds,
          hasMultipleColors: item.hasMultipleColors
        }));
        
        setSelectedProducts(orderProducts);
      })
      .catch(error => {
        console.error("Greška pri dohvaćanju stavki narudžbe:", error);
      });
  };
  
  // Očisti formu i resetiraj podatke
  const resetForm = () => {
    form.reset();
    setSelectedProducts([]);
    setSelectedOrder(null);
    
    // Dohvati novi broj računa
    createInvoiceNumber().then(invoiceNumber => {
      form.setValue('invoiceNumber', invoiceNumber);
    });
  };
  
  // Dohvaćanje podataka za izdelavo PDF-a
  const [productId, setSelectedProductId] = useState<number | null>(null);
  const [price, setPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedScent, setSelectedScent] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedColors, setSelectedColors] = useState<number[]>([]);
  const [colorSelectionMode, setColorSelectionMode] = useState<'single' | 'multiple'>('single');
  const [orderSearchTerm, setOrderSearchTerm] = useState<string>('');
  
  // Dohvati proizvode
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Dohvati korisnike
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });
  
  // Dohvati mirise za odabrani proizvod
  const { data: productScents = [] } = useQuery<Scent[]>({
    queryKey: [`/api/products/${productId}/scents`],
    enabled: !!productId,
  });
  
  // Dohvati boje za odabrani proizvod
  const { data: productColors = [] } = useQuery<Color[]>({
    queryKey: [`/api/products/${productId}/colors`],
    enabled: !!productId,
  });
  
  // Postavi cijenu kada se odabere proizvod
  const handleProductChange = async (productId: string) => {
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
    
    // Ručno dohvaćanje mirisa i boja
    try {
      const scentsResponse = await fetch(`/api/products/${id}/scents`);
      const scentsData = await scentsResponse.json();
      console.log("Dohvaćeni mirisi:", scentsData);
      
      const colorsResponse = await fetch(`/api/products/${id}/colors`);
      const colorsData = await colorsResponse.json();
      console.log("Dohvaćene boje:", colorsData);
    } catch (error) {
      console.error("Greška pri dohvaćanju opcija:", error);
    }
  };
  
  // Dodaj proizvod u listu
  const handleAddProduct = () => {
    if (!productId) {
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) {
      return;
    }
    
    let colorInfo;
    if (colorSelectionMode === 'multiple' && selectedColors.length > 0) {
      const colorNames = selectedColors.map(colorId => {
        const color = productColors.find(c => c.id === colorId);
        return color ? color.name : '';
      }).filter(Boolean);
      
      colorInfo = {
        colorId: null, // Multiple colors don't have a single ID
        colorName: colorNames.join(', '),
        colorIds: JSON.stringify(selectedColors),
        hasMultipleColors: true
      };
    } else {
      const color = productColors.find(c => c.id === selectedColor);
      colorInfo = {
        colorId: selectedColor,
        colorName: color ? color.name : null,
        colorIds: selectedColor ? JSON.stringify([selectedColor]) : null,
        hasMultipleColors: false
      };
    }
    
    const scent = productScents.find(s => s.id === selectedScent);
    
    const newProduct: SelectedProduct = {
      id: product.id,
      name: product.name,
      price: price || product.price,
      quantity: quantity,
      scentId: selectedScent,
      scentName: scent ? scent.name : null,
      ...colorInfo
    };
    
    console.log("Dodajem proizvod:", newProduct);
    
    addProduct(newProduct);
    
    // Resetiraj odabire
    setSelectedProductId(null);
    setSelectedScent(null);
    setSelectedColor(null);
    setSelectedColors([]);
    setPrice("");
    setQuantity(1);
    setColorSelectionMode('single');
  };
  
  // Filtriraj narudžbe prema uvjetima pretraživanja
  const filteredOrders = orders.filter(order => {
    if (!orderSearchTerm) return true;
    
    // Pretraži po ID-u narudžbe
    if (order.id.toString().includes(orderSearchTerm)) return true;
    
    // Pretraži po imenu korisnika
    const user = users.find(u => u.id === order.userId);
    if (user && `${user.firstName} ${user.lastName}`.toLowerCase().includes(orderSearchTerm.toLowerCase())) return true;
    
    return false;
  });
  
  // Formatiraj status narudžbe
  const formatOrderStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'Čeka se';
      case 'processing': return 'U obradi';
      case 'completed': return 'Završeno';
      case 'cancelled': return 'Otkazano';
      default: return status;
    }
  };
  
  // Kreiraj novi račun
  const onSubmit = async (data: CreateInvoiceFormValues) => {
    try {
      // Validacija proizvoda
      if (selectedProducts.length === 0) {
        toast({
          title: "Prazna lista proizvoda",
          description: "Dodajte barem jedan proizvod za kreiranje računa",
          variant: "destructive"
        });
        return;
      }
      
      // Priprema podataka za API
      const subtotal = selectedProducts
        .reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0)
        .toFixed(2);
        
      const tax = "0.00";
      const total = (parseFloat(subtotal) + 5.00).toFixed(2); // Dodaj 5€ za dostavu
      
      // Kreiraj podatke korisnika
      const customerName = `${data.firstName} ${data.lastName}`;
      
      // Priprema podataka za API
      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        orderId: selectedOrder ? selectedOrder.id : null,
        userId: selectedOrder ? selectedOrder.userId : 1, // Default admin korisnik ako nema narudžbe
        customerName,
        customerEmail: data.email || "",
        customerAddress: data.address || "",
        customerCity: data.city || "",
        customerPostalCode: data.postalCode || "",
        customerCountry: data.country || "",
        customerPhone: data.phone || "",
        customerNote: data.customerNote || "",
        paymentMethod: data.paymentMethod,
        total,
        subtotal,
        tax,
        language: data.language,
        items: selectedProducts.map(p => ({
          productId: p.id,
          productName: p.name,
          quantity: p.quantity,
          price: p.price,
          selectedScent: p.scentName,
          selectedColor: p.colorName,
          colorIds: p.colorIds,
          hasMultipleColors: p.hasMultipleColors
        }))
      };
      
      console.log("Šaljem podatke za kreiranje računa:", invoiceData);
      
      // Pošalji zahtjev za kreiranje računa
      apiRequest('POST', '/api/invoices', invoiceData)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(text || "Greška prilikom kreiranja računa");
            });
          }
          return response.json();
        })
        .then(result => {
          toast({
            title: "Račun kreiran",
            description: `Račun ${result.invoiceNumber} je uspješno kreiran`
          });
          
          // Osvježi popis računa i resetiraj formu
          refetchInvoices();
          resetForm();
          
          // Prebaci na tab "Postojeći računi"
          setActiveTab("existing");
        })
        .catch(errorResponse => {
          let errorMessage = "Greška prilikom kreiranja računa";
          
          try {
            // Pokušaj parsirati JSON odgovor
            const errorObj = JSON.parse(errorResponse.message);
            errorMessage = errorObj.message || errorMessage;
          } catch (error) {
            // Ako nije JSON, koristi original poruku
            errorMessage = errorResponse.message || errorMessage;
          }
          
          console.error("Greška pri kreiranju računa:", errorResponse);
          
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
  
  // Funkcije za preuzimanje PDF-a za postojeće račune
  const handleDownloadInvoice = (invoice: Invoice) => {
    // Direktno preuzmi račun s originalnim jezikom
    downloadInvoice(invoice, invoice.language || "hr");
  };

  const handleDownloadInvoiceWithLanguage = (invoice: Invoice, language: string) => {
    // Preuzmi račun s odabranim jezikom
    downloadInvoice(invoice, language);
  };

  const downloadInvoice = (invoice: Invoice, language: string) => {
    // Dohvati stavke računa sa servera
    apiRequest('GET', `/api/invoices/${invoice.id}`)
      .then(response => response.json())
      .then(data => {
        console.log("Dohvaćeni podaci za PDF računa:", data);
        
        // Pripremi podatke za PDF s ispravnim nazivima polja koja očekuje funkcija za generiranje PDF-a
        const invoiceData = {
          invoiceNumber: invoice.invoiceNumber,
          createdAt: invoice.createdAt,
          customerName: invoice.customerName,
          customerAddress: invoice.customerAddress || "Adresa kupca",
          customerCity: invoice.customerCity || "Grad kupca",
          customerPostalCode: invoice.customerPostalCode || "12345",
          customerCountry: invoice.customerCountry || "Hrvatska",
          customerEmail: invoice.customerEmail || "",
          customerPhone: invoice.customerPhone || "",
          customerNote: invoice.customerNote || "",
          items: data.items || [], // Koristimo stavke dohvaćene sa servera
          language: language, // Koristimo odabrani jezik
          paymentMethod: invoice.paymentMethod || "cash" // Koristimo način plaćanja iz postojećeg računa
        };
        
        console.log("Priprema podataka za PDF:", invoiceData);
        generatePdf(invoiceData);
      })
      .catch(error => {
        console.error("Greška kod dohvaćanja stavki računa:", error);
        toast({
          title: "Greška",
          description: "Nije moguće dohvatiti stavke računa",
          variant: "destructive"
        });
      });
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
            <TabsTrigger value="documents">
              <File className="h-4 w-4 mr-2" />
              Dokumenti tvrtke
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Postojeći računi</CardTitle>
                <CardDescription>
                  Pregled svih kreiranih računa u sustavu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broj računa</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Kupac</TableHead>
                      <TableHead>Iznos</TableHead>
                      <TableHead>Način plaćanja</TableHead>
                      <TableHead>Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Nema kreiranih računa
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...invoices].sort((a, b) => {
                        // Sortiraj po ID-u (najnoviji prvi)
                        return b.id - a.id;
                      }).map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{format(new Date(invoice.createdAt), 'dd.MM.yyyy')}</TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell>{invoice.total} €</TableCell>
                          <TableCell>
                            {getPaymentMethodText(invoice.paymentMethod, "hr", {
                              cash: "Gotovina",
                              bank: "Bankovni prijenos",
                              paypal: "PayPal",
                              credit_card: "Kreditna kartica"
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <LanguageSelector 
                                invoice={invoice} 
                                onSelectLanguage={handleDownloadInvoiceWithLanguage} 
                              />
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Jeste li sigurni?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Ova akcija će trajno obrisati račun {invoice.invoiceNumber} i ne može se poništiti.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Odustani</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)}>
                                      Obriši
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kreiraj novi račun</CardTitle>
                <CardDescription>
                  Popunite podatke za kreiranje novog računa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Podaci o kupcu</h3>
                        
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ime</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                                <Input {...field} />
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
                                <Input {...field} />
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
                                <Input {...field} />
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
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Poštanski broj</FormLabel>
                                <FormControl>
                                  <Input {...field} />
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
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Država</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Podaci o računu</h3>
                        
                        <FormField
                          control={form.control}
                          name="invoiceNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Broj računa</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly />
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
                              <FormLabel>Jezik računa</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
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
                        
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Način plaćanja</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Odaberite način plaćanja" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="cash">Gotovina</SelectItem>
                                  <SelectItem value="bank_transfer">Bankovni prijenos</SelectItem>
                                  <SelectItem value="paypal">PayPal</SelectItem>
                                  <SelectItem value="credit_card">Kreditna kartica</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="customerNote"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Napomena</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Napomena za račun"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-4 mt-8">
                          <h3 className="text-lg font-medium">Odabir iz postojećih narudžbi</h3>
                          
                          <div className="flex space-x-2 mb-4">
                            <Input
                              placeholder="Pretraži narudžbe po ID-u ili imenu kupca"
                              value={orderSearchTerm}
                              onChange={(e) => setOrderSearchTerm(e.target.value)}
                              className="flex-1"
                            />
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">#</TableHead>
                                  <TableHead>Kupac</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Iznos</TableHead>
                                  <TableHead className="w-20">Akcija</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredOrders.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                      Nema narudžbi koje odgovaraju kriterijima pretrage
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredOrders.map(order => {
                                    const user = users.find(u => u.id === order.userId);
                                    return (
                                      <TableRow key={order.id}>
                                        <TableCell>{order.id}</TableCell>
                                        <TableCell>
                                          {user ? `${user.firstName} ${user.lastName}` : 'Nepoznati korisnik'}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={
                                            order.status === 'completed' ? 'default' :
                                            order.status === 'pending' ? 'secondary' :
                                            order.status === 'cancelled' ? 'destructive' : 'outline'
                                          }>
                                            {formatOrderStatus(order.status)}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{order.total} €</TableCell>
                                        <TableCell>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setOrderData(order)}
                                          >
                                            Odaberi
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Stavke računa</h3>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Dodaj stavku
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                              <DialogTitle>Dodaj stavku na račun</DialogTitle>
                              <DialogDescription>
                                Odaberite proizvod i količinu
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label htmlFor="product" className="text-sm font-medium">
                                  Proizvod
                                </label>
                                <Select 
                                  onValueChange={(value) => handleProductChange(value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Odaberite proizvod" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map(product => (
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name} - {product.price} €
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {productId && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label htmlFor="price" className="text-sm font-medium">
                                        Cijena (€)
                                      </label>
                                      <Input
                                        id="price"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <label htmlFor="quantity" className="text-sm font-medium">
                                        Količina
                                      </label>
                                      <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                      />
                                    </div>
                                  </div>
                                  
                                  {productScents.length > 0 && (
                                    <div className="space-y-2">
                                      <label htmlFor="scent" className="text-sm font-medium">
                                        Miris
                                      </label>
                                      <Select 
                                        onValueChange={(value) => setSelectedScent(parseInt(value))}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Odaberite miris" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {productScents.map(scent => (
                                            <SelectItem key={scent.id} value={scent.id.toString()}>
                                              {scent.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  
                                  {productColors.length > 0 && (
                                    <>
                                      <div className="flex items-center space-x-4">
                                        <label className="text-sm font-medium">
                                          Način odabira boja:
                                        </label>
                                        <div className="flex space-x-2">
                                          <Button 
                                            variant={colorSelectionMode === 'single' ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setColorSelectionMode('single')}
                                            type="button"
                                          >
                                            Jedna boja
                                          </Button>
                                          <Button 
                                            variant={colorSelectionMode === 'multiple' ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setColorSelectionMode('multiple')}
                                            type="button"
                                          >
                                            Više boja
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {colorSelectionMode === 'single' ? (
                                        <div className="space-y-2">
                                          <label htmlFor="color" className="text-sm font-medium">
                                            Boja
                                          </label>
                                          <Select 
                                            onValueChange={(value) => setSelectedColor(parseInt(value))}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Odaberite boju" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {productColors.map(color => (
                                                <SelectItem key={color.id} value={color.id.toString()}>
                                                  {color.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium">
                                            Odaberite više boja
                                          </label>
                                          <div className="grid grid-cols-2 gap-2">
                                            {productColors.map(color => (
                                              <div key={color.id} className="flex items-center space-x-2">
                                                <input
                                                  type="checkbox"
                                                  id={`color-${color.id}`}
                                                  checked={selectedColors.includes(color.id)}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      setSelectedColors([...selectedColors, color.id]);
                                                    } else {
                                                      setSelectedColors(selectedColors.filter(id => id !== color.id));
                                                    }
                                                  }}
                                                  className="h-4 w-4"
                                                />
                                                <label htmlFor={`color-${color.id}`} className="text-sm">
                                                  {color.name}
                                                </label>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                            
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Odustani</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button type="button" onClick={handleAddProduct}>Dodaj</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Proizvod</TableHead>
                              <TableHead>Cijena/kom</TableHead>
                              <TableHead>Količina</TableHead>
                              <TableHead>Ukupno</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedProducts.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6">
                                  Nema dodanih stavki
                                </TableCell>
                              </TableRow>
                            ) : (
                              <>
                                {selectedProducts.map((product, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{product.name}</div>
                                        {product.scentName && (
                                          <div className="text-sm text-muted-foreground">
                                            Miris: {product.scentName}
                                          </div>
                                        )}
                                        {product.colorName && (
                                          <div className="text-sm text-muted-foreground">
                                            Boja: {product.colorName}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{product.price} €</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell>{(parseFloat(product.price) * product.quantity).toFixed(2)} €</TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => removeProduct(index)}
                                      >
                                        <X className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}

                                {/* Totals section */}
                                <TableRow className="bg-muted/50">
                                  <TableCell colSpan={3} className="font-medium">Međuzbroj</TableCell>
                                  <TableCell colSpan={2} className="text-right">
                                    {selectedProducts
                                      .reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0)
                                      .toFixed(2)} €
                                  </TableCell>
                                </TableRow>
                                <TableRow className="bg-muted/50">
                                  <TableCell colSpan={3} className="font-medium">Dostava</TableCell>
                                  <TableCell colSpan={2} className="text-right">5.00 €</TableCell>
                                </TableRow>
                                <TableRow className="bg-muted/50">
                                  <TableCell colSpan={3} className="font-medium">UKUPNO</TableCell>
                                  <TableCell colSpan={2} className="text-right font-bold">
                                    {(selectedProducts
                                      .reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0) + 5.00)
                                      .toFixed(2)} €
                                  </TableCell>
                                </TableRow>
                              </>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Poništi
                      </Button>
                      <Button type="submit">
                        Kreiraj račun
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            <DocumentManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}