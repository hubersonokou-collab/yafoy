import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mic, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const HeroSection = () => {
  const { user, isAdmin, isSuperAdmin, isProvider, isClient, isAccountant, isSupervisor, isModerator, isSupport } = useAuth();

  return (
    <section className="relative py-20 md:py-32 px-4 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>La marketplace #1 pour vos cérémonies</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in font-serif">
            <span className="text-secondary">Organisez vos</span>
            <br />
            <span style={{ color: '#e9560c' }} className="relative">
              cérémonies
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0,8 Q50,0 100,8 T200,8" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
            <br />
            <span className="text-secondary">en toute simplicité</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Mariages, baptêmes, anniversaires — trouvez tous les équipements et prestataires 
            dont vous avez besoin. <span className="text-primary font-medium">Accessible à tous</span>, 
            même à la voix.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            {!user ? (
              <>
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/client/catalog">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300">
                    Découvrir le catalogue
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {(isSuperAdmin() || isAdmin()) && (
                  <Link to="/admin">
                    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                      Accéder à l'administration
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {isAccountant() && (
                  <Link to="/team/accountant">
                    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                      Accéder à l'interface comptable
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {isSupervisor() && (
                  <Link to="/team/supervisor">
                    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                      Accéder à l'interface superviseur
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {isModerator() && (
                  <Link to="/team/moderator">
                    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                      Accéder à l'interface modérateur
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {isSupport() && (
                  <Link to="/team/support">
                    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                      Accéder à l'interface support
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {isProvider() && (
                  <Link to="/provider">
                    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                      Mon espace prestataire
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {(isClient() || user.is_anonymous) && (
                  <Link to="/client">
                    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                      Mon espace client
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link to="/client/catalog">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl border-2">
                    Explorer le catalogue
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Voice feature highlight */}
          <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground animate-fade-in">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm">
              Nouveau : Recherchez et réservez <span className="text-primary font-medium">à la voix</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
