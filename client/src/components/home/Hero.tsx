import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative h-[70vh] md:h-[80vh] bg-cover bg-center" style={{ backgroundImage: "url('https://pixabay.com/get/g35029c0d925acc49caf49cc5117b37266e5818fb0578ae6fdb62ff956417c075d7d3b45fc71fc49297c9046a8444ae278cc66aea4147bc685f6da3ca38454148_1280.jpg')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <div className="container mx-auto px-4 h-full flex items-center relative z-10">
        <div className="max-w-xl">
          <h1 className="heading text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Ručno izrađene svijeće za posebne trenutke
          </h1>
          <p className="text-white text-lg md:text-xl opacity-90 mb-8">
            Otkrijte našu kolekciju premium mirisnih svijeća izrađenih s ljubavlju
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Button size="lg" asChild>
              <Link href="/products">
                <a className="w-full sm:w-auto">Istraži kolekciju</a>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/about">
                <a className="w-full sm:w-auto">O nama</a>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
