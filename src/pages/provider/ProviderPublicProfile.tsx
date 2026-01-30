import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductCard } from '@/components/products/ProductCard';
import { ReviewList, ProviderRating } from '@/components/reviews';
import {
  Loader2,
  User,
  Star,
  MapPin,
  Package,
  ArrowLeft,
  Phone,
} from 'lucide-react';

const ProviderPublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    reviewCount: 0,
    productCount: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProviderData();
    }
  }, [id]);

  const fetchProviderData = async () => {
    try {
      // Fetch provider profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProvider(profileData);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('provider_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!productsError) {
        setProducts(productsData || []);
      }

      // Fetch reviews stats
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', id);

      const reviews = reviewsData || [];
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      // Fetch completed orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', id)
        .eq('status', 'completed');

      // Check if verified (any verified product)
      const hasVerifiedProduct = (productsData || []).some((p) => p.is_verified);

      setProvider({
        ...profileData,
        is_verified: hasVerifiedProduct,
      });

      setStats({
        averageRating: avgRating,
        reviewCount: reviews.length,
        productCount: (productsData || []).length,
        completedOrders: ordersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Prestataire non trouvé</p>
        <Link to="/">
          <Button variant="link" className="mt-2">
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-2xl font-bold text-secondary">
            YAFOY
          </Link>
          <Link to="/auth">
            <Button size="sm">Connexion</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <div className="space-y-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={provider.avatar_url || ''} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h1 className="text-2xl font-bold text-secondary">
                      {provider.full_name || 'Prestataire'}
                    </h1>
                    {provider.is_verified && (
                      <Badge className="bg-gold text-gold-foreground w-fit">
                        <Star className="mr-1 h-3 w-3" />
                        Vérifié
                      </Badge>
                    )}
                  </div>

                  {provider.location && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-2 justify-center sm:justify-start">
                      <MapPin className="h-4 w-4" />
                      {provider.location}
                    </p>
                  )}

                  {/* Stats with improved rating display */}
                  <div className="flex flex-wrap gap-6 mt-4 justify-center sm:justify-start">
                    <ProviderRating providerId={id!} size="md" showCount />
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{stats.productCount} produits</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-success">
                        {stats.completedOrders}
                      </span>{' '}
                      locations terminées
                    </div>
                  </div>

                  {/* Contact */}
                  {provider.phone && (
                    <div className="mt-4">
                      <Button variant="outline" asChild>
                        <a href={`tel:${provider.phone}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Appeler
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <div>
            <h2 className="text-xl font-bold text-secondary mb-4">
              Produits disponibles
            </h2>
            {products.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Aucun produit disponible
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      category: product.category,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Avis clients</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewList providerId={id!} />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 YAFOY. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
};

export default ProviderPublicProfile;
