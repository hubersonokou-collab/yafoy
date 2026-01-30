import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProviderEarningsStats } from '@/components/provider/ProviderEarningsStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, ShoppingCart, TrendingUp, Plus, Eye, Edit, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProviderDashboard = () => {
  const { user, loading: authLoading, isProvider } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    netRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isProvider()) {
      navigate('/');
      return;
    }

    if (user && isProvider()) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      const prods = productsData || [];
      setProducts(prods.slice(0, 5));

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      const orders = ordersData || [];
      setRecentOrders(orders.slice(0, 5));
      setAllOrders(orders);

      const pendingOrders = orders.filter((o) => o.status === 'pending').length;
      const revenue = orders
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);
      
      // Calculate net revenue (after 5% commission)
      const netRevenue = Math.round(revenue * 0.95);

      setStats({
        totalProducts: prods.length,
        activeProducts: prods.filter((p) => p.is_active).length,
        totalOrders: orders.length,
        pendingOrders,
        revenue,
        netRevenue,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Tableau de bord</h1>
            <p className="text-muted-foreground">Gérez vos produits et commandes</p>
          </div>
          <Link to="/provider/products/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview" className="gap-2">
              <Package className="h-4 w-4" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Mes gains
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total produits"
                value={stats.totalProducts}
                icon={Package}
              />
              <StatsCard
                title="Produits actifs"
                value={stats.activeProducts}
                icon={Package}
              />
              <StatsCard
                title="Commandes en attente"
                value={stats.pendingOrders}
                icon={ShoppingCart}
              />
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gains nets</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">
                        {stats.netRevenue.toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground">Après 5% de commission</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Orders */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Commandes récentes</CardTitle>
                  <Link to="/provider/orders">
                    <Button variant="outline" size="sm">Voir tout</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <ShoppingCart className="mb-2 h-12 w-12" />
                      <p>Aucune commande pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => {
                        const netAmount = Math.round(Number(order.total_amount) * 0.95);
                        return (
                          <div
                            key={order.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div>
                              <p className="font-medium">#{order.id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="font-medium text-green-600">{netAmount.toLocaleString()} FCFA</span>
                                <p className="text-xs text-muted-foreground line-through">
                                  {Number(order.total_amount).toLocaleString()} FCFA
                                </p>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Products */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Mes produits</CardTitle>
                  <Link to="/provider/products">
                    <Button variant="outline" size="sm">Voir tout</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Package className="mb-2 h-12 w-12" />
                      <p>Aucun produit ajouté</p>
                      <Link to="/provider/products/new">
                        <Button variant="link" className="mt-2">
                          Ajouter votre premier produit
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {Number(product.price_per_day).toLocaleString()} FCFA/jour
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {product.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Actif</Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <ProviderEarningsStats orders={allOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProviderDashboard;
