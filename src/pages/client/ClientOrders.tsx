import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OrderCard, OrderTimeline } from '@/components/orders';
import { ReviewForm } from '@/components/reviews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ShoppingCart, Star } from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const ClientOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch already reviewed orders
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('order_id')
        .eq('client_id', user.id);

      if (reviewsData) {
        setReviewedOrders(new Set(reviewsData.map((r) => r.order_id)));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    if (selectedOrderForReview) {
      setReviewedOrders((prev) => new Set([...prev, selectedOrderForReview.id]));
    }
    setSelectedOrderForReview(null);
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
          <h1 className="text-2xl font-bold text-secondary">Mes commandes</h1>
          <p className="text-muted-foreground">Suivez l'état de vos réservations</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Vous n'avez pas encore de commandes</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => navigate('/client/catalog')}
              >
                Découvrir le catalogue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const canReview =
                order.status === 'completed' && !reviewedOrders.has(order.id);

              return (
                <OrderCard
                  key={order.id}
                  order={order as { id: string; status: OrderStatus; total_amount: number; deposit_paid?: number | null; event_date?: string | null; event_location?: string | null; notes?: string | null; created_at: string }}
                  showTimeline
                  actions={
                    canReview ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrderForReview(order)}
                        className="gap-2"
                      >
                        <Star className="h-4 w-4" />
                        Laisser un avis
                      </Button>
                    ) : reviewedOrders.has(order.id) ? (
                      <Badge variant="secondary" className="text-success">
                        <Star className="mr-1 h-3 w-3" />
                        Avis envoyé
                      </Badge>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedOrderForReview}
        onOpenChange={() => setSelectedOrderForReview(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Laisser un avis</DialogTitle>
          </DialogHeader>
          {selectedOrderForReview && (
            <ReviewForm
              orderId={selectedOrderForReview.id}
              providerId={selectedOrderForReview.provider_id}
              onSuccess={handleReviewSuccess}
              onCancel={() => setSelectedOrderForReview(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientOrders;
