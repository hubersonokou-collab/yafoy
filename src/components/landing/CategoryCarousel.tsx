import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';

// Import category images
import decorationImg from '@/assets/categories/decoration.jpg';
import mobilierImg from '@/assets/categories/mobilier.jpg';
import sonorisationImg from '@/assets/categories/sonorisation.jpg';
import eclairageImg from '@/assets/categories/eclairage.jpg';
import vaisselleImg from '@/assets/categories/vaisselle.jpg';
import transportImg from '@/assets/categories/transport.jpg';
import photographieImg from '@/assets/categories/photographie.jpg';
import traiteurImg from '@/assets/categories/traiteur.jpg';

const categories = [
  {
    id: 1,
    name: 'Décoration',
    description: 'Articles de décoration pour cérémonies',
    image: decorationImg,
  },
  {
    id: 2,
    name: 'Mobilier',
    description: 'Tables, chaises, tentes',
    image: mobilierImg,
  },
  {
    id: 3,
    name: 'Sonorisation',
    description: 'Équipement audio et microphones',
    image: sonorisationImg,
  },
  {
    id: 4,
    name: 'Éclairage',
    description: 'Lumières et effets lumineux',
    image: eclairageImg,
  },
  {
    id: 5,
    name: 'Vaisselle',
    description: 'Assiettes, verres, couverts',
    image: vaisselleImg,
  },
  {
    id: 6,
    name: 'Transport',
    description: 'Véhicules de cérémonie',
    image: transportImg,
  },
  {
    id: 7,
    name: 'Photographie',
    description: 'Équipement photo et vidéo',
    image: photographieImg,
  },
  {
    id: 8,
    name: 'Traiteur',
    description: 'Services de restauration',
    image: traiteurImg,
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
            {categories.map((category) => (
              <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                <Link to="/client/catalog">
                  <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 overflow-hidden">
                    <CardContent className="p-0 relative">
                      {/* Image */}
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        
                        {/* Text content */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                          <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-white/80">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 h-12 w-12 border-2 border-primary/20 hover:bg-primary hover:text-primary-foreground" />
          <CarouselNext className="hidden md:flex -right-12 h-12 w-12 border-2 border-primary/20 hover:bg-primary hover:text-primary-foreground" />
        </Carousel>
      </div>
    </section>
  );
};

export default CategoryCarousel;
