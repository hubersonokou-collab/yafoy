import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProviderProductsList } from './ProviderProductsList';
import { ClientOrdersList } from './ClientOrdersList';
import {
  CheckCircle,
  ExternalLink,
  Heart,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Star,
} from 'lucide-react';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: string;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  location: string | null;
}

interface Product {
  id: string;
  name: string;
  price_per_day: number;
  images: string[] | null;
  is_active: boolean;
  is_verified: boolean;
  category?: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  event_date: string | null;
}

interface Favorite {
  id: string;
  product: {
    id: string;
    name: string;
    images: string[] | null;
    price_per_day: number;
  } | null;
}

interface ProviderStats {
  productsCount: number;
  reviewsCount: number;
  averageRating: number;
  completedOrdersCount: number;
  hasVerifiedProducts: boolean;
}

interface ClientStats {
  ordersCount: number;
  totalSpent: number;
  favoritesCount: number;
}

export const UserProfileDialog = ({
  open,
  onOpenChange,
  userId,
  userRole,
}: UserProfileDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderStats | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);

  const isProvider = userRole === 'provider';

  useEffect(() => {
    if (open && userId) {
      fetchUserData();
    }
  }, [open, userId, userRole]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url, location')
        .eq('user_id', userId)
        .single();

      setProfile(profileData);

      if (isProvider) {
        await fetchProviderData();
      } else {
        await fetchClientData();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderData = async () => {
    // Fetch products
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price_per_day, images, is_active, is_verified, category:categories(name)')
      .eq('provider_id', userId)
      .order('created_at', { ascending: false });

    setProducts(productsData || []);

    // Fetch reviews for stats
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('provider_id', userId);

    // Fetch completed orders count
    const { count: completedOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', userId)
      .eq('status', 'completed');

    const reviews = reviewsData || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    setProviderStats({
      productsCount: productsData?.length || 0,
      reviewsCount: reviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
      completedOrdersCount: completedOrdersCount || 0,
      hasVerifiedProducts: productsData?.some((p) => p.is_verified) || false,
    });
  };

  const fetchClientData = async () => {
    // Fetch orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at, event_date')
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    setOrders(ordersData || []);

    // Fetch all orders for stats
    const { data: allOrdersData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('client_id', userId);

    // Fetch favorites
    const { data: favoritesData } = await supabase
      .from('favorites')
      .select('id, product:products(id, name, images, price_per_day)')
      .eq('user_id', userId);

    setFavorites(favoritesData || []);

    const allOrders = allOrdersData || [];
    setClientStats({
      ordersCount: allOrders.length,
      totalSpent: allOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      favoritesCount: favoritesData?.length || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Profil Utilisateur</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {loading ? (
                <>
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">
                        {profile?.full_name || 'Utilisateur'}
                      </h3>
                      <Badge
                        className={
                          isProvider
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {isProvider ? 'Prestataire' : 'Client'}
                      </Badge>
                      {isProvider && providerStats?.hasVerifiedProducts && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {profile?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {profile.phone}
                        </div>
                      )}
                      {profile?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {profile.location}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Stats Cards */}
            {isProvider ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">
                      {loading ? '-' : providerStats?.productsCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Produits</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-2xl font-bold">
                      {loading ? '-' : providerStats?.averageRating || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Note ({providerStats?.reviewsCount || 0} avis)
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-2xl font-bold">
                      {loading ? '-' : providerStats?.completedOrdersCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Commandes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-2xl font-bold">
                      {loading
                        ? '-'
                        : products.filter((p) => p.is_verified).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Vérifiés</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">
                      {loading ? '-' : clientStats?.ordersCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Commandes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-lg font-bold text-primary">
                      {loading
                        ? '-'
                        : `${(clientStats?.totalSpent || 0).toLocaleString('fr-FR')}`}
                    </p>
                    <p className="text-xs text-muted-foreground">FCFA dépensés</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                    <p className="text-2xl font-bold">
                      {loading ? '-' : clientStats?.favoritesCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Favoris</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Provider: Products List */}
            {isProvider && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produits ({products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProviderProductsList products={products} loading={loading} />
                </CardContent>
              </Card>
            )}

            {/* Client: Orders List */}
            {!isProvider && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Commandes récentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClientOrdersList orders={orders} loading={loading} />
                </CardContent>
              </Card>
            )}

            {/* Client: Favorites */}
            {!isProvider && favorites.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Produits favoris ({favorites.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {favorites.slice(0, 6).map((fav) =>
                      fav.product ? (
                        <div
                          key={fav.id}
                          className="p-2 rounded-lg border bg-card text-center"
                        >
                          <div className="h-16 w-full rounded overflow-hidden bg-muted mb-2">
                            {fav.product.images?.[0] ? (
                              <img
                                src={fav.product.images[0]}
                                alt={fav.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium truncate">
                            {fav.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fav.product.price_per_day.toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                      ) : null
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Provider: Link to public profile */}
            {isProvider && (
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/provider/${userId}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir le profil public
                </Link>
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
