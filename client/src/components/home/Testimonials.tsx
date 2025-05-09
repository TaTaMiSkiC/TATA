import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    rating: 5,
    text: "Svijeće od Kerzenwelta su jednostavno savršene! Miris traje dugo i nije previše intenzivan. Obožavam kako Vanilla Dreams svijeća ispuni cijeli dnevni boravak ugodnim mirisom.",
    author: "Marija Kovačić",
    location: "Zagreb",
    initials: "MK"
  },
  {
    id: 2,
    rating: 4.5,
    text: "Kupila sam personaliziranu svijeću za poklon prijateljici i bila je oduševljena! Kvaliteta je izvrsna, a personalizacija je izgledala vrlo profesionalno. Definitivno ću ponovno kupovati.",
    author: "Ana Horvat",
    location: "Split",
    initials: "AH"
  },
  {
    id: 3,
    rating: 5,
    text: "Amber Santal miris je savršen za moj radni prostor. Suptilan je, ali dovoljno prisutan da stvori ugodnu atmosferu. Svijeća gori ravnomjerno i dugo traje. Odlična vrijednost za novac!",
    author: "Ivan Vukić",
    location: "Rijeka",
    initials: "IV"
  }
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="heading text-3xl md:text-4xl font-bold text-foreground">Što kažu naši kupci</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Iskustva naših zadovoljnih kupaca</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-card p-6 rounded-lg shadow-md">
              <div className="flex text-warning mb-4">
                {Array.from({ length: Math.floor(testimonial.rating) }).map((_, i) => (
                  <Star key={i} className="fill-warning text-warning" size={18} />
                ))}
                {testimonial.rating % 1 !== 0 && (
                  <Star className="fill-warning text-warning" size={18} />
                )}
              </div>
              <p className="text-muted-foreground italic mb-6">{testimonial.text}</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
                  {testimonial.initials}
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-foreground">{testimonial.author}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
