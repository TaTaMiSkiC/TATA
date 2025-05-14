import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from 'react-helmet';
import AdminLayout from "@/components/admin/AdminLayout";
import { Collection, InsertCollection, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Eye, Package } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Schema za validaciju forme kolekcije
const collectionSchema = z.object({
  name: z.string().min(2, "Naziv kolekcije mora imati barem 2 znaka"),
  description: z.string().min(10, "Opis mora imati barem 10 znakova"),
  imageUrl: z.string().optional(),
  featuredOnHome: z.boolean().default(false),
  active: z.boolean().default(true),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

export default function AdminCollections() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isProductsSheetOpen, setIsProductsSheetOpen] = useState(false);
  
  // Dohvati kolekcije
  const { data: collections, isLoading } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });
  
  // Dohvati proizvode za kolekciju
  const { data: collectionProducts, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/collections", selectedCollection?.id, "products"],
    queryFn: () => {
      if (!selectedCollection) return Promise.resolve([]);
      return fetch(`/api/collections/${selectedCollection.id}/products`).then(res => res.json());
    },
    enabled: !!selectedCollection,
  });
  
  // Dohvati sve proizvode za dodavanje u kolekciju
  const { data: allProducts, isLoading: isAllProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !!selectedCollection,
  });
  
  // Forma za dodavanje/uređivanje kolekcije
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      featuredOnHome: false,
      active: true,
    },
  });
  
  // Mutacija za dodavanje kolekcije
  const { t } = useLanguage();
  const createCollectionMutation = useMutation({
    mutationFn: async (data: CollectionFormValues) => {
      const response = await apiRequest("POST", "/api/collections", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.collections.successCreate"),
        description: t("admin.collections.successCreateDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.collections.errorCreate"),
        description: t("admin.collections.errorCreateDesc").replace("{error}", error.message),
        variant: "destructive",
      });
    },
  });
  
  // Mutacija za ažuriranje kolekcije
  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CollectionFormValues }) => {
      const response = await apiRequest("PUT", `/api/collections/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.collections.successUpdate"),
        description: t("admin.collections.successUpdateDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setIsFormOpen(false);
      setCurrentCollection(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.collections.errorUpdate"),
        description: t("admin.collections.errorUpdateDesc").replace("{error}", error.message),
        variant: "destructive",
      });
    },
  });
  
  // Mutacija za brisanje kolekcije
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/collections/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t("admin.collections.successDelete"),
        description: t("admin.collections.successDeleteDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setIsDeleteDialogOpen(false);
      setCurrentCollection(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.collections.errorDelete"),
        description: t("admin.collections.errorDeleteDesc").replace("{error}", error.message),
        variant: "destructive",
      });
    },
  });
  
  // Mutacija za dodavanje proizvoda u kolekciju
  const addProductToCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, productId }: { collectionId: number; productId: number }) => {
      const response = await apiRequest("POST", `/api/collections/${collectionId}/products`, { productId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Proizvod je uspješno dodan u kolekciju.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collections", selectedCollection?.id, "products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom dodavanja proizvoda u kolekciju: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutacija za uklanjanje proizvoda iz kolekcije
  const removeProductFromCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, productId }: { collectionId: number; productId: number }) => {
      await apiRequest("DELETE", `/api/collections/${collectionId}/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Proizvod je uspješno uklonjen iz kolekcije.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collections", selectedCollection?.id, "products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom uklanjanja proizvoda iz kolekcije: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handler za otvaranje forme za uređivanje
  const handleEdit = (collection: Collection) => {
    setCurrentCollection(collection);
    form.reset({
      name: collection.name,
      description: collection.description,
      imageUrl: collection.imageUrl || "",
      featuredOnHome: collection.featuredOnHome,
      active: collection.active,
    });
    setIsFormOpen(true);
  };
  
  // Handler za otvaranje dijaloga za brisanje
  const handleDeleteClick = (collection: Collection) => {
    setCurrentCollection(collection);
    setIsDeleteDialogOpen(true);
  };
  
  // Handler za slanje forme
  const onSubmit = (data: CollectionFormValues) => {
    if (currentCollection) {
      updateCollectionMutation.mutate({ id: currentCollection.id, data });
    } else {
      createCollectionMutation.mutate(data);
    }
  };
  
  // Handler za otvaranje pregleda proizvoda u kolekciji
  const handleViewProducts = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsProductsSheetOpen(true);
  };
  
  // Handler za dodavanje proizvoda u kolekciju
  const handleAddProductToCollection = (productId: number) => {
    if (selectedCollection) {
      addProductToCollectionMutation.mutate({
        collectionId: selectedCollection.id,
        productId,
      });
    }
  };
  
  // Handler za uklanjanje proizvoda iz kolekcije
  const handleRemoveProductFromCollection = (productId: number) => {
    if (selectedCollection) {
      removeProductFromCollectionMutation.mutate({
        collectionId: selectedCollection.id,
        productId,
      });
    }
  };
  
  // Provjeri je li proizvod već u kolekciji
  const isProductInCollection = (productId: number) => {
    return collectionProducts?.some(product => product.id === productId) || false;
  };
  
  return (
    <AdminLayout>
      <Helmet>
        <title>Upravljanje kolekcijama | Kerzenwelt Admin</title>
      </Helmet>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Upravljanje kolekcijama</h1>
          <Button onClick={() => {
            setCurrentCollection(null);
            form.reset({
              name: "",
              description: "",
              imageUrl: "",
              featuredOnHome: false,
              active: true,
            });
            setIsFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj kolekciju
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Kolekcije</CardTitle>
            <CardDescription>
              Pregled svih kolekcija proizvoda. Kolekcije omogućuju grupiranje proizvoda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : collections && collections.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prikazano na početnoj</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((collection) => (
                    <TableRow key={collection.id}>
                      <TableCell className="font-medium">{collection.name}</TableCell>
                      <TableCell className="max-w-md truncate">{collection.description}</TableCell>
                      <TableCell>
                        {collection.active ? (
                          <Badge variant="default" className="bg-green-500">Aktivno</Badge>
                        ) : (
                          <Badge variant="outline">Neaktivno</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {collection.featuredOnHome ? (
                          <Badge variant="default" className="bg-blue-500">Da</Badge>
                        ) : (
                          <Badge variant="outline">Ne</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewProducts(collection)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(collection)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClick(collection)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nema dodanih kolekcija.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog za formu */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentCollection ? "Uredi kolekciju" : "Dodaj novu kolekciju"}</DialogTitle>
            <DialogDescription>
              {currentCollection
                ? "Uredite postojeću kolekciju proizvoda."
                : "Dodajte novu kolekciju proizvoda u katalog."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naziv kolekcije</FormLabel>
                    <FormControl>
                      <Input placeholder="Npr. Jesenska kolekcija" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis kolekcije</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Unesite detaljan opis kolekcije..."
                        className="resize-none min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL slike (neobavezno)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Unesite URL slike koja predstavlja kolekciju
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-4">
                <FormField
                  control={form.control}
                  name="featuredOnHome"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Prikaži na početnoj stranici
                        </FormLabel>
                        <FormDescription>
                          Kolekcija će biti istaknuta na početnoj stranici
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Aktivna kolekcija
                        </FormLabel>
                        <FormDescription>
                          Kolekcija će biti vidljiva kupcima
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    setCurrentCollection(null);
                    form.reset();
                  }}
                >
                  Odustani
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || createCollectionMutation.isPending || updateCollectionMutation.isPending}
                >
                  {(form.formState.isSubmitting || createCollectionMutation.isPending || updateCollectionMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {currentCollection ? "Spremi promjene" : "Dodaj kolekciju"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog za brisanje */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jeste li sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova će radnja trajno izbrisati kolekciju &quot;{currentCollection?.name}&quot; i sve veze s proizvodima.
              Ova radnja se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setCurrentCollection(null);
            }}>
              Odustani
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (currentCollection) {
                  deleteCollectionMutation.mutate(currentCollection.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCollectionMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Sheet za upravljanje proizvodima u kolekciji */}
      <Sheet open={isProductsSheetOpen} onOpenChange={setIsProductsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] md:w-[750px]">
          <SheetHeader>
            <SheetTitle>Proizvodi u kolekciji: {selectedCollection?.name}</SheetTitle>
            <SheetDescription>
              Pregledajte i upravljajte proizvodima u ovoj kolekciji.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Trenutni proizvodi u kolekciji</h3>
              {isProductsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : collectionProducts && collectionProducts.length > 0 ? (
                <div className="space-y-4">
                  {collectionProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {product.description.substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveProductFromCollection(product.id)}
                      >
                        Ukloni
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nema proizvoda u ovoj kolekciji.
                </p>
              )}
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Dodaj proizvode u kolekciju</h3>
              {isAllProductsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : allProducts && allProducts.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {allProducts.map((product) => {
                    const inCollection = isProductInCollection(product.id);
                    return (
                      <div key={product.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 mr-3 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {product.description.substring(0, 60)}...
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant={inCollection ? "outline" : "default"} 
                          size="sm"
                          disabled={inCollection}
                          onClick={() => !inCollection && handleAddProductToCollection(product.id)}
                        >
                          {inCollection ? "Već dodano" : "Dodaj"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nema dostupnih proizvoda za dodavanje.
                </p>
              )}
            </div>
          </div>
          
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline" onClick={() => {
                setSelectedCollection(null);
              }}>
                Zatvori
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}