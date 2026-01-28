import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Tent, Music, Camera, UtensilsCrossed, Sparkles, Users } from 'lucide-react';

const categories = [
  {
    id: 1,
    name: 'Tentes & Chapiteaux',
    icon: Tent,
    description: 'Structures pour vos événements',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 2,
    name: 'Sonorisation',
    icon: Music,
    description: 'Son et lumière professionnels',
    color: 'bg-gold/20 text-gold',
  },
  {
    id: 3,
    name: 'Photographie',
    icon: Camera,
    description: 'Immortalisez vos moments',
    color: 'bg-success/10 text-success',
  },
  {
    id: 4,
    name: 'Traiteurs',
    icon: UtensilsCrossed,
    description: 'Gastronomie d\'exception',
    color: 'bg-destructive/10 text-destructive',
  },
  {
    id: 5,
    name: 'Décoration',
    icon: Sparkles,
    description: 'Ambiance personnalisée',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 6,
    name: 'Animation',
    icon: Users,
    description: 'Divertissement garanti',
    color: 'bg-gold/20 text-gold',
  },
];

const CategoryCarousel = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4 font-serif">
            Explorez nos catégories
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour organiser une cérémonie inoubliable
          </p>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Link to="/client/catalog">
                    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-transparent hover:border-primary/20">
                      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                        <div className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl ${category.color} transition-transform duration-300 group-hover:scale-110`}>
                          <IconComponent className="h-10 w-10" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 h-12 w-12 border-2 border-primary/20 hover:bg-primary hover:text-primary-foreground" />
          <CarouselNext className="hidden md:flex -right-12 h-12 w-12 border-2 border-primary/20 hover:bg-primary hover:text-primary-foreground" />
        </Carousel>
      </div>
    </section>
  );
};

export default CategoryCarousel;
