import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Shield, Mic, Clock, CreditCard, Headphones } from 'lucide-react';

const features = [
  {
    id: 1,
    title: 'Location d\'équipements',
    description: 'Tentes, chaises, tables, sono, décoration... Tout pour votre événement en un seul endroit.',
    icon: ShoppingCart,
    gradient: 'from-primary/20 to-primary/5',
  },
  {
    id: 2,
    title: 'Prestataires vérifiés',
    description: 'Traiteurs, DJ, photographes... Des professionnels qualifiés et notés par notre communauté.',
    icon: Shield,
    gradient: 'from-success/20 to-success/5',
  },
  {
    id: 3,
    title: 'Assistant vocal',
    description: 'Recherchez et réservez à la voix. Accessibilité maximale pour tous, même sans expertise digitale.',
    icon: Mic,
    gradient: 'from-gold/20 to-gold/5',
  },
  {
    id: 4,
    title: 'Disponibilité en temps réel',
    description: 'Vérifiez instantanément la disponibilité des équipements et prestataires pour votre date.',
    icon: Clock,
    gradient: 'from-primary/20 to-primary/5',
  },
  {
    id: 5,
    title: 'Paiement sécurisé',
    description: 'Transactions protégées et options de paiement flexibles adaptées à vos besoins.',
    icon: CreditCard,
    gradient: 'from-success/20 to-success/5',
  },
  {
    id: 6,
    title: 'Support 24/7',
    description: 'Une équipe dédiée à votre écoute pour vous accompagner dans l\'organisation de vos événements.',
    icon: Headphones,
    gradient: 'from-gold/20 to-gold/5',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 px-4 bg-card/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4 font-serif">
            Pourquoi choisir YAFOY ?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Une plateforme pensée pour simplifier l'organisation de vos cérémonies
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.id} 
                className="group border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
              >
                <CardContent className="p-8 relative">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <IconComponent className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
