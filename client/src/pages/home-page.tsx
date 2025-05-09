import { Helmet } from 'react-helmet';
import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import AboutUs from "@/components/home/AboutUs";
import CollectionBanner from "@/components/home/CollectionBanner";
import Testimonials from "@/components/home/Testimonials";
import InstagramFeed from "@/components/home/InstagramFeed";
import Newsletter from "@/components/home/Newsletter";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import CategoryCard from "@/components/products/CategoryCard";

export default function HomePage() {
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <Layout>
      <Helmet>
        <title>Kerzenwelt by Dani | Ručno izrađene svijeće</title>
        <meta name="description" content="Otkrijte našu kolekciju ručno izrađenih svijeća od prirodnih sastojaka. Premium mirisne i dekorativne svijeće za svaki dom." />
        <meta property="og:title" content="Kerzenwelt by Dani | Ručno izrađene svijeće" />
        <meta property="og:description" content="Otkrijte našu kolekciju ručno izrađenih svijeća od prirodnih sastojaka. Premium mirisne i dekorativne svijeće za svaki dom." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <Hero />
      
      {/* Categories Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading text-3xl md:text-4xl font-bold text-foreground">Naše kategorije</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Istražite našu bogatu ponudu ručno izrađenih svijeća za svaku priliku
            </p>
          </div>
          
          {categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((index) => (
                <div key={index} className="relative rounded-lg overflow-hidden bg-muted h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories?.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      <FeaturedProducts />
      <AboutUs />
      <CollectionBanner />
      <Testimonials />
      <InstagramFeed />
      <Newsletter />
    </Layout>
  );
}
