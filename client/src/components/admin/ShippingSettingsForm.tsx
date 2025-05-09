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
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
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

  // Akcija za spremanje postavki
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingData: { key: string; value: string }) => {
      // Prvo provjeravamo postoji li postavka
      const res = await apiRequest("GET", `/api/settings/${settingData.key}`);
      
      if (res.ok) {
        // Ako postoji, ažuriramo
        return apiRequest("PATCH", `/api/settings/${settingData.key}`, { value: settingData.value });
      } else {
        // Ako ne postoji, kreiramo novu
        return apiRequest("POST", "/api/settings", settingData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
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
      // Spremamo svaku postavku posebno
      await saveSettingsMutation.mutateAsync({ key: "freeShippingThreshold", value: data.freeShippingThreshold });
      await saveSettingsMutation.mutateAsync({ key: "standardShippingRate", value: data.standardShippingRate });
      await saveSettingsMutation.mutateAsync({ key: "expressShippingRate", value: data.expressShippingRate });
      
      toast({
        title: "Uspjeh",
        description: "Postavke dostave su uspješno spremljene.",
      });
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
        
        <Button type="submit" disabled={isLoadingSettings || saveSettingsMutation.isPending}>
          {saveSettingsMutation.isPending ? (
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