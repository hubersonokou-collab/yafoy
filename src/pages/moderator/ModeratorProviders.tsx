import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, User, Store, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Provider {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
  productCount?: number;
}

const ModeratorProviders = () => {
  const { user, loading, isModerator, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        // Fetch provider user_ids
        const { data: providerRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'provider');

        if (!providerRoles || providerRoles.length === 0) {
          setProviders([]);
          setIsLoading(false);
          return;
        }

        const providerUserIds = providerRoles.map(r => r.user_id);

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', providerUserIds);

        // Fetch product counts
        const { data: products } = await supabase
          .from('products')
          .select('provider_id');

        const productCounts: Record<string, number> = {};
        products?.forEach(p => {
          productCounts[p.provider_id] = (productCounts[p.provider_id] || 0) + 1;
        });

        const providersWithCounts = profiles?.map(p => ({
          ...p,
          productCount: productCounts[p.user_id] || 0,
        })) || [];

        setProviders(providersWithCounts);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (isModerator() || isAdmin() || isSuperAdmin())) {
      fetchProviders();
    }
  }, [user, isModerator, isAdmin, isSuperAdmin]);

  const filteredProviders = providers.filter(provider =>
    provider.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.phone?.includes(searchTerm)
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
          <h1 className="text-3xl font-bold text-secondary">Prestataires</h1>
          <p className="text-muted-foreground">Liste des prestataires inscrits</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Prestataires ({filteredProviders.length})
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProviders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun prestataire trouvé
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {provider.avatar_url ? (
                          <img
                            src={provider.avatar_url}
                            alt={provider.full_name || 'Avatar'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {provider.full_name || 'Non renseigné'}
                        </h3>
                        {provider.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {provider.location}
                          </div>
                        )}
                        {provider.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {provider.phone}
                          </div>
                        )}
                        <div className="mt-2">
                          <Badge variant="outline">
                            {provider.productCount} produit(s)
                          </Badge>
                        </div>
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

export default ModeratorProviders;
