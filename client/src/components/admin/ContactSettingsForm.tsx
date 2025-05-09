import React, { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

// Schema za validaciju
const ContactSchema = z.object({
  address: z.string().min(3, "Adresa je obavezna"),
  city: z.string().min(2, "Grad je obavezan"),
  postalCode: z.string().min(2, "Poštanski broj je obavezan"),
  phone: z.string().min(5, "Telefonski broj je obavezan"),
  email: z.string().email("Unesite ispravnu email adresu"),
  workingHours: z.string().min(2, "Radno vrijeme je obavezno"),
});

type ContactFormValues = z.infer<typeof ContactSchema>;

export default function ContactSettingsForm() {
  const { toast } = useToast();

  // Dohvati postojeće postavke
  const { data: contactSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings/contact"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings/contact");
      return await res.json();
    },
  });

  // Inicijalizacija forme
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      address: "",
      city: "",
      postalCode: "",
      phone: "",
      email: "",
      workingHours: "",
    },
  });

  // Kada se učitaju podaci, postavi ih u formu
  useEffect(() => {
    if (contactSettings) {
      form.reset({
        address: contactSettings.address || "",
        city: contactSettings.city || "",
        postalCode: contactSettings.postalCode || "",
        phone: contactSettings.phone || "",
        email: contactSettings.email || "",
        workingHours: contactSettings.workingHours || "",
      });
    }
  }, [contactSettings, form]);

  // Mutacija za spremanje postavki
  const updateContactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      const res = await apiRequest("POST", "/api/settings/contact", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/contact"] });
      toast({
        title: "Postavke spremljene",
        description: "Kontakt podaci su uspješno ažurirani.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  const onSubmit = (data: ContactFormValues) => {
    updateContactMutation.mutate(data);
  };

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontakt podaci</CardTitle>
        <CardDescription>
          Uredite kontakt podatke koji se prikazuju na web stranici
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ulica i broj" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grad</FormLabel>
                      <FormControl>
                        <Input placeholder="Grad" {...field} />
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
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonski broj</FormLabel>
                    <FormControl>
                      <Input placeholder="+385 1 234 5678" {...field} />
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
                    <FormLabel>Email adresa</FormLabel>
                    <FormControl>
                      <Input placeholder="info@kerzenwelt.hr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="workingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Radno vrijeme</FormLabel>
                  <FormControl>
                    <Input placeholder="Pon - Pet: 9:00 - 17:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={updateContactMutation.isPending}
            >
              {updateContactMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Spremi postavke
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}