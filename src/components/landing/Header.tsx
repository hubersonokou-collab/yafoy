import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import logoYafoy from '@/assets/logo-yafoy.png';

const Header = () => {
  const { user, signOut, userRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logoYafoy} alt="YAFOY" className="h-12 md:h-14 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/client/catalog" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Catalogue
          </Link>
          <Link to="/comment-ca-marche" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Comment ça marche
          </Link>
          <Link to="/devenir-prestataire" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Devenir prestataire
          </Link>
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="max-w-32 truncate">{user.email || user.phone || 'Invité'}</span>
                {userRole && (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold font-medium">
                    {userRole}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={signOut} className="rounded-lg">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="rounded-lg">
                  <LogIn className="mr-2 h-4 w-4" />
                  Connexion
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="rounded-lg shadow-md shadow-primary/20">
                  S'inscrire
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 animate-fade-in">
          <nav className="flex flex-col gap-4 mb-4">
            <Link 
              to="/client/catalog" 
              className="text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Catalogue
            </Link>
            <Link 
              to="/comment-ca-marche" 
              className="text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Comment ça marche
            </Link>
            <Link 
              to="/devenir-prestataire" 
              className="text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Devenir prestataire
            </Link>
          </nav>
          
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            {user ? (
              <>
                <div className="flex items-center gap-2 py-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  <span>{user.email || user.phone || 'Invité'}</span>
                </div>
                <Button variant="outline" onClick={signOut} className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Connexion
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">
                    S'inscrire
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
