import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ShoppingCart,
  Eye,
  MapPin,
  Phone,
  User,
  Calendar,
  Search,
  LayoutDashboard,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface OrderWithDetails {
  id: string;
  status: string;
  total_amount: number;
  event_date: string | null;
  event_location: string | null;
  notes: string | null;
  created_at: string;
  client?: {
    full_name: string | null;
    phone: string | null;
  };
  provider?: {
    full_name: string | null;
    phone: string | null;
  };
  items?: Array<{
    id: string;
    quantity: number;
    price_per_day: number;
    rental_days: number;
    subtotal: number;
    product?: {
      name: string;
    };
  }>;
}

const SupervisorDashboard = () => {
  const { user, loading: authLoading, isSupervisor, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
  });

  // Tab management with URL params
  const currentTab = searchParams.get('tab') || 'dashboard';
  const setCurrentTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isSupervisor() && !isAdmin() && !isSuperAdmin()) {
      navigate('/');
      return;
    }

    if (user && (isSupervisor() || isAdmin() || isSuperAdmin())) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch profiles and order items for each order
      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Fetch client profile
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('user_id', order.client_id)
            .single();

          // Fetch provider profile
          const { data: providerProfile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('user_id', order.provider_id)
            .single();

          // Fetch order items with products
          const { data: items } = await supabase
            .from('order_items')
            .select('*, product:products(name)')
            .eq('order_id', order.id);

          return {
            ...order,
            client: clientProfile || { full_name: null, phone: null },
            provider: providerProfile || { full_name: null, phone: null },
            items: items || [],
          };
        })
      );

      setOrders(ordersWithDetails);

      // Calculate stats
      setStats({
        total: ordersWithDetails.length,
        pending: ordersWithDetails.filter((o) => o.status === 'pending').length,
        confirmed: ordersWithDetails.filter((o) => o.status === 'confirmed').length,
        inProgress: ordersWithDetails.filter((o) => o.status === 'in_progress').length,
        completed: ordersWithDetails.filter((o) => o.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-warning/20 text-warning-foreground' },
      confirmed: { label: 'Confirmée', className: 'bg-primary/20 text-primary' },
      in_progress: { label: 'En cours', className: 'bg-secondary/20 text-secondary' },
      completed: { label: 'Terminée', className: 'bg-success/20 text-success' },
      cancelled: { label: 'Annulée', className: 'bg-destructive/20 text-destructive' },
    };
    const { label, className } = config[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={className}>{label}</Badge>;
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.client?.full_name?.toLowerCase().includes(searchLower) ||
      order.provider?.full_name?.toLowerCase().includes(searchLower) ||
      order.event_location?.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const ordersPagination = usePagination(filteredOrders, { itemsPerPage: 10 });

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
          <h1 className="text-2xl font-bold text-secondary">Tableau de bord Superviseur</h1>
          <p className="text-muted-foreground">
            Supervisez toutes les commandes et suivez leur progression
          </p>
        </div>

        {/* Stats Cards - clickable */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('orders')}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('orders')}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-warning-foreground">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('orders')}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.confirmed}</p>
              <p className="text-sm text-muted-foreground">Confirmées</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('orders')}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-secondary">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">En cours</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('orders')}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Terminées</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commandes ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Commandes récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{order.client?.full_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setCurrentTab('orders')}
                  >
                    Voir toutes les commandes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Résumé du jour</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Total commandes</span>
                    <span className="font-bold text-lg">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                    <span className="text-warning-foreground">En attente</span>
                    <span className="font-bold text-lg">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                    <span className="text-success">Terminées</span>
                    <span className="font-bold text-lg">{stats.completed}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            {/* Search */}
            <div className="relative max-w-md mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client, prestataire, lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Commandes ({filteredOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune commande trouvée</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Prestataire</TableHead>
                          <TableHead>Événement</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordersPagination.paginatedItems.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {order.client?.full_name || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>{order.provider?.full_name || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {order.event_date && (
                                  <span className="flex items-center gap-1 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(order.event_date), 'dd/MM/yyyy', { locale: fr })}
                                  </span>
                                )}
                                {order.event_location && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {order.event_location}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {Number(order.total_amount).toLocaleString()} FCFA
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => setSelectedOrder(order)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    Détails
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Détails de la commande</DialogTitle>
                                  </DialogHeader>
                                  {selectedOrder && (
                                    <div className="space-y-4">
                                      {/* Client Info */}
                                      <div className="rounded-lg bg-muted p-4">
                                        <h4 className="font-medium mb-2">Client</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {selectedOrder.client?.full_name || 'N/A'}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            {selectedOrder.client?.phone || 'N/A'}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Provider Info */}
                                      <div className="rounded-lg bg-muted p-4">
                                        <h4 className="font-medium mb-2">Prestataire</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {selectedOrder.provider?.full_name || 'N/A'}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            {selectedOrder.provider?.phone || 'N/A'}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Event Info */}
                                      <div className="rounded-lg bg-muted p-4">
                                        <h4 className="font-medium mb-2">Événement</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {selectedOrder.event_date
                                              ? format(new Date(selectedOrder.event_date), 'dd MMMM yyyy', { locale: fr })
                                              : 'Non défini'}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            {selectedOrder.event_location || 'Non défini'}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Order Items */}
                                      {selectedOrder.items && selectedOrder.items.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-2">Articles commandés</h4>
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Produit</TableHead>
                                                <TableHead>Qté</TableHead>
                                                <TableHead>Jours</TableHead>
                                                <TableHead>Sous-total</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {selectedOrder.items.map((item) => (
                                                <TableRow key={item.id}>
                                                  <TableCell>{item.product?.name || 'N/A'}</TableCell>
                                                  <TableCell>{item.quantity}</TableCell>
                                                  <TableCell>{item.rental_days}</TableCell>
                                                  <TableCell>
                                                    {Number(item.subtotal).toLocaleString()} FCFA
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      )}

                                      {/* Notes */}
                                      {selectedOrder.notes && (
                                        <div className="rounded-lg bg-muted p-4">
                                          <h4 className="font-medium mb-2">Notes</h4>
                                          <p className="text-sm">{selectedOrder.notes}</p>
                                        </div>
                                      )}

                                      {/* Total */}
                                      <div className="flex justify-between items-center pt-4 border-t">
                                        <span className="font-medium">Total</span>
                                        <span className="text-xl font-bold">
                                          {Number(selectedOrder.total_amount).toLocaleString()} FCFA
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <PaginationControls
                      currentPage={ordersPagination.currentPage}
                      totalPages={ordersPagination.totalPages}
                      startIndex={ordersPagination.startIndex}
                      endIndex={ordersPagination.endIndex}
                      totalItems={ordersPagination.totalItems}
                      onPreviousPage={ordersPagination.goToPreviousPage}
                      onNextPage={ordersPagination.goToNextPage}
                      onGoToPage={ordersPagination.goToPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SupervisorDashboard;
