import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Helmet } from 'react-helmet';
import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/products/ProductGrid";
import { Category, Product } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function ProductsPage() {
  const [, params] = useRoute("/products/:category");
  const [location] = useLocation();
  
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const categoryParam = urlParams.get("category");
  
  const [filters, setFilters] = useState({
    category: categoryParam || "all",
    search: "",
    priceRange: [0, 100],
    sortBy: "newest",
  });
  
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Fetch all products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Fetch all categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Filter products based on filters
  const filteredProducts = products?.filter((product) => {
    // Filter by category
    if (filters.category !== "all" && product.categoryId !== parseInt(filters.category)) {
      return false;
    }
    
    // Filter by search term
    if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Filter by price range
    const price = parseFloat(product.price);
    if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
      return false;
    }
    
    return true;
  }) || [];
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sortBy === "price-asc") {
      return parseFloat(a.price) - parseFloat(b.price);
    } else if (filters.sortBy === "price-desc") {
      return parseFloat(b.price) - parseFloat(a.price);
    } else if (filters.sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else {
      // Default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: "all",
      search: "",
      priceRange: [0, 100],
      sortBy: "newest",
    });
  };
  
  // Find the max price for slider
  const maxPrice = products ? Math.max(...products.map((p) => parseFloat(p.price))) : 100;
  
  useEffect(() => {
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }
  }, [categoryParam]);
  
  // Get category name for title
  const getCategoryName = () => {
    if (filters.category === "all" || !categories) return "Svi proizvodi";
    const category = categories.find(cat => cat.id === parseInt(filters.category));
    return category ? category.name : "Proizvodi";
  };

  return (
    <Layout>
      <Helmet>
        <title>{getCategoryName()} | Kerzenwelt by Dani</title>
        <meta name="description" content="Otkrijte našu kolekciju ručno izrađenih svijeća - mirisne, dekorativne i personalizirane svijeće za svaki dom i prigodu." />
      </Helmet>
      
      <div className="bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="heading text-3xl font-bold text-text-dark">{getCategoryName()}</h1>
              <p className="text-gray-600 mt-1">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'proizvod' : 
                 sortedProducts.length % 10 >= 2 && sortedProducts.length % 10 <= 4 ? 'proizvoda' : 'proizvoda'}
              </p>
            </div>
            
            <div className="flex mt-4 md:mt-0 space-x-2">
              <Button 
                variant="outline" 
                className="md:hidden"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              >
                <SlidersHorizontal size={18} className="mr-2" />
                Filteri
              </Button>
              
              <Select 
                value={filters.sortBy}
                onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sortiraj po" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Najnovije</SelectItem>
                  <SelectItem value="price-asc">Cijena (najniža prvo)</SelectItem>
                  <SelectItem value="price-desc">Cijena (najviša prvo)</SelectItem>
                  <SelectItem value="name">Ime (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters sidebar - Desktop */}
            <div className="hidden md:block w-64 shrink-0">
              <div className="bg-accent bg-opacity-20 rounded-lg p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-heading font-semibold text-lg">Filteri</h2>
                  {(filters.category !== "all" || filters.search || filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X size={16} className="mr-1" /> Očisti
                    </Button>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <h3 className="font-medium mb-2">Pretraga</h3>
                    <div className="relative">
                      <Search size={18} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Traži proizvode..."
                        className="pl-9"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  {/* Categories */}
                  <div>
                    <h3 className="font-medium mb-2">Kategorije</h3>
                    <Select 
                      value={filters.category}
                      onValueChange={(value) => setFilters({ ...filters, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberi kategoriju" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Sve kategorije</SelectItem>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Price range */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Cijena</h3>
                      <span className="text-sm text-gray-500">
                        {filters.priceRange[0]}€ - {filters.priceRange[1]}€
                      </span>
                    </div>
                    <Slider
                      defaultValue={[0, maxPrice]}
                      min={0}
                      max={maxPrice}
                      step={1}
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
                      className="my-4"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>0€</span>
                      <span>{maxPrice}€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Filters */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden">
                <div className="absolute inset-y-0 right-0 w-[300px] bg-white h-full overflow-y-auto">
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-heading font-semibold text-lg">Filteri</h2>
                      <Button variant="ghost" size="sm" onClick={() => setMobileFiltersOpen(false)}>
                        <X size={18} />
                      </Button>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-6">
                      {/* Search */}
                      <div>
                        <h3 className="font-medium mb-2">Pretraga</h3>
                        <div className="relative">
                          <Search size={18} className="absolute left-2.5 top-2.5 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Traži proizvode..."
                            className="pl-9"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      {/* Categories */}
                      <div>
                        <h3 className="font-medium mb-2">Kategorije</h3>
                        <Select 
                          value={filters.category}
                          onValueChange={(value) => setFilters({ ...filters, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Odaberi kategoriju" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Sve kategorije</SelectItem>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Price range */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium">Cijena</h3>
                          <span className="text-sm text-gray-500">
                            {filters.priceRange[0]}€ - {filters.priceRange[1]}€
                          </span>
                        </div>
                        <Slider
                          defaultValue={[0, maxPrice]}
                          min={0}
                          max={maxPrice}
                          step={1}
                          value={filters.priceRange}
                          onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
                          className="my-4"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>0€</span>
                          <span>{maxPrice}€</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 space-y-3">
                      <Button 
                        onClick={() => {
                          clearFilters();
                          setMobileFiltersOpen(false);
                        }}
                        variant="outline" 
                        className="w-full"
                      >
                        <X size={16} className="mr-2" />
                        Očisti filtere
                      </Button>
                      <Button 
                        onClick={() => setMobileFiltersOpen(false)}
                        className="w-full"
                      >
                        Primijeni filtere
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Products grid */}
            <div className="flex-1">
              {productsLoading ? (
                <ProductGrid products={[]} isLoading={true} />
              ) : sortedProducts.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <h3 className="heading text-xl font-semibold mb-2">Nema pronađenih proizvoda</h3>
                  <p className="text-gray-500 mb-4">Pokušajte s drugačijim filterima ili pogledajte našu cjelokupnu ponudu.</p>
                  <Button onClick={clearFilters}>Prikaži sve proizvode</Button>
                </div>
              ) : (
                <ProductGrid products={sortedProducts} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
