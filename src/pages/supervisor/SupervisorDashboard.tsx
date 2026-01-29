import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ClipboardList, Clock, CheckCircle, AlertTriangle, MapPin, Phone, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const SupervisorDashboard = () => {
  const { user, loading, isSupervisor, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && user && !isSupervisor() && !isAdmin() && !isSuperAdmin()) {
      navigate('/');
      return;
    }
  }, [user, loading, navigate, isSupervisor, isAdmin, isSuperAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders with counts
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (orders) {
          setStats({
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            inProgressOrders: orders.filter(o => o.status === 'in_progress' || o.status === 'confirmed').length,
            completedOrders: orders.filter(o => o.status === 'completed').length,
          });
          setRecentOrders(orders.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching supervisor data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (isSupervisor() || isAdmin() || isSuperAdmin())) {
      fetchData();
    }
  }, [user, isSupervisor, isAdmin, isSuperAdmin]);

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">En attente</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmée</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">En cours</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Terminée</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Tableau de bord Superviseur</h1>
          <p className="text-muted-foreground">Supervision des commandes et opérations</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total commandes"
            value={stats.totalOrders.toString()}
            icon={ClipboardList}
            description="Toutes les commandes"
          />
          <StatsCard
            title="En attente"
            value={stats.pendingOrders.toString()}
            icon={Clock}
            description="À traiter"
          />
          <StatsCard
            title="En cours"
            value={stats.inProgressOrders.toString()}
            icon={AlertTriangle}
            description="En progression"
          />
          <StatsCard
            title="Terminées"
            value={stats.completedOrders.toString()}
            icon={CheckCircle}
            description="Complétées"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Commandes récentes</CardTitle>
            <button
              onClick={() => navigate('/supervisor/orders')}
              className="text-sm text-primary hover:underline"
            >
              Voir tout
            </button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune commande
              </p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate('/supervisor/orders')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'PPp', { locale: fr })}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {order.event_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(order.event_date), 'PP', { locale: fr })}
                        </span>
                      )}
                      {order.event_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {order.event_location}
                        </span>
                      )}
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

export default SupervisorDashboard;
