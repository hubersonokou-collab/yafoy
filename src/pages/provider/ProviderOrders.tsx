import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OrderCard, OrderActions } from '@/components/orders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const ProviderOrders = () => {
  const { user, loading: authLoading, isProvider } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      // Fetch orders with order items and products
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            id,
            product_id,
            quantity,
            price_per_day,
            rental_days,
            subtotal,
            product:products(name, images)
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch client profiles for each order
      const clientIds = [...new Set((ordersData || []).map(o => o.client_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', clientIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, { full_name: p.full_name, phone: p.phone }])
      );

      const ordersWithDetails = (ordersData || []).map(order => ({
        ...order,
        items: order.order_items,
        client: profilesMap.get(order.client_id) || null,
      }));

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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
            <h1 className="text-2xl font-bold text-secondary">Commandes reçues</h1>
            <p className="text-muted-foreground">
              Gérez les réservations de vos clients
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('all')}
          >
            Toutes ({orders.length})
          </Badge>
          <Badge
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            className="cursor-pointer bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            onClick={() => setStatusFilter('pending')}
          >
            En attente ({statusCounts.pending || 0})
          </Badge>
          <Badge
            variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
            className="cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200"
            onClick={() => setStatusFilter('confirmed')}
          >
            Confirmées ({statusCounts.confirmed || 0})
          </Badge>
          <Badge
            variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
            className="cursor-pointer bg-purple-100 text-purple-800 hover:bg-purple-200"
            onClick={() => setStatusFilter('in_progress')}
          >
            En cours ({statusCounts.in_progress || 0})
          </Badge>
          <Badge
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
            onClick={() => setStatusFilter('completed')}
          >
            Terminées ({statusCounts.completed || 0})
          </Badge>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {statusFilter === 'all'
                  ? 'Aucune commande pour le moment'
                  : 'Aucune commande avec ce statut'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order as any}
                showTimeline
                showItems
                actions={
                  <OrderActions
                    orderId={order.id}
                    currentStatus={order.status}
                    isProvider
                    onStatusChange={fetchOrders}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProviderOrders;
