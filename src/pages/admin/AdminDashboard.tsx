import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Package, ShoppingCart, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
}

const AdminDashboard = () => {
  const { user, loading: authLoading, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProviders: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isSuperAdmin() && !isAdmin()) {
      navigate('/');
      return;
    }

    if (user && (isSuperAdmin() || isAdmin())) {
      fetchDashboardData();
    }
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats in parallel
      const [usersResult, providersResult, productsResult, ordersResult] = await Promise.all([
        supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'client'),
        supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'provider'),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders').select('*'),
      ]);

      const orders = ordersResult.data || [];
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const revenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      setStats({
        totalUsers: usersResult.count || 0,
        totalProviders: providersResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalOrders: orders.length,
        pendingOrders,
        revenue,
      });

      // Get recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(recent || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      confirmed: { label: 'Confirmée', variant: 'default' },
      in_progress: { label: 'En cours', variant: 'outline' },
      completed: { label: 'Terminée', variant: 'default' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
          <h1 className="text-2xl font-bold text-secondary">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la plateforme YAFOY</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Clients"
            value={stats.totalUsers}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Prestataires"
            value={stats.totalProviders}
            icon={Users}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Produits"
            value={stats.totalProducts}
            icon={Package}
            trend={{ value: 24, isPositive: true }}
          />
          <StatsCard
            title="Revenus"
            value={`${stats.revenue.toLocaleString()} FCFA`}
            icon={TrendingUp}
            trend={{ value: 18, isPositive: true }}
          />
        </div>

        {/* Orders Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                <p className="text-sm text-muted-foreground">Commandes en attente</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalOrders - stats.pendingOrders}</p>
                <p className="text-sm text-muted-foreground">Commandes traitées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-sm text-muted-foreground">Total commandes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Commandes récentes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShoppingCart className="mb-2 h-12 w-12" />
                <p>Aucune commande pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">Commande #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium">{Number(order.total_amount).toLocaleString()} FCFA</p>
                      {getStatusBadge(order.status)}
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

export default AdminDashboard;
