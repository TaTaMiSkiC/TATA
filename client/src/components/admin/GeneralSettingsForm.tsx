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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Shema za validaciju općih postavki
const generalSettingsSchema = z.object({
  store_name: z.string().min(3, "Naziv trgovine mora imati barem 3 znaka"),
  store_description: z.string().min(10, "Opis trgovine mora imati barem 10 znakova"),
  store_owner: z.string().min(2, "Ime vlasnika mora imati barem 2 znaka"),
  store_legal_name: z.string().min(3, "Pravni naziv trgovine mora imati barem 3 znaka"),
  store_tax_id: z.string().min(3, "Porezni broj mora imati barem 3 znaka"),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

export default function GeneralSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dohvaćanje trenutnih postavki
  const { data: generalSettings, isLoading } = useQuery({
    queryKey: ["/api/settings/general"],
    queryFn: async () => {
      const res = await fetch("/api/settings/general");
      if (!res.ok) {
        throw new Error("Neuspješno dohvaćanje općih postavki");
      }
      return await res.json();
    },
  });

  // Inicijalizacija forme
  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      store_name: "",
      store_description: "",
      store_owner: "",
      store_legal_name: "",
      store_tax_id: "",
    },
    values: generalSettings,
  });

  // Mutacija za ažuriranje postavki
  const updateGeneralMutation = useMutation({
    mutationFn: async (data: GeneralSettingsFormValues) => {
      const res = await apiRequest("POST", "/api/settings/general", data);
      if (!res.ok) {
        throw new Error("Neuspješno ažuriranje općih postavki");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Uspješno ažurirano",
        description: "Opće postavke su uspješno ažurirane.",
      });
      // Osvježavanje podataka
      queryClient.invalidateQueries({ queryKey: ["/api/settings/general"] });
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
  function onSubmit(data: GeneralSettingsFormValues) {
    updateGeneralMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Opće postavke</CardTitle>
          <CardDescription>
            Učitavanje postavki trgovine...
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
        <CardTitle>Opće postavke</CardTitle>
        <CardDescription>
          Konfigurirajte osnovne podatke o vašoj trgovini
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="store_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naziv trgovine</FormLabel>
                    <FormDescription>Naziv koji će biti prikazan kupcima</FormDescription>
                    <FormControl>
                      <Input placeholder="npr. Kerzenwelt by Dani" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="store_owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ime vlasnika</FormLabel>
                    <FormDescription>Ime koje će biti prikazano uz naziv trgovine</FormDescription>
                    <FormControl>
                      <Input placeholder="npr. Dani" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="store_description"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Opis trgovine</FormLabel>
                    <FormDescription>Kratak opis vaše trgovine koji će biti prikazan na naslovnici</FormDescription>
                    <FormControl>
                      <Textarea 
                        placeholder="npr. Ručno izrađene svijeće od prirodnih sastojaka. Od naše obitelji do vašeg doma." 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                          
              <FormField
                control={form.control}
                name="store_legal_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pravni naziv</FormLabel>
                    <FormDescription>Službeni registrirani naziv trgovine</FormDescription>
                    <FormControl>
                      <Input placeholder="npr. Kerzenwelt d.o.o." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="store_tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OIB/Porezni broj</FormLabel>
                    <FormDescription>Porezni identifikacijski broj trgovine</FormDescription>
                    <FormControl>
                      <Input placeholder="npr. 12345678901" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={updateGeneralMutation.isPending}
              className="w-full md:w-auto"
            >
              {updateGeneralMutation.isPending && (
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