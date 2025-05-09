import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Product } from "@shared/schema";
import ProductGrid from "../products/ProductGrid";

export default function FeaturedProducts() {
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="heading text-3xl md:text-4xl font-bold text-foreground">Istaknuti proizvodi</h2>
            <p className="mt-3 text-muted-foreground">Naši najpopularniji proizvodi koje naši kupci vole</p>
          </div>
          <Link href="/products">
            <div className="hidden md:inline-flex items-center font-accent text-primary hover:text-opacity-80 transition cursor-pointer">
              Vidi sve proizvode
              <ArrowRight className="ml-2" size={16} />
            </div>
          </Link>
        </div>
        
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Došlo je do greške prilikom učitavanja proizvoda.</p>
          </div>
        ) : (
          <ProductGrid 
            products={products || []} 
            isLoading={isLoading} 
          />
        )}
        
        <div className="mt-8 text-center md:hidden">
          <div
            className="inline-flex items-center font-accent text-primary hover:text-opacity-80 transition cursor-pointer"
            onClick={() => window.location.href = '/products'}
          >
            Vidi sve proizvode
            <ArrowRight className="ml-2" size={16} />
          </div>
        </div>
      </div>
    </section>
  );
}
