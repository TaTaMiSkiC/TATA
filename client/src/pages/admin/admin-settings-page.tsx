import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Form schema za promjenu lozinke
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Trenutna lozinka je obavezna"),
  newPassword: z.string().min(6, "Nova lozinka mora imati barem 6 znakova"),
  confirmPassword: z.string().min(1, "Potvrdite novu lozinku"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Lozinke se ne podudaraju",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

// Form schema za opće postavke trgovine
const storeSettingsSchema = z.object({
  storeName: z.string().min(1, "Naziv trgovine je obavezan"),
  storeEmail: z.string().email("Unesite ispravnu email adresu"),
  storePhone: z.string().min(1, "Telefonski broj je obavezan"),
  storeAddress: z.string().min(1, "Adresa je obavezna"),
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

// Form schema za postavke dostave
const shippingSettingsSchema = z.object({
  freeShippingThreshold: z.string().refine(value => !isNaN(Number(value)), {
    message: "Unesite valjani iznos",
  }),
  standardShippingRate: z.string().refine(value => !isNaN(Number(value)), {
    message: "Unesite valjani iznos",
  }),
  expressShippingRate: z.string().refine(value => !isNaN(Number(value)), {
    message: "Unesite valjani iznos",
  }),
});

type ShippingSettingsFormValues = z.infer<typeof shippingSettingsSchema>;

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password change form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Store settings form
  const storeSettingsForm = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: "Kerzenwelt by Dani",
      storeEmail: "info@kerzenwelt.hr",
      storePhone: "+385 91 234 5678",
      storeAddress: "Ilica 123, 10000 Zagreb, Hrvatska",
    },
  });

  // Shipping settings form
  const shippingSettingsForm = useForm<ShippingSettingsFormValues>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      freeShippingThreshold: "50",
      standardShippingRate: "5",
      expressShippingRate: "15",
    },
  });

  // Handler za promjenu lozinke
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("PUT", `/api/users/${user.id}/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      toast({
        title: "Lozinka uspješno promijenjena",
        description: "Vaša lozinka je uspješno ažurirana.",
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
    } catch (error: any) {
      toast({
        title: "Greška pri promjeni lozinke",
        description: error.message || "Došlo je do greške prilikom promjene lozinke.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler za postavke trgovine
  const onStoreSettingsSubmit = async (data: StoreSettingsFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Simuliramo spremanje postavki trgovine
      // U pravoj implementaciji bi poslali zahtjev na API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Postavke trgovine spremljene",
        description: "Postavke trgovine su uspješno ažurirane.",
      });
    } catch (error: any) {
      toast({
        title: "Greška pri spremanju postavki",
        description: error.message || "Došlo je do greške prilikom spremanja postavki trgovine.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler za postavke dostave
  const onShippingSettingsSubmit = async (data: ShippingSettingsFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Simuliramo spremanje postavki dostave
      // U pravoj implementaciji bi poslali zahtjev na API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Postavke dostave spremljene",
        description: "Postavke dostave su uspješno ažurirane.",
      });
    } catch (error: any) {
      toast({
        title: "Greška pri spremanju postavki",
        description: error.message || "Došlo je do greške prilikom spremanja postavki dostave.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Postavke">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Postavke</h2>
          <p className="text-muted-foreground">
            Upravljajte postavkama vašeg računa i trgovine
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="account">Korisnički račun</TabsTrigger>
            <TabsTrigger value="store">Postavke trgovine</TabsTrigger>
            <TabsTrigger value="shipping">Dostava</TabsTrigger>
          </TabsList>
          
          {/* Postavke korisničkog računa */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Podaci o računu</CardTitle>
                <CardDescription>
                  Pregledajte i ažurirajte podatke vašeg administratorskog računa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Korisničko ime</h3>
                    <p className="text-sm text-muted-foreground mt-1">{user?.username}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Email adresa</h3>
                    <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-base font-medium mb-4">Promjena lozinke</h3>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trenutna lozinka</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Unesite trenutnu lozinku" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova lozinka</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Unesite novu lozinku" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Potvrdite novu lozinku</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Potvrdite novu lozinku" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Spremanje...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Spremi promjene
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Postavke trgovine */}
          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Opće postavke trgovine</CardTitle>
                <CardDescription>
                  Konfigurirajte osnovne podatke o vašoj trgovini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...storeSettingsForm}>
                  <form onSubmit={storeSettingsForm.handleSubmit(onStoreSettingsSubmit)} className="space-y-4">
                    <FormField
                      control={storeSettingsForm.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naziv trgovine</FormLabel>
                          <FormControl>
                            <Input placeholder="Unesite naziv trgovine" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={storeSettingsForm.control}
                      name="storeEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email trgovine</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Ova adresa će se koristiti za obavijesti o narudžbama
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={storeSettingsForm.control}
                      name="storePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon trgovine</FormLabel>
                          <FormControl>
                            <Input placeholder="+385 xx xxx xxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={storeSettingsForm.control}
                      name="storeAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresa trgovine</FormLabel>
                          <FormControl>
                            <Input placeholder="Ulica, grad, poštanski broj" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Spremanje...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Spremi postavke
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Postavke dostave */}
          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Postavke dostave</CardTitle>
                <CardDescription>
                  Konfigurirajte načine dostave i cijene za vašu trgovinu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...shippingSettingsForm}>
                  <form onSubmit={shippingSettingsForm.handleSubmit(onShippingSettingsSubmit)} className="space-y-4">
                    <FormField
                      control={shippingSettingsForm.control}
                      name="freeShippingThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prag za besplatnu dostavu (€)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>
                            Narudžbe iznad ovog iznosa imat će besplatnu dostavu (0 za isključivanje)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={shippingSettingsForm.control}
                      name="standardShippingRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cijena standardne dostave (€)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={shippingSettingsForm.control}
                      name="expressShippingRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cijena ekspresne dostave (€)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Spremanje...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Spremi postavke
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}