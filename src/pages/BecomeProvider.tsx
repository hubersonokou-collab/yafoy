import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Shield, 
  Star,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Globe,
  Headphones,
  Award
} from 'lucide-react';
import { Header, Footer } from '@/components/landing';

const benefits = [
  {
    icon: Users,
    title: 'Accédez à des milliers de clients',
    description: 'Touchez une audience ciblée d\'organisateurs de mariages, baptêmes, anniversaires et événements professionnels.',
  },
  {
    icon: TrendingUp,
    title: 'Augmentez votre chiffre d\'affaires',
    description: 'Nos prestataires constatent en moyenne une augmentation de 40% de leurs réservations après 6 mois.',
  },
  {
    icon: Calendar,
    title: 'Gestion simplifiée',
    description: 'Tableau de bord intuitif pour gérer vos disponibilités, commandes et communications clients.',
  },
  {
    icon: CreditCard,
    title: 'Paiements sécurisés',
    description: 'Recevez vos paiements rapidement et en toute sécurité via notre système certifié.',
  },
  {
    icon: Star,
    title: 'Construisez votre réputation',
    description: 'Les avis clients vous aident à bâtir une réputation solide et à vous démarquer.',
  },
  {
    icon: Headphones,
    title: 'Support dédié aux pros',
    description: 'Une équipe dédiée pour vous accompagner et répondre à toutes vos questions.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Créez votre compte',
    description: 'Inscription gratuite en quelques minutes.',
  },
  {
    number: '2',
    title: 'Complétez votre profil',
    description: 'Ajoutez vos informations, photos et tarifs.',
  },
  {
    number: '3',
    title: 'Publiez vos services',
    description: 'Présentez votre catalogue de produits et prestations.',
  },
  {
    number: '4',
    title: 'Recevez des commandes',
    description: 'Les clients vous contactent et réservent directement.',
  },
];

const stats = [
  { value: '500+', label: 'Prestataires actifs' },
  { value: '10K+', label: 'Événements organisés' },
  { value: '4.8/5', label: 'Satisfaction client' },
  { value: '40%', label: 'Croissance moyenne' },
];

const features = [
  {
    icon: Globe,
    title: 'Visibilité en ligne',
    description: 'Votre profil public optimisé pour le référencement',
  },
  {
    icon: Smartphone,
    title: 'Application mobile',
    description: 'Gérez vos réservations depuis votre smartphone',
  },
  {
    icon: Award,
    title: 'Badge vérifié',
    description: 'Gagnez la confiance des clients avec notre certification',
  },
];

const BecomeProvider = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-gold/10 to-transparent">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                <span>Rejoignez une communauté de confiance</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-secondary mb-6">
                Devenez <span className="text-primary">prestataire</span> YAFOY
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Développez votre activité en rejoignant la première marketplace 
                dédiée aux cérémonies et événements. Inscription gratuite, 
                commission uniquement sur les ventes.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                    S'inscrire gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/client/catalog">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl">
                    Voir les prestataires
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 px-4 bg-card border-y border-border">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-secondary mb-4">
                Pourquoi rejoindre <span className="text-primary">YAFOY</span> ?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Des avantages concrets pour développer votre activité
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={index} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-secondary mb-2 group-hover:text-primary transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How to Join Section */}
        <section className="py-16 px-4 bg-card/50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-secondary mb-4">
                Comment <span className="text-primary">rejoindre</span> ?
              </h2>
              <p className="text-muted-foreground">
                Quatre étapes simples pour commencer à vendre
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="text-center relative">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-primary/20" />
                  )}
                  
                  <div className="relative z-10 w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-secondary mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-secondary mb-4">
                Outils <span className="text-primary">professionnels</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                      <IconComponent className="h-8 w-8 text-gold" />
                    </div>
                    <h3 className="font-semibold text-secondary mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-gold/10 to-primary/10">
          <div className="container mx-auto max-w-3xl">
            <Card className="p-8 md:p-12 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-gold fill-gold" />
                ))}
              </div>
              <blockquote className="text-lg md:text-xl text-foreground mb-6 italic leading-relaxed">
                "Depuis que j'ai rejoint YAFOY, mon activité de location de matériel 
                a vraiment décollé. La plateforme est intuitive et le support est excellent. 
                Je recommande à tous les prestataires d'événements !"
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-secondary">Amadou Diallo</div>
                  <div className="text-sm text-muted-foreground">Location de tentes - Dakar</div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-secondary mb-4">
              Prêt à développer votre activité ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Rejoignez les centaines de prestataires qui font confiance à YAFOY
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="rounded-xl shadow-lg shadow-primary/25">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Inscription gratuite
                </Button>
              </Link>
              <Link to="#contact">
                <Button variant="outline" size="lg" className="rounded-xl">
                  <Headphones className="mr-2 h-5 w-5" />
                  Nous contacter
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              ✓ Inscription gratuite · ✓ Commission uniquement sur les ventes · ✓ Sans engagement
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeProvider;
