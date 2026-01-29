import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle, XCircle, Image, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_per_day: number;
  images: string[] | null;
  is_active: boolean;
  is_verified: boolean;
  provider_id: string;
  created_at: string;
}

const ModeratorProducts = () => {
  const { user, loading, isModerator, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState<string>('unverified');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && user && !isModerator() && !isAdmin() && !isSuperAdmin()) {
      navigate('/');
      return;
    }
  }, [user, loading, navigate, isModerator, isAdmin, isSuperAdmin]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterVerified === 'unverified') {
        query = query.eq('is_verified', false);
      } else if (filterVerified === 'verified') {
        query = query.eq('is_verified', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (isModerator() || isAdmin() || isSuperAdmin())) {
      fetchProducts();
    }
  }, [user, filterVerified, isModerator, isAdmin, isSuperAdmin]);

  const handleVerify = async (productId: string, verify: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_verified: verify })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: verify ? 'Produit vérifié' : 'Vérification retirée',
        description: verify 
          ? 'Le produit a été approuvé' 
          : 'La vérification du produit a été retirée',
      });

      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Modération des produits</h1>
          <p className="text-muted-foreground">Vérifier et approuver les produits</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Liste des produits ({filteredProducts.length})</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-48"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filterVerified === 'unverified' ? 'default' : 'outline'}
                    onClick={() => setFilterVerified('unverified')}
                  >
                    Non vérifiés
                  </Button>
                  <Button
                    size="sm"
                    variant={filterVerified === 'verified' ? 'default' : 'outline'}
                    onClick={() => setFilterVerified('verified')}
                  >
                    Vérifiés
                  </Button>
                  <Button
                    size="sm"
                    variant={filterVerified === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterVerified('all')}
                  >
                    Tous
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun produit trouvé
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-lg border border-border overflow-hidden"
                  >
                    <div className="aspect-video bg-muted relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {product.is_verified ? (
                          <Badge className="bg-emerald-500">Vérifié</Badge>
                        ) : (
                          <Badge variant="secondary">Non vérifié</Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {product.description || 'Pas de description'}
                      </p>
                      <div className="flex items-center gap-1 text-primary font-medium mb-3">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(product.price_per_day)}/jour
                      </div>
                      <div className="flex gap-2">
                        {!product.is_verified ? (
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleVerify(product.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-amber-500 text-amber-600"
                            onClick={() => handleVerify(product.id, false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Retirer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ModeratorProducts;
