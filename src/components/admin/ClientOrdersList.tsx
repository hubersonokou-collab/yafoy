import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag } from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  event_date: string | null;
}

interface ClientOrdersListProps {
  orders: Order[];
  loading?: boolean;
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; className: string }> = {
    pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'En cours', className: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
  };
  return configs[status] || { label: status, className: '' };
};

export const ClientOrdersList = ({ orders, loading }: ClientOrdersListProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucune commande</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {orders.map((order) => {
        const statusConfig = getStatusConfig(order.status);
        return (
          <div
            key={order.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div>
              <p className="font-medium text-sm">
                {order.total_amount.toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {order.event_date && (
                <span className="text-xs text-muted-foreground">
                  Événement: {new Date(order.event_date).toLocaleDateString('fr-FR')}
                </span>
              )}
              <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};
