import { useSettings } from "@/hooks/use-settings-api";
import { Loader2 } from "lucide-react";

interface ShippingCostCalculatorProps {
  subtotal: number;
}

export function ShippingCostCalculator({ subtotal }: ShippingCostCalculatorProps) {
  const { getSetting } = useSettings();
  
  // Dohvati postavke troškova dostave
  const { data: freeShippingThresholdSetting, isLoading: isLoadingFreeShippingThreshold } = 
    getSetting("freeShippingThreshold");
  const { data: standardShippingRateSetting, isLoading: isLoadingStandardShippingRate } = 
    getSetting("standardShippingRate");
  
  const isLoading = isLoadingFreeShippingThreshold || isLoadingStandardShippingRate;
  
  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Izračunavanje troškova dostave...
      </div>
    );
  }
  
  // Izračunaj troškove dostave na temelju postavki
  const freeShippingThreshold = parseFloat(freeShippingThresholdSetting?.value || "50");
  const standardShippingRate = parseFloat(standardShippingRateSetting?.value || "5");
  
  // Ako je standardShippingRate postavljen na 0, dostava je uvijek besplatna
  if (standardShippingRate === 0) {
    return (
      <div className="flex justify-between py-2">
        <span className="text-muted-foreground">Dostava:</span>
        <span className="font-medium text-green-600 dark:text-green-500">Besplatno</span>
      </div>
    );
  }
  
  const isFreeShipping = subtotal >= freeShippingThreshold && freeShippingThreshold > 0;
  const shippingCost = isFreeShipping ? 0 : standardShippingRate;
  
  return (
    <div className="flex justify-between py-2">
      <span className="text-muted-foreground">Dostava:</span>
      <span>
        {isFreeShipping ? (
          <span className="font-medium text-green-600 dark:text-green-500">Besplatno</span>
        ) : (
          <span>{shippingCost.toFixed(2)} €</span>
        )}
      </span>
    </div>
  );
}

// Komponenta za prikaz informacije o potrebnom iznosu za besplatnu dostavu
export function FreeShippingProgress({ subtotal }: ShippingCostCalculatorProps) {
  const { getSetting } = useSettings();
  
  // Dohvati postavke za besplatnu dostavu
  const { data: freeShippingThresholdSetting, isLoading: isLoadingFreeThreshold } = getSetting("freeShippingThreshold");
  const { data: standardShippingRateSetting, isLoading: isLoadingShippingRate } = getSetting("standardShippingRate");
  
  const isLoading = isLoadingFreeThreshold || isLoadingShippingRate;
  
  if (isLoading) {
    return null;
  }
  
  const freeShippingThreshold = parseFloat(freeShippingThresholdSetting?.value || "50");
  const standardShippingRate = parseFloat(standardShippingRateSetting?.value || "5");
  
  // Ako je standardShippingRate 0, dostava je uvijek besplatna, pa ne prikazujemo informaciju
  // Također, ako je prag za besplatnu dostavu 0 ili je već dosegnut prag, ne prikazujemo komponentu
  if (standardShippingRate === 0 || freeShippingThreshold <= 0 || subtotal >= freeShippingThreshold) {
    return null;
  }
  
  const remaining = freeShippingThreshold - subtotal;
  const progressPercentage = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  
  return (
    <div className="mt-2 p-3 bg-muted/40 rounded-md">
      <p className="text-sm mb-2">
        Dodajte još <span className="font-medium">{remaining.toFixed(2)} €</span> u košaricu za besplatnu dostavu!
      </p>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}