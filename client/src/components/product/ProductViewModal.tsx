import { useState, useEffect } from "react";
import { X, ShoppingBag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Product, Scent, Color } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useQuery } from "@tanstack/react-query";
import Image from "@/components/ui/image";

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function ProductViewModal({ isOpen, onClose, product }: ProductViewModalProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [selectedScentId, setSelectedScentId] = useState<number | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch product scents
  const { data: productScents = [] } = useQuery<Scent[]>({
    queryKey: ['/api/products', product.id, 'scents'],
    enabled: isOpen
  });

  // Fetch product colors
  const { data: productColors = [] } = useQuery<Color[]>({
    queryKey: ['/api/products', product.id, 'colors'],
    enabled: isOpen && product.hasColorOptions
  });

  // Reset selections when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedScentId(null);
      setSelectedColorId(null);
      setQuantity(1);
      setAddedToCart(false);
    }
  }, [isOpen]);

  const isColorSelectionRequired = product.hasColorOptions && productColors && productColors.length > 0;
  const isScentSelectionRequired = productScents && productScents.length > 0;

  // Check if all required options are selected
  const canAddToCart = 
    (!isScentSelectionRequired || selectedScentId !== null) && 
    (!isColorSelectionRequired || selectedColorId !== null);

  const handleAddToCart = async () => {
    if (!canAddToCart) return;
    
    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: quantity,
        scentId: selectedScentId,
        colorId: selectedColorId
      });
      
      setAddedToCart(true);
      
      toast({
        title: "Proizvod dodan u košaricu",
        description: `${product.name} je uspješno dodan u vašu košaricu.`,
      });
      
      // Close the modal after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      toast({
        title: "Greška",
        description: "Dodavanje u košaricu nije uspjelo. Molimo pokušajte ponovno.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Odaberite opcije</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product image */}
          <div className="bg-card rounded-lg overflow-hidden">
            <Image 
              src={product.imageUrl || '/placeholder.png'} 
              alt={product.name}
              className="w-full h-[250px] object-cover"
            />
          </div>
          
          {/* Product info and options */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-primary text-xl font-bold">{new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(parseFloat(product.price))}</p>
            </div>
            
            {/* Scent options */}
            {isScentSelectionRequired && (
              <div>
                <h4 className="text-sm font-medium mb-2">Miris <span className="text-destructive">*</span></h4>
                <RadioGroup 
                  value={selectedScentId?.toString()} 
                  onValueChange={(value) => setSelectedScentId(parseInt(value))}
                  className="grid grid-cols-1 gap-2"
                >
                  {productScents.map((scent) => (
                    <div key={scent.id} className="flex items-center space-x-2 border border-input rounded-md p-2 transition-colors hover:bg-muted/50">
                      <RadioGroupItem value={scent.id.toString()} id={`modal-scent-${scent.id}`} />
                      <Label
                        htmlFor={`modal-scent-${scent.id}`}
                        className="cursor-pointer text-sm"
                      >
                        {scent.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            
            {/* Color options */}
            {isColorSelectionRequired && (
              <div>
                <h4 className="text-sm font-medium mb-2">Boja <span className="text-destructive">*</span></h4>
                <RadioGroup 
                  value={selectedColorId?.toString()} 
                  onValueChange={(value) => setSelectedColorId(parseInt(value))}
                  className="grid grid-cols-2 gap-2"
                >
                  {productColors.map((color) => (
                    <div key={color.id} className="flex items-center space-x-2 border border-input rounded-md p-2 transition-colors hover:bg-muted/50">
                      <div 
                        className={`w-6 h-6 rounded-full border ${selectedColorId === color.id ? 'border-primary ring-2 ring-primary/50' : 'border-input'}`}
                        style={{ backgroundColor: color.hexValue }}
                      ></div>
                      <RadioGroupItem 
                        value={color.id.toString()} 
                        id={`modal-color-${color.id}`} 
                      />
                      <Label
                        htmlFor={`modal-color-${color.id}`}
                        className="cursor-pointer text-sm"
                      >
                        {color.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            
            {/* Quantity */}
            <div>
              <h4 className="text-sm font-medium mb-2">Količina</h4>
              <div className="flex items-center border border-input rounded-md w-[120px]">
                <button 
                  type="button" 
                  className="px-3 py-2 bg-muted hover:bg-muted/80 transition"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <span className="sr-only">Smanji</span>
                  <span>-</span>
                </button>
                <input 
                  type="number" 
                  className="w-12 text-center border-x border-input focus:ring-0 bg-transparent"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0 && val <= product.stock) {
                      setQuantity(val);
                    }
                  }}
                  min={1}
                  max={product.stock}
                />
                <button 
                  type="button" 
                  className="px-3 py-2 bg-muted hover:bg-muted/80 transition"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <span className="sr-only">Povećaj</span>
                  <span>+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-start">
          {addedToCart ? (
            <Button className="w-full" variant="default" disabled>
              <CheckCircle size={18} className="mr-2" />
              Dodano u košaricu
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleAddToCart} 
              disabled={!canAddToCart || addToCart.isPending}
            >
              <ShoppingBag size={18} className="mr-2" />
              {addToCart.isPending ? "Dodavanje..." : "Dodaj u košaricu"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}