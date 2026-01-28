import { Link } from 'react-router-dom';
import logoYafoy from '@/assets/logo-yafoy.png';

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img src={logoYafoy} alt="YAFOY" className="h-12 w-auto" />
            </Link>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed">
              La marketplace qui centralise tous les équipements et services pour vos cérémonies.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produits</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/client/catalog" className="hover:text-primary transition-colors">Catalogue</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Tentes</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Sonorisation</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Décoration</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="#" className="hover:text-primary transition-colors">Traiteurs</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Photographes</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">DJ & Animation</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Décorateurs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="#" className="hover:text-primary transition-colors">Aide</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Conditions</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-secondary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-secondary-foreground/60">
          <p>© 2024 YAFOY. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <Link to="#" className="hover:text-primary transition-colors">Confidentialité</Link>
            <Link to="#" className="hover:text-primary transition-colors">Mentions légales</Link>
            <Link to="#" className="hover:text-primary transition-colors">CGU</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
