import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, Star, Loader2, Shield, Store, ShoppingBag } from 'lucide-react';

import heroBackground from '@/assets/hero-background.png';

const Index = () => {
  const { user, loading, signOut, userRole, isAdmin, isSuperAdmin, isProvider, isClient } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Background image with reduced opacity */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroBackground})`,
          opacity: 0.3
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-2xl font-bold text-secondary">
            YAFOY
          </Link>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user.email || user.phone || 'Invité'}</span>
                  {userRole && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">
                      {userRole}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Connexion
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="animate-fade-in space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-secondary md:text-6xl">
            Bienvenue sur{' '}
            <span style={{ color: '#e9560c' }}>YAFOY</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            La marketplace qui centralise tous les équipements et services pour vos cérémonies.
            Mariages, baptêmes, anniversaires — trouvez tout ce dont vous avez besoin.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {!user ? (
              <>
                <Link to="/auth">
                  <Button size="lg" className="text-lg">
                    Commencer maintenant
                  </Button>
                </Link>
                <Link to="/client/catalog">
                  <Button variant="outline" size="lg" className="text-lg">
                    Découvrir les offres
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Dashboard button based on role */}
                {(isSuperAdmin() || isAdmin()) && (
                  <Link to="/admin">
                    <Button size="lg" className="text-lg gap-2">
                      <Shield className="h-5 w-5" />
                      Administration
                    </Button>
                  </Link>
                )}
                {isProvider() && (
                  <Link to="/provider">
                    <Button size="lg" className="text-lg gap-2">
                      <Store className="h-5 w-5" />
                      Mon espace prestataire
                    </Button>
                  </Link>
                )}
                {isClient() && (
                  <Link to="/client">
                    <Button size="lg" className="text-lg gap-2">
                      <User className="h-5 w-5" />
                      Mon espace
                    </Button>
                  </Link>
                )}
                {/* Anonymous user */}
                {user.is_anonymous && (
                  <Link to="/client">
                    <Button size="lg" className="text-lg gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Explorer
                    </Button>
                  </Link>
                )}
                {/* Catalog button always visible */}
                <Link to="/client/catalog">
                  <Button variant="outline" size="lg" className="text-lg">
                    Voir le catalogue
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Features */}
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Location d'équipements</h3>
              <p className="text-sm text-muted-foreground">
                Tentes, chaises, tables, sono, décoration... Tout pour votre événement.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Prestataires vérifiés</h3>
              <p className="text-sm text-muted-foreground">
                Traiteurs, DJ, photographes... Des professionnels qualifiés et notés.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Assistant vocal</h3>
              <p className="text-sm text-muted-foreground">
                Recherchez et réservez à la voix. Accessibilité maximale pour tous.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 YAFOY. Tous droits réservés.
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Index;
