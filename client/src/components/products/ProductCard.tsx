import { useState } from "react";
import { Link } from "wouter";
import { ShoppingBag, Eye, Heart, Star, StarHalf } from "lucide-react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  
  const { id, name, price, imageUrl, categoryId } = product;
  
  // Mock data for ratings
  const rating = 4.5;
  const reviewCount = 42;
  
  const handleAddToCart = () => {
    addToCart.mutate(
      { productId: id, quantity: 1 },
      {
        onSuccess: () => {
          toast({
            title: "Dodano u košaricu",
            description: `${name} je dodan u vašu košaricu.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Greška",
            description: "Proizvod nije moguće dodati u košaricu.",
            variant: "destructive",
          });
        },
      }
    );
  };
  
  return (
    <Card className="product-card overflow-hidden bg-white shadow-md">
      <div 
        className="aspect-square overflow-hidden relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/products/${id}`}>
          <img 
            src={imageUrl} 
            alt={name} 
            className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}
          />
        </Link>
        
        {/* New or Sale tags */}
        {product.stock < 5 && (
          <div className="absolute top-3 left-3">
            <span className="bg-error text-white text-xs font-bold py-1 px-2 rounded">
              ZADNJI KOMADI
            </span>
          </div>
        )}
        
        {/* Quick action buttons */}
        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center gap-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button 
            size="icon"
            variant="secondary"
            className="bg-white text-primary hover:bg-primary hover:text-white rounded-full"
            asChild
          >
            <Link href={`/products/${id}`}>
              <Eye size={18} />
            </Link>
          </Button>
          
          <Button 
            size="icon"
            variant="secondary"
            className="bg-white text-primary hover:bg-primary hover:text-white rounded-full"
            onClick={handleAddToCart}
          >
            <ShoppingBag size={18} />
          </Button>
          
          <Button 
            size="icon"
            variant="secondary"
            className="bg-white text-primary hover:bg-primary hover:text-white rounded-full"
          >
            <Heart size={18} />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <Link href={`/products/${id}`}>
          <h3 className="heading text-lg font-semibold mb-1 hover:text-primary transition-colors cursor-pointer">
            {name}
          </h3>
        </Link>
        
        <div className="text-sm text-gray-600 mb-2">
          {categoryId === 1 ? "Mirisna svijeća" : 
           categoryId === 2 ? "Dekorativna svijeća" : 
           categoryId === 3 ? "Personalizirana svijeća" : "Svijeća"}
        </div>
        
        <div className="flex items-center mb-3">
          <div className="flex text-warning">
            <Star className="fill-current" size={14} />
            <Star className="fill-current" size={14} />
            <Star className="fill-current" size={14} />
            <Star className="fill-current" size={14} />
            {rating === 4.5 ? (
              <StarHalf className="fill-current" size={14} />
            ) : (
              <Star className={rating >= 5 ? "fill-current" : ""} size={14} />
            )}
          </div>
          <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-accent font-medium text-primary">{parseFloat(price).toFixed(2)} €</span>
          <Button 
            size="sm" 
            onClick={handleAddToCart}
            className="text-sm bg-primary hover:bg-opacity-90 text-white py-1 px-3 rounded transition"
          >
            Dodaj u košaricu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
