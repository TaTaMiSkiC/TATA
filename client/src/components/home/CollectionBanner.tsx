import { Link } from "wouter";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CollectionBanner() {
  return (
    <section className="py-16 bg-cover bg-center relative" style={{ backgroundImage: "url('https://pixabay.com/get/g8e2f0ab9fd933a4f95a13e49fdf8085b52ca4a5bedcb5ce350d22dc4ea759bff5b101615776d64d0ace352b4ee82b8d59b79a7333527cda411e43f4a66b85e42_1280.jpg')" }}>
      <div className="absolute inset-0 bg-primary bg-opacity-60"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-lg bg-white bg-opacity-95 p-10 rounded-lg shadow-lg ml-auto">
          <h2 className="heading text-3xl font-bold text-text-dark mb-4">Jesenska kolekcija</h2>
          <p className="text-gray-600 mb-6">
            Otkrijte našu novu kolekciju jesenskih mirisa. Topli i ugodni mirisi koji će vaš dom ispuniti 
            osjećajem udobnosti i topline tijekom hladnijih dana.
          </p>
          <ul className="mb-8">
            <li className="flex items-center mb-2">
              <Check size={16} className="text-primary mr-2" />
              <span>Pumpkin Spice & Vanilla</span>
            </li>
            <li className="flex items-center mb-2">
              <Check size={16} className="text-primary mr-2" />
              <span>Cinnamon Apple</span>
            </li>
            <li className="flex items-center mb-2">
              <Check size={16} className="text-primary mr-2" />
              <span>Warm Amber & Cedar</span>
            </li>
            <li className="flex items-center">
              <Check size={16} className="text-primary mr-2" />
              <span>Vanilla Patchouli</span>
            </li>
          </ul>
          <Button size="lg" asChild>
            <Link href="/products?collection=autumn">
              <a>Pregledaj kolekciju</a>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
