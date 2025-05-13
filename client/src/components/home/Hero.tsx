import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import candleBackground from "@/assets/candle-background.jpg";
import { useLanguage } from "@/hooks/use-language";

export default function Hero() {
  const { t } = useLanguage();
  
  return (
    <section className="relative h-[70vh] md:h-[80vh] bg-cover bg-center" style={{ backgroundImage: `url(${candleBackground})` }}>
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <div className="container mx-auto px-4 h-full flex items-center relative z-10">
        <div className="max-w-xl">
          <h1 className="heading text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {t('home.heroTitle')}
          </h1>
          <p className="text-white text-lg md:text-xl opacity-90 mb-8">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Link href="/products">
              <Button 
                size="lg" 
                className="w-full sm:w-auto"
              >
                {t('home.exploreCollection')}
              </Button>
            </Link>
            <Link href="/about">
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary w-full sm:w-auto"
              >
                {t('home.aboutUs')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
