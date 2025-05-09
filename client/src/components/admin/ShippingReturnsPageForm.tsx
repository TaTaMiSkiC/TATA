import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RichTextEditor from "../RichTextEditor";

// Definiranje Zod sheme za validaciju forme
const formSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  content: z.string().min(10, "Sadržaj mora imati barem 10 znakova"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShippingReturnsPageForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editorLoaded, setEditorLoaded] = useState(false);

  // Učitaj podatke o stranici
  const { data: pageData, isLoading } = useQuery({
    queryKey: ["/api/pages/shipping-returns"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/pages/shipping-returns");
        if (!res.ok) {
          if (res.status === 404) {
            // Ako stranica ne postoji, vrati zadane podatke
            return {
              id: null, 
              title: "Dostava i povrat",
              content: "<h2>Naša politika dostave</h2><p>Dostava se vrši putem dostavnih službi na području cijele Hrvatske.</p><p>Rok dostave je 2-5 radnih dana od potvrde narudžbe.</p><p>Za narudžbe iznad 50€ dostava je besplatna.</p><p>Za narudžbe ispod 50€ trošak dostave iznosi 5€.</p><h2>Politika povrata</h2><p>Kupac ima pravo na povrat robe u roku od 14 dana od primitka.</p><p>Povrat je moguć samo za neoštećenu i nekorištenu robu u originalnom pakiranju.</p><p>Za povrat nas kontaktirajte putem e-maila ili telefona.</p><p>Troškove povrata snosi kupac osim u slučaju kada je razlog povrata greška s naše strane.</p><h2>Reklamacije</h2><p>Ukoliko proizvod ima vidljiva oštećenja, molimo vas da to odmah prijavite.</p><p>Reklamacije se rješavaju u najkraćem mogućem roku, a najkasnije u roku od 15 dana od zaprimanja.</p>",
              type: "shipping-returns"
            };
          }
          throw new Error("Neuspješno dohvaćanje stranice");
        }
        return await res.json();
      } catch (error) {
        console.error("Error fetching page:", error);
        return null;
      }
    },
  });

  // Postavi formu s React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: pageData?.title || "Dostava i povrat",
      content: pageData?.content || "",
    },
    values: {
      title: pageData?.title || "Dostava i povrat",
      content: pageData?.content || "",
    },
  });

  // Ažuriraj formu kada se učitaju podaci
  useEffect(() => {
    if (pageData) {
      form.reset({
        title: pageData.title,
        content: pageData.content,
      });
    }
  }, [pageData, form]);

  // Učitaj WYSIWYG editor
  useEffect(() => {
    setEditorLoaded(true);
  }, []);

  // Mutacija za ažuriranje ili stvaranje stranice
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormValues) => {
      // Ako stranica ima ID, ažuriraj je, inače stvori novu
      if (pageData?.id) {
        const res = await apiRequest(
          "PATCH",
          `/api/pages/${pageData.id}`,
          {
            ...data,
            type: "shipping-returns",
          }
        );
        return await res.json();
      } else {
        const res = await apiRequest(
          "POST",
          "/api/pages",
          {
            ...data,
            type: "shipping-returns",
          }
        );
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages/shipping-returns"] });
      toast({
        title: "Uspjeh!",
        description: "Stranica za dostavu i povrat je uspješno ažurirana.",
      });
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom ažuriranja stranice. Pokušajte ponovno.",
        variant: "destructive",
      });
      console.error("Mutation error:", error);
    },
  });

  // Funkcija za slanje forme
  function onSubmit(data: FormValues) {
    mutate(data);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Uredi stranicu Dostava i povrat</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Naslov</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Naslov stranice" />
                </FormControl>
                <FormDescription>
                  Ovo je naslov koji će se prikazati na vrhu stranice.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sadržaj</FormLabel>
                <FormControl>
                  {editorLoaded ? (
                    <RichTextEditor 
                      value={field.value} 
                      onChange={field.onChange}
                      editorId="shipping-returns-editor"
                    />
                  ) : (
                    <div className="h-64 w-full flex items-center justify-center bg-muted rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </FormControl>
                <FormDescription>
                  Unesite sadržaj stranice za dostavu i povrat. Možete koristiti oblikovanje teksta.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isPending}
            className="flex items-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Spremi promjene
          </Button>
        </form>
      </Form>
    </div>
  );
}