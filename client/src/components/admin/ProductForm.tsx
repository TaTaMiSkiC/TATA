import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertProduct, Product, Category, Scent, Color } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

// Extend the product schema for form validation
const productSchema = z.object({
  name: z.string().min(3, "Naziv mora imati barem 3 znaka"),
  description: z.string().min(10, "Opis mora imati barem 10 znakova"),
  price: z.string().min(1, "Cijena je obavezna").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Cijena mora biti pozitivan broj"
  }),
  imageUrl: z.string().url("Molimo unesite valjani URL slike"),
  categoryId: z.coerce.number().int().positive("Odaberite kategoriju"),
  stock: z.coerce.number().int().min(0, "Zaliha ne može biti negativna"),
  scent: z.string().optional(),
  color: z.string().optional(),
  burnTime: z.string().optional(),
  featured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch categories for the select dropdown
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch scents (mirisi)
  const { data: scents, isLoading: scentsLoading } = useQuery<Scent[]>({
    queryKey: ["/api/scents"],
  });
  
  // Fetch colors (boje)
  const { data: colors, isLoading: colorsLoading } = useQuery<Color[]>({
    queryKey: ["/api/colors"],
  });
  
  // State za čuvanje odabranih mirisa i boja (za povezivanje proizvoda s više mirisa/boja)
  const [selectedScents, setSelectedScents] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<number[]>([]);
  
  // Initialize form with product data or defaults
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price.toString() || "",
      imageUrl: product?.imageUrl || "",
      categoryId: product?.categoryId || 0,
      stock: product?.stock || 0,
      scent: product?.scent || "_none_", // Ovo će postati samo default/primarni miris
      color: product?.color || "_none_", // Ovo će postati samo default/primarna boja
      burnTime: product?.burnTime || "",
      featured: product?.featured || false,
    },
  });
  
  // Učitaj postojeće mirise i boje proizvoda ako ažuriramo postojeći proizvod
  useEffect(() => {
    const loadProductScentsAndColors = async () => {
      if (product?.id) {
        try {
          // Dohvati mirise proizvoda
          const scentsResponse = await fetch(`/api/products/${product.id}/scents`);
          if (scentsResponse.ok) {
            const scentData = await scentsResponse.json();
            setSelectedScents(scentData.map((s: Scent) => s.id));
          }
          
          // Dohvati boje proizvoda
          const colorsResponse = await fetch(`/api/products/${product.id}/colors`);
          if (colorsResponse.ok) {
            const colorData = await colorsResponse.json();
            setSelectedColors(colorData.map((c: Color) => c.id));
          }
        } catch (error) {
          console.error("Greška pri dohvaćanju mirisa i boja proizvoda:", error);
        }
      }
    };
    
    loadProductScentsAndColors();
  }, [product?.id]);
  
  // Update form when product prop changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        imageUrl: product.imageUrl || "",
        categoryId: product.categoryId || 0,
        stock: product.stock,
        scent: product.scent ? product.scent : "_none_",
        color: product.color ? product.color : "_none_",
        burnTime: product.burnTime || "",
        featured: product.featured,
      });
    }
  }, [product, form]);
  
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Format data for API
      const productData: InsertProduct = {
        ...data,
        price: data.price,
        // Postavi na prazan string ako korisnik odabere "_none_"
        scent: data.scent === "_none_" ? "" : data.scent,
        color: data.color === "_none_" ? "" : data.color,
      };
      
      let productId: number;
      
      if (product) {
        // Update existing product
        const response = await apiRequest("PUT", `/api/products/${product.id}`, productData);
        productId = product.id;
        toast({
          title: "Proizvod ažuriran",
          description: `${data.name} je uspješno ažuriran.`,
        });
      } else {
        // Create new product
        const response = await apiRequest("POST", "/api/products", productData);
        const responseData = await response.json();
        productId = responseData.id;
        toast({
          title: "Proizvod kreiran",
          description: `${data.name} je uspješno kreiran.`,
        });
        form.reset(); // Clear form after successful creation
      }
      
      // Nakon što smo spremili proizvod, ažuriramo njegove boje i mirise
      if (productId) {
        // Prvo obrišemo sve postojeće veze proizvoda s bojama i mirisima
        if (product) {
          await apiRequest("DELETE", `/api/products/${productId}/scents`);
          await apiRequest("DELETE", `/api/products/${productId}/colors`);
        }
        
        // Dodajemo odabrane mirise
        for (const scentId of selectedScents) {
          await apiRequest("POST", `/api/products/${productId}/scents`, { scentId });
        }
        
        // Dodajemo odabrane boje
        for (const colorId of selectedColors) {
          await apiRequest("POST", `/api/products/${productId}/colors`, { colorId });
        }
        
        toast({
          title: "Opcije proizvoda ažurirane",
          description: `Mirise i boje za ${data.name} su uspješno ažurirane.`,
        });
      }
      
      // Invalidate products query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom spremanja proizvoda.",
        variant: "destructive",
      });
      console.error("Error saving product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? "Uredi proizvod" : "Novi proizvod"}</CardTitle>
        <CardDescription>
          {product 
            ? "Uredite detalje postojećeg proizvoda" 
            : "Ispunite obrazac za kreiranje novog proizvoda"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naziv proizvoda *</FormLabel>
                    <FormControl>
                      <Input placeholder="Npr. Vanilla Dreams" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorija *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Odaberite kategoriju" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoriesLoading ? (
                          <div className="py-2 text-center">Učitavanje...</div>
                        ) : (
                          categories?.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cijena (€) *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Npr. 24.99" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Stock */}
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zaliha *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="Npr. 50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Image URL */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>URL slike *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      URL do slike proizvoda. Preporučene dimenzije: 800x800px.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Opis *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Opišite proizvod..." 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Scent */}
              <FormField
                control={form.control}
                name="scent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Miris</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Odaberite miris" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scentsLoading ? (
                          <div className="py-2 text-center">Učitavanje...</div>
                        ) : (
                          <>
                            <SelectItem value="_none_">Bez mirisa</SelectItem>
                            {scents?.map((scent) => (
                              <SelectItem 
                                key={scent.id} 
                                value={scent.name}
                              >
                                {scent.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Color */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boja</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Odaberite boju" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colorsLoading ? (
                          <div className="py-2 text-center">Učitavanje...</div>
                        ) : (
                          <>
                            <SelectItem value="_none_">Bez boje</SelectItem>
                            {colors?.map((color) => (
                              <SelectItem 
                                key={color.id} 
                                value={color.name}
                              >
                                <div className="flex items-center">
                                  <span 
                                    className="w-4 h-4 rounded-full mr-2" 
                                    style={{ backgroundColor: color.hexValue }}
                                  ></span>
                                  {color.name}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Burn time */}
              <FormField
                control={form.control}
                name="burnTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vrijeme gorenja</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Npr. 40-45 sati" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Dostupni mirisi */}
              <div className="col-span-full">
                <FormLabel>Dostupni mirisi</FormLabel>
                <div className="mt-2 border rounded-md p-4">
                  <div className="text-sm text-gray-500 mb-3">
                    Odaberite sve mirise koji su dostupni za ovaj proizvod:
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {scentsLoading ? (
                      <div>Učitavanje mirisa...</div>
                    ) : (
                      scents?.map((scent) => (
                        <div key={scent.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`scent-${scent.id}`}
                            checked={selectedScents.includes(scent.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedScents([...selectedScents, scent.id]);
                              } else {
                                setSelectedScents(selectedScents.filter(id => id !== scent.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`scent-${scent.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {scent.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Dostupne boje */}
              <div className="col-span-full">
                <FormLabel>Dostupne boje</FormLabel>
                <div className="mt-2 border rounded-md p-4">
                  <div className="text-sm text-gray-500 mb-3">
                    Odaberite sve boje koje su dostupne za ovaj proizvod:
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {colorsLoading ? (
                      <div>Učitavanje boja...</div>
                    ) : (
                      colors?.map((color) => (
                        <div key={color.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`color-${color.id}`}
                            checked={selectedColors.includes(color.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedColors([...selectedColors, color.id]);
                              } else {
                                setSelectedColors(selectedColors.filter(id => id !== color.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`color-${color.id}`}
                            className="flex items-center text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            <span 
                              className="w-4 h-4 rounded-full mr-2" 
                              style={{ backgroundColor: color.hexValue }}
                            ></span>
                            {color.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Featured */}
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 col-span-full mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Istaknuti proizvod</FormLabel>
                      <FormDescription>
                        Istaknuti proizvodi prikazuju se na početnoj stranici
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Image preview */}
            {form.watch("imageUrl") && (
              <div className="mt-4">
                <div className="border rounded-md p-2 max-w-xs">
                  <p className="text-sm text-gray-500 mb-2">Pregled slike:</p>
                  <img 
                    src={form.watch("imageUrl")} 
                    alt="Preview" 
                    className="max-h-48 rounded-md object-contain mx-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/400x400/gray/white?text=Greška+pri+učitavanju";
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Poništi
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {product ? "Spremi promjene" : "Kreiraj proizvod"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
