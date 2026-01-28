import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Aminata K.',
    role: 'Mariée',
    content: 'YAFOY a transformé notre mariage en un moment magique. Le service était impeccable et les prestataires d\'une grande qualité.',
    rating: 5,
    avatar: 'AK',
  },
  {
    id: 2,
    name: 'Moussa D.',
    role: 'Organisateur d\'événements',
    content: 'Une plateforme révolutionnaire ! J\'ai trouvé tous les équipements pour mon événement en quelques clics. Hautement recommandé.',
    rating: 5,
    avatar: 'MD',
  },
  {
    id: 3,
    name: 'Fatou S.',
    role: 'Mère de famille',
    content: 'Pour le baptême de mon fils, YAFOY m\'a permis de trouver le traiteur parfait et une décoration sublime. Merci infiniment !',
    rating: 5,
    avatar: 'FS',
  },
  {
    id: 4,
    name: 'Ibrahim T.',
    role: 'Chef d\'entreprise',
    content: 'L\'assistant vocal est incroyable pour les personnes comme ma mère qui ne sont pas à l\'aise avec la technologie.',
    rating: 5,
    avatar: 'IT',
  },
];

const TestimonialCarousel = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-card to-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4 font-serif">
            Ce que disent nos clients
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Des milliers de cérémonies réussies grâce à YAFOY
          </p>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="pl-2 md:pl-4 basis-full md:basis-1/2">
                <Card className="h-full bg-card border-2 border-border hover:border-gold/30 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-8 relative">
                    <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
                    
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-foreground text-lg leading-relaxed mb-6 italic">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 h-12 w-12 border-2 border-gold/30 hover:bg-gold hover:text-gold-foreground" />
          <CarouselNext className="hidden md:flex -right-12 h-12 w-12 border-2 border-gold/30 hover:bg-gold hover:text-gold-foreground" />
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialCarousel;
