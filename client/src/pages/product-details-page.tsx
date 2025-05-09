import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from 'react-helmet';
import Layout from "@/components/layout/Layout";
import { Product, Review, Scent, Color } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Minus,
  Plus,
  Star,
  StarHalf,
  ShoppingBag,
  Heart,
  Share2,
  ChevronRight,
  Truck,
  PackageCheck,
  RefreshCw,
  Clock,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Komentar mora sadržavati barem 10 znakova").max(500, "Komentar može sadržavati najviše 500 znakova"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function ProductDetailsPage() {
  const [, params] = useRoute("/products/:id");
  const productId = parseInt(params?.id || "0");
  const [quantity, setQuantity] = useState(1);
  const [selectedScentId, setSelectedScentId] = useState<number | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });
  
  // Fetch product reviews
  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery<Review[]>({
    queryKey: [`/api/products/${productId}/reviews`],
    enabled: !!productId,
  });
  
  // Fetch product scents
  const { data: productScents, isLoading: scentsLoading } = useQuery<Scent[]>({
    queryKey: [`/api/products/${productId}/scents`],
    enabled: !!productId,
  });
  
  // Fetch product colors
  const { data: productColors, isLoading: colorsLoading } = useQuery<Color[]>({
    queryKey: [`/api/products/${productId}/colors`],
    enabled: !!productId && product?.hasColorOptions,
  });
  
  // Set default scent and color when data is loaded
  useEffect(() => {
    if (productScents && productScents.length > 0 && !selectedScentId) {
      setSelectedScentId(productScents[0].id);
    }
    
    if (productColors && productColors.length > 0 && !selectedColorId && product?.hasColorOptions) {
      setSelectedColorId(productColors[0].id);
    }
  }, [productScents, productColors, product]);
  
  // Review form
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });
  
  // Add to cart
  const handleAddToCart = () => {
    if (!product) return;
    
    // Provjeri jesu li odabrani potrebni mirisi
    if (productScents && productScents.length > 0 && selectedScentId === null) {
      toast({
        title: "Potreban odabir",
        description: "Molimo odaberite miris prije dodavanja u košaricu.",
        variant: "destructive",
      });
      return;
    }
    
    // Provjeri jesu li odabrane potrebne boje samo ako proizvod ima opcije boja
    if (product.hasColorOptions && productColors && productColors.length > 0 && selectedColorId === null) {
      toast({
        title: "Potreban odabir",
        description: "Molimo odaberite boju prije dodavanja u košaricu.",
        variant: "destructive",
      });
      return;
    }
    
    addToCart.mutate(
      { 
        productId: product.id, 
        quantity,
        scentId: selectedScentId || undefined,
        colorId: selectedColorId || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Dodano u košaricu",
            description: `${product.name} (${quantity}x) je dodan u vašu košaricu.`,
          });
        },
      }
    );
  };
  
  // Submit review
  const onSubmitReview = async (values: ReviewFormValues) => {
    if (!productId || !user) return;
    
    try {
      await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: values.rating,
          comment: values.comment,
        }),
        credentials: "include",
      });
      
      toast({
        title: "Recenzija poslana",
        description: "Hvala na vašoj recenziji!",
      });
      
      form.reset();
      refetchReviews();
    } catch (error) {
      toast({
        title: "Greška",
        description: "Recenziju nije moguće poslati. Pokušajte ponovno kasnije.",
        variant: "destructive",
      });
    }
  };
  
  // Increment/decrement quantity
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };
  
  // Calculate average rating
  const averageRating = reviews?.length ? 
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length :
    0;
  
  if (productLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/2 bg-gray-200 animate-pulse aspect-square rounded-lg"></div>
            <div className="w-full md:w-1/2 space-y-4">
              <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 animate-pulse rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
              <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
              <div className="h-10 bg-gray-200 animate-pulse rounded w-1/3"></div>
              <div className="h-12 bg-gray-200 animate-pulse rounded w-full"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="heading text-2xl font-bold mb-4">Proizvod nije pronađen</h1>
          <p className="mb-6">Žao nam je, traženi proizvod ne postoji ili je uklonjen.</p>
          <Button asChild>
            <Link href="/products">Natrag na proizvode</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{`${product.name} | Kerzenwelt by Dani`}</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={`${product.name} | Kerzenwelt by Dani`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.imageUrl || ''} />
      </Helmet>
      
      {/* Breadcrumbs */}
      <div className="bg-muted/30 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/">
              <a className="hover:text-primary">Početna</a>
            </Link>
            <ChevronRight size={14} className="mx-2" />
            <Link href="/products">
              <a className="hover:text-primary">Proizvodi</a>
            </Link>
            <ChevronRight size={14} className="mx-2" />
            <span className="text-foreground font-medium">{product.name}</span>
          </div>
        </div>
      </div>
      
      {/* Product details section */}
      <section className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Product image */}
            <div className="w-full md:w-1/2">
              <div className="bg-neutral rounded-lg overflow-hidden">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            
            {/* Product info */}
            <div className="w-full md:w-1/2">
              <h1 className="heading text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              
              {/* Ratings */}
              <div className="flex items-center mb-4">
                <div className="flex text-warning mr-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    if (i < Math.floor(averageRating)) {
                      return <Star key={i} className="fill-current" size={16} />;
                    } else if (i === Math.floor(averageRating) && averageRating % 1 > 0) {
                      return <StarHalf key={i} className="fill-current" size={16} />;
                    } else {
                      return <Star key={i} size={16} />;
                    }
                  })}
                </div>
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({reviews?.length || 0} recenzija)
                </span>
              </div>
              
              {/* Price */}
              <div className="text-xl font-bold text-primary mb-4">
                {parseFloat(product.price).toFixed(2)} €
              </div>
              
              {/* Short description */}
              <p className="text-muted-foreground mb-6">{product.description}</p>
              
              {/* Product attributes */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {product.scent && (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mr-3">
                      <Flame size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Miris</p>
                      <p className="font-medium text-foreground">{product.scent}</p>
                    </div>
                  </div>
                )}
                
                {product.color && (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mr-3">
                      <div 
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: product.color.toLowerCase() }}
                      ></div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Boja</p>
                      <p className="font-medium text-foreground">{product.color}</p>
                    </div>
                  </div>
                )}
                
                {product.burnTime && (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mr-3">
                      <Clock size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Trajanje</p>
                      <p className="font-medium text-foreground">{product.burnTime}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mr-3">
                    <PackageCheck size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dostupnost</p>
                    <p className="font-medium text-foreground">
                      {product.stock > 0 ? (
                        product.stock > 10 ? (
                          <span className="text-success">Na zalihi</span>
                        ) : (
                          <span className="text-warning">Zadnjih {product.stock} komada</span>
                        )
                      ) : (
                        <span className="text-destructive">Nije na zalihi</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Scent options */}
              {productScents && productScents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Odaberite miris:</h3>
                  <RadioGroup 
                    value={selectedScentId?.toString()} 
                    onValueChange={(value) => setSelectedScentId(parseInt(value))}
                    className="flex flex-wrap gap-2"
                  >
                    {productScents.map((scent) => (
                      <div key={scent.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={scent.id.toString()} id={`scent-${scent.id}`} />
                        <label
                          htmlFor={`scent-${scent.id}`}
                          className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors
                            ${selectedScentId === scent.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                        >
                          {scent.name}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              
              {/* Color options */}
              {product.hasColorOptions && productColors && productColors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Odaberite boju:</h3>
                  <RadioGroup 
                    value={selectedColorId?.toString()} 
                    onValueChange={(value) => setSelectedColorId(parseInt(value))}
                    className="flex flex-wrap gap-3"
                  >
                    {productColors.map((color) => (
                      <div key={color.id} className="flex flex-col items-center">
                        <RadioGroupItem 
                          value={color.id.toString()} 
                          id={`color-${color.id}`} 
                          className="sr-only"
                        />
                        <label
                          htmlFor={`color-${color.id}`}
                          className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all
                            ${selectedColorId === color.id ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-input hover:border-primary/50'}`}
                          style={{ backgroundColor: color.hexValue }}
                          title={color.name}
                        ></label>
                        <span className="text-xs mt-1">{color.name}</span>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              
              {/* Add to cart */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center">
                  <div className="flex border border-input rounded-md overflow-hidden mr-4">
                    <button 
                      type="button" 
                      className="px-3 py-2 bg-muted hover:bg-muted/80 transition"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <input 
                      type="number" 
                      className="w-12 text-center border-none focus:ring-0 bg-background"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0 && val <= product.stock) {
                          setQuantity(val);
                        }
                      }}
                      min={1}
                      max={product.stock}
                    />
                    <button 
                      type="button" 
                      className="px-3 py-2 bg-muted hover:bg-muted/80 transition"
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <Button 
                    className="flex-1"
                    onClick={handleAddToCart}
                    disabled={
                      product.stock === 0 || 
                      addToCart.isPending || 
                      (productScents && productScents.length > 0 && selectedScentId === null) ||
                      (product.hasColorOptions && productColors && productColors.length > 0 && selectedColorId === null)
                    }
                  >
                    <ShoppingBag size={18} className="mr-2" />
                    {addToCart.isPending ? "Dodavanje..." : "Dodaj u košaricu"}
                  </Button>
                </div>
                
                <div className="flex space-x-3">
                  <Button variant="outline" className="flex-1">
                    <Heart size={18} className="mr-2" />
                    Dodaj u favorite
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 size={18} className="mr-2" />
                    Podijeli
                  </Button>
                </div>
              </div>
              
              {/* Shipping info */}
              <div className="mt-8 pt-6 border-t border-input">
                <div className="flex items-center mb-3">
                  <Truck size={18} className="text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Besplatna dostava za narudžbe iznad 50€</span>
                </div>
                <div className="flex items-center">
                  <RefreshCw size={18} className="text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Povrat u roku od 14 dana</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Product tabs section */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="description">
            <TabsList className="w-full flex mb-8 bg-card">
              <TabsTrigger value="description" className="flex-1 py-3">Opis</TabsTrigger>
              <TabsTrigger value="details" className="flex-1 py-3">Detalji</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 py-3">
                Recenzije ({reviews?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="bg-card p-6 rounded-lg shadow-sm">
              <h2 className="heading text-xl font-semibold mb-4">Opis proizvoda</h2>
              <div className="prose max-w-none">
                <p>{product.description}</p>
                <p className="mt-4">
                  Ručno izrađena svijeća od 100% prirodnog sojinog voska s pomno odabranim 
                  mirisnim notama. Naše svijeće su ekološki prihvatljive, bez štetnih kemikalija, 
                  i ne ispuštaju toksine tijekom gorenja.
                </p>
                <p className="mt-4">
                  Svaka svijeća je jedinstvena, izrađena s ljubavlju i pažnjom prema detaljima. 
                  Idealna je za stvaranje ugodne atmosfere u vašem domu ili kao poklon za voljenu osobu.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="bg-card p-6 rounded-lg shadow-sm">
              <h2 className="heading text-xl font-semibold mb-4">Specifikacije proizvoda</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="dimensions">
                      <AccordionTrigger>Dimenzije i težina</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                          <li>Visina: 10 cm</li>
                          <li>Promjer: 8 cm</li>
                          <li>Težina: 350 g</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="materials">
                      <AccordionTrigger>Materijali</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                          <li>100% prirodni sojin vosak</li>
                          <li>Pamučni fitilj</li>
                          <li>Esencijalna ulja</li>
                          <li>Staklena posuda</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <div>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="usage">
                      <AccordionTrigger>Upute za korištenje</AccordionTrigger>
                      <AccordionContent>
                        <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                          <li>Prije prvog paljenja, odrežite fitilj na 5-7 mm</li>
                          <li>Neka svijeća gori najmanje 2 sata pri prvom korištenju</li>
                          <li>Uvijek postavite svijeću na vatrostalno postolje</li>
                          <li>Ne ostavljajte upaljenu svijeću bez nadzora</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="care">
                      <AccordionTrigger>Održavanje</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                          <li>Redovito režite fitilj na 5-7 mm</li>
                          <li>Izbjegavajte propuh u blizini svijeće</li>
                          <li>Preostali vosak možete koristiti u aroma lampicama</li>
                          <li>Staklenu posudu možete ponovno iskoristiti</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="bg-card p-6 rounded-lg shadow-sm">
              <h2 className="heading text-xl font-semibold mb-4">Recenzije kupaca</h2>
              
              {/* Reviews list */}
              {reviews?.length ? (
                <div className="space-y-6 mb-8">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex text-warning mb-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={16} 
                                  className={i < review.rating ? "fill-current" : ""}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="bg-secondary text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center">
                            {review.userId.toString().substring(0, 2)}
                          </div>
                        </div>
                        <p className="text-foreground">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reviewsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Učitavanje recenzija...</p>
                </div>
              ) : (
                <div className="text-center py-8 mb-8">
                  <p className="text-muted-foreground">Još nema recenzija za ovaj proizvod.</p>
                </div>
              )}
              
              {/* Add review form */}
              {user ? (
                <div>
                  <Separator className="my-8" />
                  <h3 className="heading text-lg font-semibold mb-4">Napišite recenziju</h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitReview)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ocjena</FormLabel>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => field.onChange(rating)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    size={24}
                                    className={`${
                                      rating <= field.value ? "text-warning fill-warning" : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vaš komentar</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Podijelite svoje iskustvo s ovim proizvodom..."
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Slanje..." : "Objavi recenziju"}
                      </Button>
                    </form>
                  </Form>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Prijavite se kako biste mogli napisati recenziju.</p>
                  <Button asChild>
                    <Link href="/auth">Prijava / Registracija</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
