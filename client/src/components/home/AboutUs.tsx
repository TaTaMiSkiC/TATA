import { Link } from "wouter";
import { Leaf, HeartHandshake, Recycle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutUs() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="https://pixabay.com/get/gb6ff819283a0fa5a8c17a1fd83109826723610c5ca8d9e71643c59dac6ad6ee004b06c6a2a91a48f6a32816c25a01ba45bb58f8b3654c818e9212bff1828e812_1280.jpg" 
              alt="Naša radionica za izradu svijeća" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="heading text-3xl md:text-4xl font-bold text-foreground mb-6">Naša priča</h2>
            <p className="text-muted-foreground mb-4">
              Kerzenwelt by Dani je obiteljski obrt s dugom tradicijom izrade ručno rađenih svijeća. 
              Već više od 15 godina stvaramo mirisne i dekorativne svijeće koristeći samo najbolje 
              sastojke i održive materijale.
            </p>
            <p className="text-muted-foreground mb-6">
              Svaka naša svijeća je izrađena s pažnjom i ljubavlju, pazeći na svaki detalj - od odabira 
              najboljih mirisa do dovršavanja estetskog izgleda. Ponosni smo na naš obrt i strast 
              kojom pristupamo svakom proizvodu.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-accent p-3 rounded-full">
                  <Leaf className="text-primary" size={20} />
                </div>
                <div className="ml-4">
                  <h3 className="heading font-semibold text-lg text-foreground">Prirodni sastojci</h3>
                  <p className="text-muted-foreground text-sm">Koristimo samo prirodni sojin vosak i esencijalna ulja</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-accent p-3 rounded-full">
                  <HeartHandshake className="text-primary" size={20} />
                </div>
                <div className="ml-4">
                  <h3 className="heading font-semibold text-lg text-foreground">Ručna izrada</h3>
                  <p className="text-muted-foreground text-sm">Svaka svijeća je pažljivo i ručno izrađena</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-accent p-3 rounded-full">
                  <Recycle className="text-primary" size={20} />
                </div>
                <div className="ml-4">
                  <h3 className="heading font-semibold text-lg text-foreground">Održivost</h3>
                  <p className="text-muted-foreground text-sm">Ekološki prihvatljiva ambalaža i materijali</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-accent p-3 rounded-full">
                  <Home className="text-primary" size={20} />
                </div>
                <div className="ml-4">
                  <h3 className="heading font-semibold text-lg text-foreground">Domaći proizvod</h3>
                  <p className="text-muted-foreground text-sm">Proizvedeno u Hrvatskoj s lokalnim resursima</p>
                </div>
              </div>
            </div>
            
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/about'}
            >
              Saznajte više o nama
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
