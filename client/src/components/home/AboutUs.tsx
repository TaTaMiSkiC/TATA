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
              src="/uploads/nasa-radionica-nova.jpg" 
              alt="Naša radionica za izradu svijeća" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="heading text-3xl md:text-4xl font-bold text-foreground mb-6">Naša priča</h2>
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
                  <h3 className="heading font-semibold text-lg text-foreground">Udobnost doma</h3>
                  <p className="text-muted-foreground text-sm">Stvorite ugodnu atmosferu u svom prostoru</p>
                </div>
              </div>
            </div>
            
            <Link href="/about">
              <Button size="lg">
                Saznajte više o nama
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
