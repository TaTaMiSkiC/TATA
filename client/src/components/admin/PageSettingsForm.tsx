import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Definicija sheme za validaciju forme
const pageFormSchema = z.object({
  title: z.string().min(1, { message: "Naslov je obavezan" }),
  content: z.string().min(1, { message: "Sadržaj je obavezan" }),
});

type PageFormValues = z.infer<typeof pageFormSchema>;

interface PageSettingsFormProps {
  pageType: string;
  title: string;
  description: string;
}

export default function PageSettingsForm({ pageType, title, description }: PageSettingsFormProps) {
  const { toast } = useToast();
  
  // Dohvaćanje trenutnih postavki
  const { data: pageData, isLoading } = useQuery({
    queryKey: [`/api/pages/${pageType}`],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${pageType}`);
      if (!res.ok) {
        if (res.status === 404) {
          return { title: "", content: "" };
        }
        throw new Error(`Neuspješno dohvaćanje podataka stranice ${pageType}`);
      }
      return await res.json();
    },
  });
  
  // Definicija forme
  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });
  
  // Ažuriranje podataka forme kada se dohvate podaci
  React.useEffect(() => {
    if (pageData) {
      form.reset({
        title: pageData.title || "",
        content: pageData.content || "",
      });
    }
  }, [pageData, form]);
  
  // Mutacija za ažuriranje postavki
  const updateMutation = useMutation({
    mutationFn: async (data: PageFormValues) => {
      const response = await apiRequest(
        "POST",
        `/api/pages/${pageType}`,
        data
      );
      if (!response.ok) {
        throw new Error(`Neuspješno ažuriranje stranice ${pageType}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pages/${pageType}`] });
      toast({
        title: "Uspješno spremljeno",
        description: `Stranica "${title}" je uspješno ažurirana.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: `Neuspješno ažuriranje: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Submit handler
  const onSubmit = (data: PageFormValues) => {
    updateMutation.mutate(data);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4">{description}</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Naslov stranice</FormLabel>
                <FormControl>
                  <Input placeholder="Unesite naslov stranice" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sadržaj stranice</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Unesite sadržaj stranice" 
                    className="min-h-[300px]" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Podržava osnovni HTML format za formatiranje teksta.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Spremi promjene
          </Button>
        </form>
      </Form>
    </div>
  );
}