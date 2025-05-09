import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Loader2 } from "lucide-react";

// Definiramo validacijsku shemu za form
const shippingFormSchema = z.object({
  freeShippingThreshold: z.string().min(1, "Obavezno polje"),
  standardShippingRate: z.string().min(1, "Obavezno polje"),
  expressShippingRate: z.string().min(1, "Obavezno polje"),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

export default function ShippingSettingsForm() {
  const { toast } = useToast();
  
  // Dohvaćamo trenutne postavke iz API-ja
  const { data: settings, isLoading: isLoadingSettings, refetch } = useQuery({
    queryKey: ["/api/settings"],
    // Uvijek dohvati svježe podatke, ne koristimo cache
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    select: (data) => {
      // Pretvaranje liste postavki u objekt
      const settingsObj: Record<string, string> = {};
      data.forEach((setting: { key: string; value: string }) => {
        settingsObj[setting.key] = setting.value;
      });
      
      console.log("Učitane postavke iz API-ja:", {
        freeShippingThreshold: settingsObj.freeShippingThreshold || "nije učitano",
        standardShippingRate: settingsObj.standardShippingRate || "nije učitano",
        expressShippingRate: settingsObj.expressShippingRate || "nije učitano"
      });
      
      return settingsObj;
    }
  });

  // Postavke forme
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      freeShippingThreshold: "0",
      standardShippingRate: "0",
      expressShippingRate: "0",
    },
  });
  
  // Kad se učitaju postavke, ažuriramo formu
  useEffect(() => {
    if (settings) {
      console.log("Učitane lokalne postavke:", {
        freeShippingThreshold: settings.freeShippingThreshold || "0",
        standardShippingRate: settings.standardShippingRate || "0",
        expressShippingRate: settings.expressShippingRate || "0"
      });
      
      form.reset({
        freeShippingThreshold: settings.freeShippingThreshold || "0",
        standardShippingRate: settings.standardShippingRate || "0",
        expressShippingRate: settings.expressShippingRate || "0"
      });
    }
  }, [settings, form]);

  // Akcija za spremanje svih postavki odjednom
  const saveAllSettingsMutation = useMutation({
    mutationFn: async (data: ShippingFormValues) => {
      const results = [];
      
      // Spremamo svaku postavku u nizu
      for (const [key, value] of Object.entries(data)) {
        console.log(`Spremanje postavke: ${key} = ${value}`);
        // Prvo provjeravamo postoji li postavka
        const res = await apiRequest("GET", `/api/settings/${key}`);
        
        if (res.ok) {
          // Ako postoji, ažuriramo - koristimo PUT jer server koristi tu metodu
          results.push(await apiRequest("PUT", `/api/settings/${key}`, { value }));
        } else {
          // Ako ne postoji, kreiramo novu
          results.push(await apiRequest("POST", "/api/settings", { key, value }));
        }
      }
      
      return results;
    },
    onSuccess: () => {
      // Osvježavamo podatke nakon uspješnog spremanja - ovo pokreće novi zahtjev
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
      // Eksplicitno ručno osvježavanje
      setTimeout(() => {
        refetch();
      }, 500);  // Mala odgoda da server ima vremena osvježiti podatke
      
      toast({
        title: "Uspjeh",
        description: "Postavke dostave su uspješno spremljene.",
      });
    },
    onError: (error) => {
      console.error("Greška pri spremanju postavki:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom spremanja postavki.",
        variant: "destructive",
      });
    },
  });

  // Spremanje svih postavki
  const onSubmit = async (data: ShippingFormValues) => {
    try {
      await saveAllSettingsMutation.mutateAsync(data);
      
      // Pričekaj malo i zatim ručno osvježi formu vrijednostima iz baze
      setTimeout(() => {
        // Eksplicitno ručno osvježavanje s poslužitelja
        refetch().then(refreshResult => {
          if (refreshResult.data) {
            console.log("Osvježeni podaci nakon spremanja:", refreshResult.data);
            form.reset({
              freeShippingThreshold: refreshResult.data.freeShippingThreshold || "0",
              standardShippingRate: refreshResult.data.standardShippingRate || "0",
              expressShippingRate: refreshResult.data.expressShippingRate || "0"
            });
          }
        });
      }, 1000); // Veća odgoda za sigurno osvježavanje podataka
    } catch (error) {
      console.error("Greška pri spremanju postavki:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="freeShippingThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prag za besplatnu dostavu (EUR)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="standardShippingRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cijena standardne dostave (EUR)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="expressShippingRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cijena ekspresne dostave (EUR)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" disabled={isLoadingSettings || saveAllSettingsMutation.isPending}>
          {saveAllSettingsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Spremanje...
            </>
          ) : (
            "Spremi postavke"
          )}
        </Button>
      </form>
    </Form>
  );
}