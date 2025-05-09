import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product, Scent, Color } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Minus, Plus, ShoppingBag } from "lucide-react";

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function ProductViewModal({ isOpen, onClose, product }: ProductViewModalProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedScentId, setSelectedScentId] = useState<number | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [isValid, setIsValid] = useState(false);
  
  // Fetch product scents if available
  const { data: productScents = [] } = useQuery<Scent[]>({
    queryKey: [`/api/products/${product.id}/scents`],
    enabled: isOpen && product.id !== undefined,
  });
  
  // Fetch product colors if product has color options
  const { data: productColors = [] } = useQuery<Color[]>({
    queryKey: [`/api/products/${product.id}/colors`],
    enabled: isOpen && product.hasColorOptions && product.id !== undefined,
  });
  
  // Reset selections when product changes
  useEffect(() => {
    if (isOpen) {
      setSelectedScentId(null);
      setSelectedColorId(null);
      setQuantity(1);
    }
  }, [isOpen, product.id]);
  
  // Validate selections
  useEffect(() => {
    let valid = true;
    
    // Validate scent selection
    if (productScents && productScents.length > 0 && selectedScentId === null) {
      valid = false;
    }
    
    // Validate color selection
    if (product.hasColorOptions && productColors && productColors.length > 0 && selectedColorId === null) {
      valid = false;
    }
    
    setIsValid(valid);
  }, [selectedScentId, selectedColorId, productScents, productColors, product.hasColorOptions]);
  
  // Increment/decrement quantity
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };
  
  // Add to cart
  const handleAddToCart = () => {
    if (!isValid) return;
    
    addToCart.mutate(
      {
        productId: product.id,
        quantity,
        scentId: selectedScentId || undefined,
        colorId: selectedColorId || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Dodano u košaricu",
            description: `${product.name} (${quantity}x) je dodan u vašu košaricu.`,
          });
          onClose();
        },
      }
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="heading text-xl">Odaberite opcije</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row items-start gap-4 py-4">
          {/* Product image */}
          <div className="w-full md:w-1/3">
            <img 
              src={product.imageUrl || ''} 
              alt={product.name} 
              className="w-full rounded-md object-cover aspect-square"
            />
          </div>
          
          {/* Product details */}
          <div className="w-full md:w-2/3">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-xl font-bold text-primary mt-1 mb-4">{parseFloat(product.price).toFixed(2)} €</p>
            
            {/* Scent options */}
            {productScents && productScents.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Odaberite miris:</h4>
                <RadioGroup 
                  value={selectedScentId?.toString()} 
                  onValueChange={(value) => setSelectedScentId(parseInt(value))}
                  className="flex flex-wrap gap-2"
                >
                  {productScents.map((scent) => (
                    <div key={scent.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={scent.id.toString()} id={`modal-scent-${scent.id}`} />
                      <Label 
                        htmlFor={`modal-scent-${scent.id}`}
                        className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors
                          ${selectedScentId === scent.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                      >
                        {scent.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {productScents.length > 0 && selectedScentId === null && (
                  <p className="text-xs text-destructive mt-1">Obavezan odabir mirisa</p>
                )}
              </div>
            )}
            
            {/* Color options */}
            {product.hasColorOptions && productColors && productColors.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Odaberite boju:</h4>
                <RadioGroup 
                  value={selectedColorId?.toString()} 
                  onValueChange={(value) => setSelectedColorId(parseInt(value))}
                  className="flex flex-wrap gap-3"
                >
                  {productColors.map((color) => (
                    <div key={color.id} className="flex flex-col items-center">
                      <RadioGroupItem 
                        value={color.id.toString()} 
                        id={`modal-color-${color.id}`} 
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`modal-color-${color.id}`}
                        className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all
                          ${selectedColorId === color.id ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80'}`}
                      >
                        <div 
                          className="w-6 h-6 rounded-full" 
                          style={{ backgroundColor: color.hexValue }}
                          title={color.name}
                        />
                      </Label>
                      <span className="text-xs mt-1">{color.name}</span>
                    </div>
                  ))}
                </RadioGroup>
                {productColors.length > 0 && selectedColorId === null && (
                  <p className="text-xs text-destructive mt-1">Obavezan odabir boje</p>
                )}
              </div>
            )}
            
            {/* Quantity selector */}
            <div className="flex items-center mt-6">
              <span className="text-sm font-medium mr-3">Količina:</span>
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 rounded-none"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1 || addToCart.isPending}
                >
                  <Minus size={14} />
                </Button>
                
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  className="w-12 text-center border-none focus:ring-0 text-sm h-8 px-0"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= product.stock) {
                      setQuantity(val);
                    }
                  }}
                  disabled={addToCart.isPending}
                />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 rounded-none"
                  onClick={incrementQuantity}
                  disabled={quantity >= product.stock || addToCart.isPending}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={addToCart.isPending}
          >
            Odustani
          </Button>
          <Button 
            onClick={handleAddToCart}
            disabled={!isValid || product.stock === 0 || addToCart.isPending}
            className="ml-2"
          >
            <ShoppingBag size={16} className="mr-2" />
            {addToCart.isPending ? "Dodavanje..." : "Dodaj u košaricu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}