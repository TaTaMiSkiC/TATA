import React, { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings-api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

const formSchema = z.object({
  shippingCost: z.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: "Unesite ispravnu cijenu (npr. 5.99)",
  }),
  freeShippingThreshold: z.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: "Unesite ispravnu cijenu (npr. 50)",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShippingSettingsForm() {
  const { updateSetting, getSetting } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  
  // Dohvaćanje postavki
  const { data: shippingCostSetting, isLoading: isLoadingShippingCost } = getSetting("shippingCost");
  const { data: freeShippingThresholdSetting, isLoading: isLoadingFreeShippingThreshold } = getSetting("freeShippingThreshold");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shippingCost: "0",
      freeShippingThreshold: "0",
    },
  });
  
  // Postavlja vrijednosti forme kada se podaci učitaju
  useEffect(() => {
    if (!isLoadingShippingCost && !isLoadingFreeShippingThreshold) {
      setIsLoading(false);
      
      form.reset({
        shippingCost: shippingCostSetting?.value || "4.99",
        freeShippingThreshold: freeShippingThresholdSetting?.value || "50",
      });
    }
  }, [
    isLoadingShippingCost, 
    isLoadingFreeShippingThreshold, 
    shippingCostSetting, 
    freeShippingThresholdSetting,
    form
  ]);
  
  const onSubmit = async (data: FormValues) => {
    // Ažuriranje postavki
    await updateSetting.mutateAsync({
      key: "shippingCost",
      value: data.shippingCost,
    });
    
    await updateSetting.mutateAsync({
      key: "freeShippingThreshold",
      value: data.freeShippingThreshold,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Postavke dostave</CardTitle>
        <CardDescription>
          Upravljajte troškovima dostave i pragom za besplatnu dostavu
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="shippingCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cijena dostave (€)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" />
                    </FormControl>
                    <FormDescription>
                      Standardna cijena dostave koja će se naplaćivati kupcima
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="freeShippingThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prag za besplatnu dostavu (€)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" />
                    </FormControl>
                    <FormDescription>
                      Iznos narudžbe iznad kojeg je dostava besplatna (0 za isključivanje)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={updateSetting.isPending}
                  className="w-full md:w-auto"
                >
                  {updateSetting.isPending ? (
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
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}