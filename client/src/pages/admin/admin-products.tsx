import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from 'react-helmet';
import AdminLayout from "@/components/admin/AdminLayout";
import ProductForm from "@/components/admin/ProductForm";
import { Product } from "@shared/schema";
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
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Filter, MoreVertical, Edit, Trash2, Star } from "lucide-react";

export default function AdminProducts() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Fetch products
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Fetch categories for filtering
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Filter products based on search term and category
  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? product.categoryId === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });
  
  // Handle product edit
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };
  
  // Handle product delete
  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/products/${productToDelete.id}`);
      
      toast({
        title: "Proizvod izbrisan",
        description: `${productToDelete.name} je uspješno izbrisan.`,
      });
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom brisanja proizvoda.",
        variant: "destructive",
      });
    }
  };
  
  // Reset product form
  const resetProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  return (
    <AdminLayout title="Proizvodi">
      <Helmet>
        <title>Upravljanje proizvodima | Admin Panel | Kerzenwelt by Dani</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Proizvodi</h1>
            <p className="text-muted-foreground">Upravljajte proizvodima u trgovini</p>
          </div>
          
          <Button onClick={() => setShowProductForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novi proizvod
          </Button>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pretraži proizvode..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" /> Kategorija
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={() => setCategoryFilter(null)}
                    className={!categoryFilter ? "bg-accent/50" : ""}
                  >
                    Sve kategorije
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories?.map((category) => (
                    <DropdownMenuItem 
                      key={category.id} 
                      onClick={() => setCategoryFilter(category.id)}
                      className={categoryFilter === category.id ? "bg-accent/50" : ""}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
        
        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista proizvoda</CardTitle>
            <CardDescription>
              {filteredProducts ? `${filteredProducts.length} proizvoda` : "Učitavanje proizvoda..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center p-8 text-destructive">
                Došlo je do greške prilikom učitavanja proizvoda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slika</TableHead>
                      <TableHead>Naziv</TableHead>
                      <TableHead>Kategorija</TableHead>
                      <TableHead>Cijena</TableHead>
                      <TableHead>Zaliha</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nema pronađenih proizvoda
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="w-12 h-12 rounded overflow-hidden">
                              <img 
                                src={product.imageUrl || "https://placehold.co/100x100/gray/white?text=Nema+slike"} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://placehold.co/100x100/gray/white?text=Greška";
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {product.name}
                              {product.featured && (
                                <Star className="ml-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {categories?.find(c => c.id === product.categoryId)?.name || "-"}
                          </TableCell>
                          <TableCell>{parseFloat(product.price).toFixed(2)} €</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={product.stock > 0 ? "default" : "destructive"}
                              className={product.stock > 10 ? "bg-green-500" : product.stock > 0 ? "bg-yellow-500" : ""}
                            >
                              {product.stock > 10 ? "Na zalihi" : product.stock > 0 ? "Niska zaliha" : "Nije dostupno"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Akcije</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                  <Edit className="mr-2 h-4 w-4" /> Uredi
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteProduct(product)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Izbriši
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Uredi proizvod" : "Novi proizvod"}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? "Uredite informacije o postojećem proizvodu" 
                : "Dodajte novi proizvod u katalog"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] pr-4">
            <ProductForm 
              product={editingProduct || undefined} 
              onSuccess={resetProductForm}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potvrda brisanja</DialogTitle>
            <DialogDescription>
              Jeste li sigurni da želite izbrisati proizvod "{productToDelete?.name}"? 
              Ova akcija se ne može poništiti.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Odustani
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Izbriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
