import { Star, StarHalf, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

type ReviewWithUser = {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  product: {
    id: number;
    name: string;
  };
};

export default function Testimonials() {
  const { user } = useAuth();
  
  // Dohvati sve recenzije
  const { data: reviews, isLoading } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/reviews"],
  });
  
  // Filtriraj recenzije s tekstom i ograniči na 6 najnovijih
  const recentReviews = reviews?.filter(review => review.comment && review.comment.length > 10)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // Stvaranje inicijala iz imena korisnika
  const getInitials = (review: ReviewWithUser) => {
    if (review.user.firstName && review.user.lastName) {
      return `${review.user.firstName[0]}${review.user.lastName[0]}`;
    } else {
      return review.user.username.slice(0, 2).toUpperCase();
    }
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="heading text-3xl md:text-4xl font-bold text-foreground">Što kažu naši kupci</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Iskustva naših zadovoljnih kupaca</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recentReviews && recentReviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentReviews.map((review) => (
                <div key={review.id} className="bg-card p-6 rounded-lg shadow-md">
                  <div className="flex text-warning mb-4">
                    {Array.from({ length: 5 }).map((_, i) => {
                      if (i < Math.floor(review.rating)) {
                        return <Star key={i} className="fill-warning text-warning" size={18} />;
                      } else if (i === Math.floor(review.rating) && review.rating % 1 > 0) {
                        return <StarHalf key={i} className="fill-warning text-warning" size={18} />;
                      } else {
                        return <Star key={i} className="text-warning" size={18} />;
                      }
                    })}
                  </div>
                  <p className="text-muted-foreground italic mb-2">{review.comment}</p>
                  <p className="text-xs text-primary mb-6">
                    <Link href={`/products/${review.productId}`}>
                      {review.product.name}
                    </Link>
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
                      {getInitials(review)}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-foreground">{review.user.firstName && review.user.lastName 
                        ? `${review.user.firstName} ${review.user.lastName}` 
                        : review.user.username}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('hr-HR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild variant="outline">
                <Link href="/products">Pregledaj proizvode i dodaj recenziju</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="bg-card p-8 rounded-lg shadow-md text-center">
            <p className="text-muted-foreground mb-6">Trenutno nemamo recenzija. Budite prvi koji će ostaviti svoje iskustvo!</p>
            
            {user ? (
              <Button asChild>
                <Link href="/products">Pregledaj proizvode i dodaj recenziju</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/auth">Prijavi se i dodaj recenziju</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
