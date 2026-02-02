import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Flag,
  Package,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  Users,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_product_id: string | null;
  type: string;
  description: string | null;
  status: string;
  created_at: string;
  resolution_notes: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_per_day: number;
  images: string[] | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  provider_id: string;
}

interface ProviderProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
  productCount: number;
  hasProducts: boolean;
}

const ModeratorDashboard = () => {
  const { user, loading: authLoading, isModerator, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [stats, setStats] = useState({
    pendingReports: 0,
    unverifiedProducts: 0,
    resolvedReports: 0,
    totalProviders: 0,
  });

  // Tab management with URL params
  const currentTab = searchParams.get('tab') || 'reports';
  const setCurrentTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Pagination for each section
  const reportsPagination = usePagination(reports, { itemsPerPage: 10 });
  const providersPagination = usePagination(providers, { itemsPerPage: 10 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isModerator() && !isAdmin() && !isSuperAdmin()) {
      navigate('/');
      return;
    }

    if (user && (isModerator() || isAdmin() || isSuperAdmin())) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      // Fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);

      // Fetch unverified products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch provider profiles (users with provider role)
      const { data: providerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'provider');

      if (rolesError) throw rolesError;

      if (providerRoles && providerRoles.length > 0) {
        const providerIds = providerRoles.map((r) => r.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', providerIds)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Fetch product count for each provider
        const providersWithProducts = await Promise.all(
          (profilesData || []).map(async (profile) => {
            const { count } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('provider_id', profile.user_id);

            return {
              ...profile,
              productCount: count || 0,
              hasProducts: (count || 0) > 0,
            };
          })
        );

        setProviders(providersWithProducts);
      }

      // Calculate stats
      setStats({
        pendingReports: (reportsData || []).filter((r) => r.status === 'pending').length,
        unverifiedProducts: (productsData || []).length,
        resolvedReports: (reportsData || []).filter((r) => r.status === 'resolved').length,
        totalProviders: providerRoles?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (id: string, action: 'resolve' | 'dismiss', notes?: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: action === 'resolve' ? 'resolved' : 'dismissed',
          resolution_notes: notes || null,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
      setResolutionNotes('');
      fetchData();
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const handleProductVerification = async (id: string, verify: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_verified: verify })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleProductDeactivation = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: active })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const getReportStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      dismissed: 'bg-gray-100 text-gray-700',
    };
    return <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge>;
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
          <h1 className="text-2xl font-bold text-secondary">Tableau de bord Modérateur</h1>
          <p className="text-muted-foreground">
            Vérifiez les contenus et gérez les signalements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentTab('reports')}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                <Flag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Signalements en attente</p>
                <p className="text-2xl font-bold">{stats.pendingReports}</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentTab('products')}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produits à vérifier</p>
                <p className="text-2xl font-bold">{stats.unverifiedProducts}</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentTab('providers')}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prestataires</p>
                <p className="text-2xl font-bold">{stats.totalProviders}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Signalements résolus</p>
                <p className="text-2xl font-bold">{stats.resolvedReports}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="h-4 w-4" />
              Signalements ({stats.pendingReports})
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produits ({stats.unverifiedProducts})
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-2">
              <Users className="h-4 w-4" />
              Prestataires ({stats.totalProviders})
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Signalements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun signalement
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportsPagination.paginatedItems.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              {format(new Date(report.created_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{report.type}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {report.description || '-'}
                            </TableCell>
                            <TableCell>{getReportStatusBadge(report.status)}</TableCell>
                            <TableCell>
                              {report.status === 'pending' ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="gap-1">
                                      <Eye className="h-4 w-4" />
                                      Traiter
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Traiter le signalement</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-2">Description</p>
                                        <p>{report.description || 'Aucune description'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-2">Notes de résolution</p>
                                        <Textarea
                                          value={resolutionNotes}
                                          onChange={(e) => setResolutionNotes(e.target.value)}
                                          placeholder="Ajoutez vos notes..."
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          className="flex-1 gap-1"
                                          onClick={() => handleReportAction(report.id, 'resolve', resolutionNotes)}
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                          Résoudre
                                        </Button>
                                        <Button
                                          variant="outline"
                                          className="flex-1 gap-1"
                                          onClick={() => handleReportAction(report.id, 'dismiss', resolutionNotes)}
                                        >
                                          <XCircle className="h-4 w-4" />
                                          Rejeter
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <span className="text-sm text-muted-foreground">Traité</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <PaginationControls
                      currentPage={reportsPagination.currentPage}
                      totalPages={reportsPagination.totalPages}
                      startIndex={reportsPagination.startIndex}
                      endIndex={reportsPagination.endIndex}
                      totalItems={reportsPagination.totalItems}
                      onPreviousPage={reportsPagination.goToPreviousPage}
                      onNextPage={reportsPagination.goToNextPage}
                      onGoToPage={reportsPagination.goToPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produits en attente de vérification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun produit à vérifier
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {products.slice(0, 12).map((product) => (
                      <Card key={product.id} className="overflow-hidden">
                        {product.images && product.images.length > 0 && (
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-1">{product.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {product.description || 'Aucune description'}
                          </p>
                          <p className="text-lg font-bold text-primary mb-4">
                            {Number(product.price_per_day).toLocaleString()} FCFA/jour
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => handleProductVerification(product.id, true)}
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Valider
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 gap-1"
                              onClick={() => handleProductDeactivation(product.id, false)}
                            >
                              <ShieldX className="h-4 w-4" />
                              Rejeter
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Profils prestataires
                </CardTitle>
              </CardHeader>
              <CardContent>
                {providers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun prestataire
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prestataire</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Localisation</TableHead>
                          <TableHead>Produits</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providersPagination.paginatedItems.map((provider) => (
                          <TableRow key={provider.user_id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {provider.avatar_url ? (
                                  <img
                                    src={provider.avatar_url}
                                    alt={provider.full_name || ''}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="font-medium">{provider.full_name || 'Non défini'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{provider.phone || '-'}</TableCell>
                            <TableCell>{provider.location || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={provider.hasProducts ? 'default' : 'secondary'}>
                                {provider.productCount} produits
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(provider.created_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <PaginationControls
                      currentPage={providersPagination.currentPage}
                      totalPages={providersPagination.totalPages}
                      startIndex={providersPagination.startIndex}
                      endIndex={providersPagination.endIndex}
                      totalItems={providersPagination.totalItems}
                      onPreviousPage={providersPagination.goToPreviousPage}
                      onNextPage={providersPagination.goToNextPage}
                      onGoToPage={providersPagination.goToPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres du compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Les paramètres du compte modérateur seront disponibles ici.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ModeratorDashboard;
