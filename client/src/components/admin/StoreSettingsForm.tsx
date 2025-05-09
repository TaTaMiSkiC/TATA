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
import { Loader2, Save } from "lucide-react";

// Shema za validaciju postavki trgovine
const storeSettingsSchema = z.object({
  store_name: z.string().min(3, "Naziv trgovine mora imati barem 3 znaka"),
  store_email: z.string().email("Unesite ispravnu email adresu"),
  store_phone: z.string().min(8, "Unesite ispravan telefonski broj"),
  store_address: z.string().min(5, "Adresa mora imati barem 5 znakova"),
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

export default function StoreSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dohvaćanje trenutnih postavki
  const { data: storeSettings, isLoading } = useQuery({
    queryKey: ["/api/settings/general"],
    queryFn: async () => {
      try {
        console.log("Dohvaćam postavke trgovine...");
        const res = await fetch("/api/settings/general");
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Greška kod dohvaćanja postavki", errorText);
          throw new Error("Neuspješno dohvaćanje postavki trgovine");
        }
        const data = await res.json();
        console.log("Dohvaćene postavke trgovine:", data);
        return data;
      } catch (error) {
        console.error("Greška kod dohvaćanja postavki:", error);
        throw error;
      }
    },
    retry: 1,
  });

  // Inicijalizacija forme
  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      store_name: "",
      store_email: "",
      store_phone: "",
      store_address: "",
    },
    values: storeSettings,
  });

  // Mutacija za ažuriranje postavki
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: StoreSettingsFormValues) => {
      try {
        console.log("Šaljem podatke:", data);
        // Izravno koristimo fetch umjesto apiRequest za više detalja o grešci
        const res = await fetch("/api/settings/general", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        const responseText = await res.text();
        console.log("Odgovor od servera (tekst):", responseText);
        
        if (!res.ok) {
          console.error("Greška pri slanju:", responseText);
          throw new Error("Neuspješno ažuriranje postavki trgovine");
        }
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.log("Nije moguće parsirati odgovor kao JSON");
          result = { success: true };
        }
        
        console.log("Primljen odgovor:", result);
        return result;
      } catch (error) {
        console.error("Uhvaćena greška:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Uspješno ažurirano",
        description: "Postavke trgovine su uspješno ažurirane.",
      });
      // Osvježavanje podataka
      queryClient.invalidateQueries({ queryKey: ["/api/settings/general"] });
    },
    onError: (error: Error) => {
      console.error("Greška u mutaciji:", error);
      toast({
        title: "Greška",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Slanje forme
  function onSubmit(data: StoreSettingsFormValues) {
    console.log("Podaci forme za slanje:", data);
    console.log("Trenutno stanje forme:", form.getValues());
    updateSettingsMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Opće postavke trgovine</h3>
          <p className="text-sm text-muted-foreground">
            Konfigurirajte osnovne podatke o vašoj trgovini
          </p>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Opće postavke trgovine</h3>
        <p className="text-sm text-muted-foreground">
          Konfigurirajte osnovne podatke o vašoj trgovini
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="store_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Naziv trgovine</FormLabel>
                <FormControl>
                  <Input placeholder="Kerzenwelt by Dani" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="store_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email trgovine</FormLabel>
                <FormControl>
                  <Input placeholder="info@kerzenwelt.hr" {...field} />
                </FormControl>
                <FormDescription>
                  Ova adresa će se koristiti za obavijesti o narudžbama
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="store_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon trgovine</FormLabel>
                <FormControl>
                  <Input placeholder="+385 91 234 5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="store_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresa trgovine</FormLabel>
                <FormControl>
                  <Input placeholder="Ilica 123, 10000 Zagreb, Hrvatska" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={updateSettingsMutation.isPending}
            className="w-full"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Spremi postavke
          </Button>
        </form>
      </Form>
    </div>
  );
}