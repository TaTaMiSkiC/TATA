import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Product, insertProductSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderCircle } from "lucide-react";

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedScents, setSelectedScents] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<number[]>([]);
  const [hasColorOptions, setHasColorOptions] = useState(product?.hasColorOptions || false);
  const [featured, setFeatured] = useState(product?.featured || false);

  // Create extended schema with validations
  const validationSchema = insertProductSchema.extend({
    featured: z.boolean().optional(),
    hasColorOptions: z.boolean().optional(),
    price: z.string().refine((val) => !isNaN(parseFloat(val)), {
      message: "Cijena mora biti validan broj",
    }),
    stock: z.coerce.number().int().min(0, {
      message: "Zaliha mora biti pozitivan broj",
    }),
    categoryId: z.number({
      required_error: "Kategorija je obavezna",
    }),
    // Ova polja imamo samo zbog defaultValues, ali su zamijenjena checkbox listama
    scent: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
  });

  // Create form with validation
  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || "",
      imageUrl: product?.imageUrl || "",
      categoryId: product?.categoryId || undefined,
      stock: product?.stock || 0,
      featured: product?.featured || false,
      hasColorOptions: product?.hasColorOptions || false,
      scent: product?.scent || "",
      color: product?.color || "",
      burnTime: product?.burnTime || "",
    },
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch scents
  const { data: scents, isLoading: scentsLoading } = useQuery({
    queryKey: ["/api/scents"],
  });

  // Fetch colors
  const { data: colors, isLoading: colorsLoading } = useQuery({
    queryKey: ["/api/colors"],
  });

  // Fetch product scents
  useEffect(() => {
    if (product) {
      const fetchProductScents = async () => {
        try {
          const response = await apiRequest("GET", `/api/products/${product.id}/scents`);
          const productScents = await response.json();
          setSelectedScents(productScents.map((scent: any) => scent.id));
        } catch (error) {
          console.error("Failed to fetch product scents:", error);
        }
      };

      fetchProductScents();
    }
  }, [product]);

  // Fetch product colors
  useEffect(() => {
    if (product) {
      const fetchProductColors = async () => {
        try {
          const response = await apiRequest("GET", `/api/products/${product.id}/colors`);
          const productColors = await response.json();
          setSelectedColors(productColors.map((color: any) => color.id));
        } catch (error) {
          console.error("Failed to fetch product colors:", error);
        }
      };

      fetchProductColors();
    }
  }, [product]);

  // Submit handler
  const onSubmit = async (values: z.infer<typeof validationSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Uklanjamo scent i color polja jer više ne koristimo pojedinačne vrijednosti
      const { scent, color, ...restValues } = values;
      
      const productData = {
        ...restValues,
        featured,
        hasColorOptions,
        // Postavljamo na null da ih ne bi API izbacio kao grešku
        scent: null,
        color: null
      };
      
      let savedProduct;
      
      if (product) {
        // Update existing product
        const response = await apiRequest("PUT", `/api/products/${product.id}`, productData);
        savedProduct = await response.json();
      } else {
        // Create new product
        const response = await apiRequest("POST", "/api/products", productData);
        savedProduct = await response.json();
      }
      
      // Handle scents
      if (savedProduct) {
        // First delete all existing scents for this product if we're updating
        if (product) {
          await apiRequest("DELETE", `/api/products/${savedProduct.id}/scents`);
        }
        
        // Add selected scents
        for (const scentId of selectedScents) {
          await apiRequest("POST", `/api/products/${savedProduct.id}/scents/${scentId}`);
        }
        
        // First delete all existing colors for this product if we're updating
        if (product) {
          await apiRequest("DELETE", `/api/products/${savedProduct.id}/colors`);
        }
        
        // Add selected colors
        for (const colorId of selectedColors) {
          await apiRequest("POST", `/api/products/${savedProduct.id}/colors/${colorId}`);
        }
      }
      
      toast({
        title: product ? "Proizvod ažuriran" : "Proizvod kreiran",
        description: product
          ? `Proizvod "${values.name}" je uspješno ažuriran.`
          : `Proizvod "${values.name}" je uspješno kreiran.`,
      });

      // Invalidate products query cache
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom spremanja proizvoda. Pokušajte ponovno.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
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
                        categories?.map((category: any) => (
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
            
            {/* Featured product */}
            <div className="flex items-center space-x-2">
              <Switch 
                id="featured"
                checked={featured}
                onCheckedChange={setFeatured}
              />
              <label
                htmlFor="featured"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Istaknuti proizvod
              </label>
            </div>
            
            {/* Has color options */}
            <div className="flex items-center space-x-2">
              <Switch 
                id="hasColorOptions"
                checked={hasColorOptions}
                onCheckedChange={setHasColorOptions}
              />
              <label
                htmlFor="hasColorOptions"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Omogući odabir boje
              </label>
            </div>
            
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
                    scents?.map((scent: any) => (
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
                    colors?.map((color: any) => (
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
                            className="w-3 h-3 rounded-full mr-2" 
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
    </div>
  );
}