import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Shema za validaciju kontakt podataka
const contactSettingsSchema = z.object({
  address: z.string().min(3, "Adresa mora imati barem 3 znaka"),
  city: z.string().min(2, "Grad mora imati barem 2 znaka"),
  postalCode: z.string().min(2, "Poštanski broj mora imati barem 2 znaka"),
  phone: z.string().min(5, "Telefonski broj mora imati barem 5 znakova"),
  email: z.string().email("Unesite valjanu email adresu"),
  workingHours: z.string().min(3, "Radno vrijeme mora imati barem 3 znaka"),
});

type ContactSettingsFormValues = z.infer<typeof contactSettingsSchema>;

export default function ContactSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dohvaćanje trenutnih postavki
  const { data: contactSettings, isLoading } = useQuery({
    queryKey: ["/api/settings/contact"],
    queryFn: async () => {
      const res = await fetch("/api/settings/contact");
      if (!res.ok) {
        throw new Error("Neuspješno dohvaćanje kontakt podataka");
      }
      return await res.json();
    },
  });

  // Inicijalizacija forme
  const form = useForm<ContactSettingsFormValues>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: {
      address: "",
      city: "",
      postalCode: "",
      phone: "",
      email: "",
      workingHours: "",
    },
    values: contactSettings,
  });

  // Mutacija za ažuriranje postavki
  const updateContactMutation = useMutation({
    mutationFn: async (data: ContactSettingsFormValues) => {
      const res = await apiRequest("POST", "/api/settings/contact", data);
      if (!res.ok) {
        throw new Error("Neuspješno ažuriranje kontakt podataka");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Uspješno ažurirano",
        description: "Kontakt podaci su uspješno ažurirani.",
      });
      // Osvježavanje podataka
      queryClient.invalidateQueries({ queryKey: ["/api/settings/contact"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Slanje forme
  function onSubmit(data: ContactSettingsFormValues) {
    updateContactMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kontakt postavke</CardTitle>
          <CardDescription>
            Učitavanje kontakt podataka...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontakt postavke</CardTitle>
        <CardDescription>
          Upravljajte kontakt podacima koji se prikazuju na stranici
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
                      <Input placeholder="Unesite adresu" {...field} />
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
                        <Input placeholder="Unesite grad" {...field} />
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
                        <Input placeholder="Unesite poštanski broj" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="Unesite telefon" {...field} />
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
                      <Input placeholder="Unesite email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="workingHours"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Radno vrijeme</FormLabel>
                    <FormControl>
                      <Input placeholder="Npr. Pon - Pet: 9:00 - 17:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={updateContactMutation.isPending}
              className="w-full md:w-auto"
            >
              {updateContactMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Spremi promjene
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}