import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Shield,
  Store,
  Heart,
  Bell,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const superAdminNav: NavItem[] = [
  { title: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { title: 'Utilisateurs', href: '/admin/users', icon: Users },
  { title: 'Prestataires', href: '/admin/providers', icon: Store },
  { title: 'Produits', href: '/admin/products', icon: Package },
  { title: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
  { title: 'Paramètres', href: '/admin/settings', icon: Settings },
];

const providerNav: NavItem[] = [
  { title: 'Tableau de bord', href: '/provider', icon: LayoutDashboard },
  { title: 'Mes produits', href: '/provider/products', icon: Package },
  { title: 'Commandes', href: '/provider/orders', icon: ShoppingCart },
  { title: 'Paramètres', href: '/provider/settings', icon: Settings },
];

const clientNav: NavItem[] = [
  { title: 'Accueil', href: '/client', icon: LayoutDashboard },
  { title: 'Catalogue', href: '/client/catalog', icon: Package },
  { title: 'Mes commandes', href: '/client/orders', icon: ShoppingCart },
  { title: 'Favoris', href: '/client/favorites', icon: Heart },
  { title: 'Paramètres', href: '/client/settings', icon: Settings },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isSuperAdmin, isAdmin, isProvider, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdminOrAdmin = isSuperAdmin() || isAdmin();
  const isProviderUser = isProvider();
  
  let navItems: NavItem[] = clientNav;
  let dashboardTitle = 'Client';
  let DashboardIcon = Heart;

  if (isSuperAdminOrAdmin) {
    navItems = superAdminNav;
    dashboardTitle = 'Administration';
    DashboardIcon = Shield;
  } else if (isProviderUser) {
    navItems = providerNav;
    dashboardTitle = 'Prestataire';
    DashboardIcon = Store;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-bold text-primary-foreground">Y</span>
          </div>
          <span className="font-bold text-secondary">YAFOY</span>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
          <DashboardIcon className="h-5 w-5 text-primary" />
          <span className="font-medium text-secondary">{dashboardTitle}</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-secondary'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-border bg-card lg:block">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              3
            </span>
          </Button>

          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Retour au site
            </Button>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};
