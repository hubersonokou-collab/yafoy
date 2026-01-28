import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Heart, Package } from 'lucide-react';

const ClientFavorites = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchFavorites();
    }
  }, [user, authLoading, navigate]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (favoritesError) throw favoritesError;

      if (!favoritesData || favoritesData.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const productIds = favoritesData.map((f) => f.product_id);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .in('id', productIds)
        .eq('is_active', true);

      if (productsError) throw productsError;

      setFavorites(productsData || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = (productId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      setFavorites((prev) => prev.filter((p) => p.id !== productId));
    }
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Heart className="h-6 w-6 text-destructive" />
            Mes Favoris
          </h1>
          <p className="text-muted-foreground">
            Vos produits sauvegardés pour plus tard
          </p>
        </div>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore de favoris
              </p>
              <Link to="/client/catalog">
                <button className="text-primary hover:underline flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Découvrir le catalogue
                </button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  category: product.category,
                }}
                showFavoriteButton
                onReserve={() => navigate(`/client/product/${product.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientFavorites;
