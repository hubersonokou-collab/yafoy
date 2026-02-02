import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SimplifiedAIChat } from '@/components/event-planner/SimplifiedAIChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Package, 
  Search, 
  ShoppingCart, 
  MapPin, 
  Star, 
  Sparkles,
  Calendar,
  ArrowRight,
  Heart,
  Cake,
  Baby,
  Church,
  Building2,
  PartyPopper,
  MessageSquare
} from 'lucide-react';

// Import category images
import decorationImg from '@/assets/categories/decoration.jpg';
import mobilierImg from '@/assets/categories/mobilier.jpg';
import sonorisationImg from '@/assets/categories/sonorisation.jpg';
import eclairageImg from '@/assets/categories/eclairage.jpg';
import vaisselleImg from '@/assets/categories/vaisselle.jpg';
import transportImg from '@/assets/categories/transport.jpg';
import photographieImg from '@/assets/categories/photographie.jpg';
import traiteurImg from '@/assets/categories/traiteur.jpg';

// Category image mapping
const categoryImages: Record<string, string> = {
  'Décoration': decorationImg,
  'Mobilier': mobilierImg,
  'Sonorisation': sonorisationImg,
  'Éclairage': eclairageImg,
  'Vaisselle': vaisselleImg,
  'Transport': transportImg,
  'Photographie': photographieImg,
  'Traiteur': traiteurImg,
};

// Event type icons for quick planning
const EVENT_TYPES = [
  { id: 'mariage', label: 'Mariage', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { id: 'anniversaire', label: 'Anniversaire', icon: Cake, color: 'bg-orange-100 text-orange-600' },
  { id: 'bapteme', label: 'Baptême', icon: Baby, color: 'bg-blue-100 text-blue-600' },
  { id: 'communion', label: 'Communion', icon: Church, color: 'bg-purple-100 text-purple-600' },
  { id: 'fete_entreprise', label: 'Entreprise', icon: Building2, color: 'bg-slate-100 text-slate-600' },
  { id: 'fiancailles', label: 'Fiançailles', icon: PartyPopper, color: 'bg-rose-100 text-rose-600' },
];

// Helper function to get full image URL
const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `https://dvbgytmkysaztbdqosup.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
};

const ClientDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [categoriesResult, productsResult, ordersResult] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('orders')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      setCategories(categoriesResult.data || []);
      setFeaturedProducts(productsResult.data || []);
      setRecentOrders(ordersResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/client/catalog?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En cours', className: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getCategoryImage = (categoryName: string) => {
    return categoryImages[categoryName] || null;
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section with Search - RESPONSIVE */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-4 sm:p-6 text-primary-foreground">
          <h1 className="text-xl sm:text-2xl font-bold">Bienvenue sur YAFOY</h1>
          <p className="mt-1 opacity-90 text-sm sm:text-base">Trouvez tout pour votre cérémonie</p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 sm:h-12 pl-10 bg-white text-foreground rounded-full text-sm sm:text-base"
              />
            </div>
          </form>
        </div>

        {/* Quick Planning Section - RESPONSIVE */}
        <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                Planifier un événement
              </CardTitle>
              <Button 
                variant="default" 
                className="rounded-full w-full sm:w-auto"
                onClick={() => navigate('/client/event-planner')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Planifier
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Quel type d'événement préparez-vous ? Cliquez pour démarrer
            </p>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
              {EVENT_TYPES.map((event) => {
                const Icon = event.icon;
                return (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/client/event-planner?event=${event.id}`)}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className={`p-2 sm:p-3 rounded-full ${event.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{event.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant Quick Access - RESPONSIVE */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-primary rounded-full shrink-0">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">Besoin d'aide ?</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Notre assistant IA vous guide
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto shrink-0"
                onClick={() => setShowChat(!showChat)}
              >
                {showChat ? 'Fermer' : 'Discuter'}
              </Button>
            </div>
            
            {/* Inline Chat */}
            {showChat && (
              <div className="mt-4 h-[350px] sm:h-[400px]">
              <SimplifiedAIChat 
                  standalone={false}
                  onReserve={() => {
                    // Ne PAS naviguer ici - la navigation est gérée par SimplifiedAIChat
                    // On ferme simplement le chat
                    setShowChat(false);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-secondary">Catégories</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((category) => {
              const categoryImage = getCategoryImage(category.name);
              return (
                <Link
                  key={category.id}
                  to={`/client/catalog?category=${category.id}`}
                  className="group flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:border-primary hover:shadow-md overflow-hidden"
                >
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-muted">
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{category.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Featured Products */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary">Produits populaires</h2>
            <Link to="/client/catalog">
              <Button variant="outline" size="sm" className="rounded-full">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {featuredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun produit disponible pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => {
                const mainImage = product.images && product.images.length > 0 ? getImageUrl(product.images[0]) : null;
                return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                        {product.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {product.location}
                          </p>
                        )}
                      </div>
                      {product.is_verified && (
                        <Badge className="bg-gold text-gold-foreground shrink-0">
                          <Star className="mr-1 h-3 w-3" />
                          Vérifié
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">
                        {Number(product.price_per_day).toLocaleString()} FCFA
                        <span className="text-xs font-normal text-muted-foreground">/jour</span>
                      </p>
                      <Button 
                        size="sm"
                        className="rounded-full"
                        onClick={() => navigate(`/client/product/${product.id}`)}
                      >
                        Réserver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders - RESPONSIVE */}
        {recentOrders.length > 0 && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Mes dernières commandes</CardTitle>
              <Link to="/client/orders">
                <Button variant="outline" size="sm" className="rounded-full w-full sm:w-auto">
                  Voir tout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer gap-3"
                    onClick={() => navigate('/client/orders')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">Commande #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pl-12 sm:pl-0">
                      <span className="font-medium text-sm sm:text-base">
                        {Number(order.total_amount).toLocaleString()} FCFA
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
