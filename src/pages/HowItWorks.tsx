import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Calendar, 
  CreditCard, 
  Truck, 
  Star, 
  ArrowRight,
  Mic,
  CheckCircle,
  Users,
  Shield
} from 'lucide-react';
import { Header, Footer } from '@/components/landing';

const steps = [
  {
    number: '01',
    title: 'Recherchez',
    description: 'Parcourez notre catalogue ou utilisez la recherche vocale pour trouver les équipements et prestataires parfaits pour votre événement.',
    icon: Search,
    color: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    number: '02',
    title: 'Comparez & Choisissez',
    description: 'Consultez les avis, comparez les prix et sélectionnez les meilleures options selon vos besoins et votre budget.',
    icon: Star,
    color: 'from-gold/20 to-gold/5',
    iconColor: 'text-gold',
  },
  {
    number: '03',
    title: 'Réservez en ligne',
    description: 'Sélectionnez vos dates, indiquez le lieu de livraison et confirmez votre réservation en quelques clics ou à la voix.',
    icon: Calendar,
    color: 'from-success/20 to-success/5',
    iconColor: 'text-success',
  },
  {
    number: '04',
    title: 'Payez en toute sécurité',
    description: 'Réglez votre commande via notre système de paiement sécurisé. Acompte ou paiement intégral, vous choisissez.',
    icon: CreditCard,
    color: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    number: '05',
    title: 'Livraison & Installation',
    description: 'Le prestataire livre et installe les équipements à l\'adresse indiquée, au jour et à l\'heure convenus.',
    icon: Truck,
    color: 'from-gold/20 to-gold/5',
    iconColor: 'text-gold',
  },
  {
    number: '06',
    title: 'Profitez & Évaluez',
    description: 'Profitez de votre événement sereinement. Après, partagez votre expérience pour aider la communauté.',
    icon: CheckCircle,
    color: 'from-success/20 to-success/5',
    iconColor: 'text-success',
  },
];

const features = [
  {
    icon: Mic,
    title: 'Commande vocale',
    description: 'Naviguez et réservez simplement en parlant. Dites "Rechercher tentes" ou "Mes commandes".',
  },
  {
    icon: Shield,
    title: 'Prestataires vérifiés',
    description: 'Tous nos prestataires sont vérifiés et évalués par notre communauté.',
  },
  {
    icon: Users,
    title: 'Support dédié',
    description: 'Une équipe à votre écoute 7j/7 pour vous accompagner.',
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-secondary mb-6">
              Comment ça <span className="text-primary">marche</span> ?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Organisez votre événement en toute simplicité. Suivez ces étapes 
              pour réserver vos équipements et prestataires.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mic className="h-5 w-5 text-primary" />
              <span>Astuce : Utilisez les commandes vocales pour naviguer plus rapidement !</span>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="relative">
              {/* Vertical line connecting steps */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-gold to-success hidden md:block" />
              
              <div className="space-y-8 md:space-y-12">
                {steps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <div 
                      key={step.number}
                      className="relative flex flex-col md:flex-row gap-6 md:gap-8"
                    >
                      {/* Step number circle */}
                      <div className="relative z-10 shrink-0">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} border-4 border-background shadow-lg flex items-center justify-center`}>
                          <span className="text-xl font-bold text-secondary">{step.number}</span>
                        </div>
                      </div>
                      
                      {/* Content card */}
                      <Card className="flex-1 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                        <CardContent className="p-6 md:p-8 relative">
                          <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                          
                          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                            <div className={`shrink-0 w-14 h-14 rounded-xl bg-card shadow flex items-center justify-center ${step.iconColor}`}>
                              <IconComponent className="h-7 w-7" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-xl md:text-2xl font-semibold text-secondary mb-2 group-hover:text-primary transition-colors">
                                {step.title}
                              </h3>
                              <p className="text-muted-foreground leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-card/50">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-secondary text-center mb-12">
              Ce qui nous rend <span className="text-primary">différents</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-secondary mb-4">
              Prêt à organiser votre événement ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Découvrez notre catalogue d'équipements et de prestataires
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/client/catalog">
                <Button size="lg" className="rounded-xl shadow-lg shadow-primary/25">
                  Explorer le catalogue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="rounded-xl">
                  Créer un compte
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
