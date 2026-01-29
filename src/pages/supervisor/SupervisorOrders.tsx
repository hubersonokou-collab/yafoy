import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, MapPin, Phone, User, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OrderWithDetails {
  id: string;
  status: string;
  total_amount: number;
  event_date: string | null;
  event_location: string | null;
  notes: string | null;
  created_at: string;
  client_id: string;
  provider_id: string;
}

const SupervisorOrders = () => {
  const { user, loading, isSupervisor, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; phone: string | null }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

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
    const fetchOrders = async () => {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // Fetch profiles for clients and providers
        const userIds = new Set<string>();
        ordersData?.forEach(order => {
          userIds.add(order.client_id);
          userIds.add(order.provider_id);
        });

        if (userIds.size > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, phone')
            .in('user_id', Array.from(userIds));

          const profilesMap: Record<string, { full_name: string | null; phone: string | null }> = {};
          profilesData?.forEach(p => {
            profilesMap[p.user_id] = { full_name: p.full_name, phone: p.phone };
          });
          setProfiles(profilesMap);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (isSupervisor() || isAdmin() || isSuperAdmin())) {
      fetchOrders();
    }
  }, [user, isSupervisor, isAdmin, isSuperAdmin]);

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

  const filteredOrders = orders.filter(order => {
    const clientName = profiles[order.client_id]?.full_name?.toLowerCase() || '';
    const providerName = profiles[order.provider_id]?.full_name?.toLowerCase() || '';
    const location = order.event_location?.toLowerCase() || '';
    const matchesSearch = clientName.includes(searchTerm.toLowerCase()) ||
      providerName.includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold text-secondary">Toutes les commandes</h1>
          <p className="text-muted-foreground">Supervision des commandes avec détails clients et prestataires</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Liste des commandes ({filteredOrders.length})</CardTitle>
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune commande trouvée
              </p>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{formatCurrency(order.total_amount)}</p>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4 text-blue-500" />
                            <span>Client: {profiles[order.client_id]?.full_name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Package className="h-4 w-4 text-primary" />
                            <span>Prestataire: {profiles[order.provider_id]?.full_name || 'N/A'}</span>
                          </div>
                          {order.event_location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 text-emerald-500" />
                              <span>{order.event_location}</span>
                            </div>
                          )}
                          {order.event_date && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 text-amber-500" />
                              <span>{format(new Date(order.event_date), 'PP', { locale: fr })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Créée le</p>
                        <p>{format(new Date(order.created_at), 'PPp', { locale: fr })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground">Client</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profiles[selectedOrder.client_id]?.full_name || 'Non renseigné'}</span>
                  </div>
                  {profiles[selectedOrder.client_id]?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${profiles[selectedOrder.client_id]?.phone}`} className="text-primary hover:underline">
                        {profiles[selectedOrder.client_id]?.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground">Prestataire</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profiles[selectedOrder.provider_id]?.full_name || 'Non renseigné'}</span>
                  </div>
                  {profiles[selectedOrder.provider_id]?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${profiles[selectedOrder.provider_id]?.phone}`} className="text-primary hover:underline">
                        {profiles[selectedOrder.provider_id]?.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedOrder.event_date && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Date événement</p>
                    <p className="font-medium">{format(new Date(selectedOrder.event_date), 'PP', { locale: fr })}</p>
                  </div>
                )}
                {selectedOrder.event_location && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Lieu</p>
                    <p className="font-medium">{selectedOrder.event_location}</p>
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SupervisorOrders;
