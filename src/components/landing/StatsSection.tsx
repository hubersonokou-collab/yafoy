import { Card, CardContent } from '@/components/ui/card';
import { Users, ShoppingBag, Star, CheckCircle } from 'lucide-react';

const stats = [
  {
    id: 1,
    label: 'Clients satisfaits',
    value: '10K+',
    icon: Users,
    color: 'text-primary',
  },
  {
    id: 2,
    label: 'Produits disponibles',
    value: '5K+',
    icon: ShoppingBag,
    color: 'text-gold',
  },
  {
    id: 3,
    label: 'Note moyenne',
    value: '4.9',
    icon: Star,
    color: 'text-gold',
  },
  {
    id: 4,
    label: 'Prestataires vérifiés',
    value: '500+',
    icon: CheckCircle,
    color: 'text-success',
  },
];

const StatsSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <Card key={stat.id} className="text-center border-0 bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-lg group">
                <CardContent className="p-6 md:p-8">
                  <div className={`inline-flex mb-4 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 md:h-10 md:w-10" />
                  </div>
                  <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
