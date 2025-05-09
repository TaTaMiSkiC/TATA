import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Greška",
        description: "Molimo unesite vašu email adresu.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Uspješno",
        description: "Hvala na prijavi! Uskoro ćete primiti naš newsletter.",
      });
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="heading text-3xl md:text-4xl font-bold text-white mb-4">
            Pretplatite se na novosti
          </h2>
          <p className="text-white text-opacity-80 mb-8">
            Budite prvi koji će saznati o našim novim proizvodima, posebnim ponudama i popustima. 
            Pretplatite se na naš newsletter i dobijte 10% popusta na vašu prvu narudžbu.
          </p>
          
          <form 
            className="flex flex-col sm:flex-row gap-3 justify-center" 
            onSubmit={handleSubmit}
          >
            <Input
              type="email"
              placeholder="Vaša email adresa"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-3 px-4 rounded-md flex-grow max-w-md focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
            <Button 
              type="submit" 
              variant="secondary"
              disabled={isSubmitting}
              className="bg-white text-primary hover:bg-secondary hover:text-white font-accent font-medium py-3 px-6 rounded-md transition"
            >
              {isSubmitting ? "Učitavanje..." : "Pretplatite se"}
            </Button>
          </form>
          
          <p className="text-white text-opacity-70 text-sm mt-4">
            Nećemo dijeliti vaše podatke s trećim stranama. Možete se odjaviti u bilo kojem trenutku.
          </p>
        </div>
      </div>
    </section>
  );
}
