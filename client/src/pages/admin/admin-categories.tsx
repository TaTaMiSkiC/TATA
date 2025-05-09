import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from 'react-helmet';
import AdminLayout from "@/components/admin/AdminLayout";
import { Category, InsertCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Schema za validaciju forme
const categorySchema = z.object({
  name: z.string().min(2, "Naziv kategorije mora imati barem 2 znaka"),
  description: z.string().min(10, "Opis mora imati barem 10 znakova"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategories() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // Dohvati kategorije
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Forma za dodavanje/uređivanje kategorije
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  // Mutacija za dodavanje kategorije
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Kategorija je uspješno dodana.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom dodavanja kategorije: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutacija za ažuriranje kategorije
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CategoryFormValues }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Kategorija je uspješno ažurirana.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsFormOpen(false);
      setCurrentCategory(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom ažuriranja kategorije: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutacija za brisanje kategorije
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Kategorija je uspješno obrisana.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsDeleteDialogOpen(false);
      setCurrentCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom brisanja kategorije: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Otvori formu za dodavanje nove kategorije
  const handleAddCategory = () => {
    form.reset({
      name: "",
      description: "",
    });
    setCurrentCategory(null);
    setIsFormOpen(true);
  };
  
  // Otvori formu za uređivanje kategorije
  const handleEditCategory = (category: Category) => {
    form.reset({
      name: category.name,
      description: category.description,
    });
    setCurrentCategory(category);
    setIsFormOpen(true);
  };
  
  // Otvori dijalog za brisanje kategorije
  const handleDeleteCategory = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteDialogOpen(true);
  };
  
  // Potvrdi brisanje kategorije
  const confirmDeleteCategory = () => {
    if (currentCategory) {
      deleteCategoryMutation.mutate(currentCategory.id);
    }
  };
  
  // Predaj formu za kategoriju
  const onSubmit = (data: CategoryFormValues) => {
    if (currentCategory) {
      // Ažuriranje postojeće kategorije
      updateCategoryMutation.mutate({ id: currentCategory.id, data });
    } else {
      // Dodavanje nove kategorije
      createCategoryMutation.mutate(data);
    }
  };
  
  const isSubmitting = form.formState.isSubmitting || 
                      createCategoryMutation.isPending || 
                      updateCategoryMutation.isPending || 
                      deleteCategoryMutation.isPending;
  
  return (
    <AdminLayout title="Kategorije">
      <Helmet>
        <title>Upravljanje kategorijama | Admin Panel | Kerzenwelt by Dani</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header s akcijama */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kategorije</h1>
            <p className="text-muted-foreground">Upravljajte kategorijama proizvoda</p>
          </div>
          
          <Button onClick={handleAddCategory} disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" /> Nova kategorija
          </Button>
        </div>
        
        {/* Tablica kategorija */}
        <Card>
          <CardHeader>
            <CardTitle>Sve kategorije</CardTitle>
            <CardDescription>
              Popis svih kategorija proizvoda u trgovini
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !categories || categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nema dostupnih kategorija. Dodajte svoju prvu kategoriju.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Naziv</TableHead>
                      <TableHead className="hidden md:table-cell">Opis</TableHead>
                      <TableHead className="w-[150px] text-right">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.id}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell className="hidden md:table-cell truncate max-w-[300px]">
                          {category.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditCategory(category)}
                              disabled={isSubmitting}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteCategory(category)}
                              disabled={isSubmitting}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Forma za kategoriju */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {currentCategory ? "Uredi kategoriju" : "Dodaj novu kategoriju"}
            </DialogTitle>
            <DialogDescription>
              {currentCategory
                ? "Uredite podatke kategorije i kliknite Spremi za pohranu promjena."
                : "Popunite podatke o novoj kategoriji i kliknite Spremi za dodavanje."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naziv kategorije *</FormLabel>
                    <FormControl>
                      <Input placeholder="Unesite naziv kategorije" {...field} />
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
                    <FormLabel>Opis kategorije *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Unesite opis kategorije"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Opišite kategoriju kako bi kupci imali više informacija.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Odustani
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {currentCategory ? "Ažuriranje..." : "Spremanje..."}
                    </>
                  ) : (
                    <>
                      {currentCategory ? "Spremi promjene" : "Spremi kategoriju"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dijalog za potvrdu brisanja */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Brisanje kategorije</AlertDialogTitle>
            <AlertDialogDescription>
              Jeste li sigurni da želite obrisati kategoriju "{currentCategory?.name}"? 
              Ova radnja je nepovratna i može utjecati na proizvode koji su povezani s ovom kategorijom.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategoryMutation.isPending}>Odustani</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCategory}
              disabled={deleteCategoryMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Brisanje...
                </>
              ) : (
                "Da, obriši"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}