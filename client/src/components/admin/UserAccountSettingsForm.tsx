import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

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

// Shema za validaciju postavki korisničkog računa
const userAccountSettingsSchema = z.object({
  firstName: z.string().min(2, "Ime mora imati barem 2 znaka"),
  lastName: z.string().min(2, "Prezime mora imati barem 2 znaka"),
  email: z.string().email("Unesite ispravnu email adresu"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Lozinka mora imati barem 8 znakova").optional(),
  confirmPassword: z.string().optional(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Lozinke se ne podudaraju",
  path: ["confirmPassword"],
});

type UserAccountSettingsFormValues = z.infer<typeof userAccountSettingsSchema>;

export default function UserAccountSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Inicijalizacija forme
  const form = useForm<UserAccountSettingsFormValues>({
    resolver: zodResolver(userAccountSettingsSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Mutacija za ažuriranje postavki
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UserAccountSettingsFormValues) => {
      const res = await apiRequest("PUT", "/api/users/me", data);
      if (!res.ok) {
        throw new Error("Neuspješno ažuriranje korisničkog računa");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Uspješno ažurirano",
        description: "Korisnički račun je uspješno ažuriran.",
      });
      // Osvježavanje podataka
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Resetiranje polja lozinke
      form.reset({
        ...form.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
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
  function onSubmit(data: UserAccountSettingsFormValues) {
    updateSettingsMutation.mutate(data);
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Korisnički račun</h3>
          <p className="text-sm text-muted-foreground">
            Upravljajte svojim korisničkim računom
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
        <h3 className="text-lg font-medium">Korisnički račun</h3>
        <p className="text-sm text-muted-foreground">
          Upravljajte svojim korisničkim računom
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ime</FormLabel>
                  <FormControl>
                    <Input placeholder="Vaše ime" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prezime</FormLabel>
                  <FormControl>
                    <Input placeholder="Vaše prezime" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email adresa</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="vasa.adresa@primjer.hr" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-3 pt-2">
            <h4 className="font-medium">Promjena lozinke</h4>
            
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potvrda nove lozinke</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Potvrdite novu lozinku" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={updateSettingsMutation.isPending}
            className="w-full mt-6"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Spremi promjene
          </Button>
        </form>
      </Form>
    </div>
  );
}