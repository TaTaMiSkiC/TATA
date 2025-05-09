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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

// Shema za validaciju postavki izgleda
const appearanceSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["hr", "en", "de"]),
});

type AppearanceSettingsFormValues = z.infer<typeof appearanceSettingsSchema>;

export default function AppearanceSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dohvaćanje trenutnih postavki
  const { data: appearanceSettings, isLoading } = useQuery({
    queryKey: ["/api/settings/appearance"],
    queryFn: async () => {
      // Ovo je privremeno, kasnije ćemo dodati pravu API rutu
      return {
        theme: "light",
        language: "hr"
      };
    },
  });

  // Inicijalizacija forme
  const form = useForm<AppearanceSettingsFormValues>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      theme: "light",
      language: "hr",
    },
    values: appearanceSettings,
  });

  // Mutacija za ažuriranje postavki
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: AppearanceSettingsFormValues) => {
      // Ovo je privremeno, kasnije ćemo dodati pravu API rutu
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Uspješno ažurirano",
        description: "Postavke izgleda su uspješno ažurirane.",
      });
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
  function onSubmit(data: AppearanceSettingsFormValues) {
    updateSettingsMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Izgled i jezik</h3>
          <p className="text-sm text-muted-foreground">
            Prilagodite izgled i jezik aplikacije
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
        <h3 className="text-lg font-medium">Izgled i jezik</h3>
        <p className="text-sm text-muted-foreground">
          Prilagodite izgled i jezik aplikacije
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tema</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite temu" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="light">Svijetla</SelectItem>
                    <SelectItem value="dark">Tamna</SelectItem>
                    <SelectItem value="system">Sustavna</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Ova postavka će utjecati na izgled cijele aplikacije
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jezik</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite jezik" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hr">Hrvatski</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Odaberite jezik korisničkog sučelja
                </FormDescription>
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