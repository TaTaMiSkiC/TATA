import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";
import { useSettings } from "@/hooks/use-settings-api";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Moon, Sun, Languages, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("account");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Dohvati postavke hook
  const { getSetting, updateSetting } = useSettings();
  
  // Dohvaćanje postavki dostave
  const { data: freeShippingThresholdSetting, isLoading: isLoadingFreeShipping } = getSetting("freeShippingThreshold");
  const { data: standardShippingRateSetting, isLoading: isLoadingStandardShipping } = getSetting("standardShippingRate");
  const { data: expressShippingRateSetting, isLoading: isLoadingExpressShipping } = getSetting("expressShippingRate");
  
  // Shipping settings form
  const shippingSettingsForm = useForm<ShippingSettingsFormValues>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      freeShippingThreshold: freeShippingThresholdSetting?.value || "50",
      standardShippingRate: standardShippingRateSetting?.value || "5",
      expressShippingRate: expressShippingRateSetting?.value || "15",
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

  // Učitavanje podataka iz API-ja u formu - samo kad se učitaju API podaci, a nisu još u formi
  useEffect(() => {
    const isLoadingAny = isLoadingFreeShipping || isLoadingStandardShipping || isLoadingExpressShipping;
    
    // Provjeri jesu li svi podaci učitani i postavi u formu
    if (!isLoadingAny && 
        freeShippingThresholdSetting && 
        standardShippingRateSetting && 
        expressShippingRateSetting) {
      
      // Dohvati trenutne vrijednosti forme
      const formValues = shippingSettingsForm.getValues();
      
      // Samo ako se trenutne vrijednosti forme razlikuju od API vrijednosti, ažuriraj ih
      // Ovo sprječava resetiranje forme tijekom tipkanja
      const apiValues = {
        freeShippingThreshold: freeShippingThresholdSetting.value,
        standardShippingRate: standardShippingRateSetting.value,
        expressShippingRate: expressShippingRateSetting.value
      };
      
      // Usporedba trenutnih vrijednosti forme s API vrijednostima
      const needsUpdate = 
        formValues.freeShippingThreshold === "" || 
        formValues.standardShippingRate === "" || 
        formValues.expressShippingRate === "";
      
      if (needsUpdate) {
        shippingSettingsForm.reset(apiValues, { keepDefaultValues: false });
      }
    }
  }, [
    isLoadingFreeShipping, 
    isLoadingStandardShipping, 
    isLoadingExpressShipping,
    freeShippingThresholdSetting,
    standardShippingRateSetting,
    expressShippingRateSetting,
    shippingSettingsForm
  ]);

  // Handler za postavke dostave
  const onShippingSettingsSubmit = async (data: ShippingSettingsFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Spremanje postavki u bazu podataka
      await updateSetting.mutateAsync({
        key: "freeShippingThreshold",
        value: data.freeShippingThreshold
      });
      
      await updateSetting.mutateAsync({
        key: "standardShippingRate",
        value: data.standardShippingRate
      });
      
      await updateSetting.mutateAsync({
        key: "expressShippingRate",
        value: data.expressShippingRate
      });
      
      toast({
        title: "Postavke dostave spremljene",
        description: "Postavke dostave su uspješno ažurirane i primijenjene na cijeloj stranici.",
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
            <TabsTrigger value="appearance">Izgled i jezik</TabsTrigger>
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
            
            {/* Brisanje korisničkog računa */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Opasna zona</CardTitle>
                <CardDescription>
                  Brisanje korisničkog računa je trajna akcija i ne može se poništiti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Izbriši korisnički račun
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Jeste li sigurni?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ova radnja će trajno izbrisati vaš korisnički račun i sve povezane podatke. 
                        Ova radnja se ne može poništiti.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Odustani</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          setIsDeleting(true);
                          
                          try {
                            if (user) {
                              // Ovdje bi poslali zahtjev za brisanje računa
                              await apiRequest("DELETE", `/api/users/${user.id}`);
                              
                              toast({
                                title: "Račun je izbrisan",
                                description: "Vaš korisnički račun je uspješno izbrisan.",
                              });
                              
                              // Odjavi korisnika
                              logoutMutation.mutate(undefined, {
                                onSuccess: () => {
                                  navigate("/");
                                }
                              });
                            }
                          } catch (error: any) {
                            toast({
                              title: "Greška pri brisanju računa",
                              description: error.message || "Došlo je do greške prilikom brisanja korisničkog računa.",
                              variant: "destructive",
                            });
                            setIsDeleting(false);
                          }
                        }}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Brisanje...
                          </>
                        ) : (
                          "Izbriši račun"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Izgled i jezik */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Izgled</CardTitle>
                <CardDescription>
                  Prilagodite izgled aplikacije
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Tema</h3>
                      <p className="text-sm text-muted-foreground">
                        Postavite svjetlu ili tamnu temu sučelja
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="h-4 w-4 mr-1" />
                        Svjetla
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="h-4 w-4 mr-1" />
                        Tamna
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system")}
                      >
                        <span className="mr-1">🖥️</span>
                        Sustav
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Jezik</CardTitle>
                <CardDescription>
                  Odaberite jezik sučelja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Odabrani jezik: <span className="font-bold">{language === "hr" ? "Hrvatski" : language === "en" ? "Engleski" : "Njemački"}</span></h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Odaberite jezik koji želite koristiti u aplikaciji
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                      variant={language === "hr" ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setLanguage("hr")}
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      Hrvatski
                    </Button>
                    <Button
                      variant={language === "en" ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setLanguage("en")}
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      Engleski
                    </Button>
                    <Button
                      variant={language === "de" ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setLanguage("de")}
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      Njemački
                    </Button>
                  </div>
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