import { Calendar, MapPin, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderTimeline } from './OrderTimeline';

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface OrderCardProps {
  order: {
    id: string;
    status: OrderStatus;
    total_amount: number;
    deposit_paid?: number | null;
    event_date?: string | null;
    event_location?: string | null;
    notes?: string | null;
    created_at: string;
  };
  showTimeline?: boolean;
  actions?: React.ReactNode;
  onClick?: () => void;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'En cours', className: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
};

export const OrderCard = ({ order, showTimeline = false, actions, onClick }: OrderCardProps) => {
  const config = statusConfig[order.status] || statusConfig.pending;

  return (
    <Card
      className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Commande #{order.id.slice(0, 8)}</p>
                <Badge className={config.className}>{config.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Créée le{' '}
                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">
                {Number(order.total_amount).toLocaleString()} FCFA
              </p>
              {order.deposit_paid && order.deposit_paid > 0 && (
                <p className="text-xs text-muted-foreground">
                  Caution: {Number(order.deposit_paid).toLocaleString()} FCFA
                </p>
              )}
            </div>
          </div>

          {/* Event info */}
          {(order.event_date || order.event_location) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {order.event_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(order.event_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {order.event_location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{order.event_location}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="rounded bg-muted p-3">
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Timeline */}
          {showTimeline && (
            <div className="pt-2">
              <OrderTimeline status={order.status} compact />
            </div>
          )}

          {/* Actions */}
          {actions && <div className="flex justify-end gap-2 pt-2 border-t">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  );
};
