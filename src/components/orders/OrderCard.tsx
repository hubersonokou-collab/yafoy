import { Calendar, MapPin, Package, Clock, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderTimeline } from './OrderTimeline';
import { Separator } from '@/components/ui/separator';

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_day: number;
  rental_days: number;
  subtotal: number;
  product?: {
    name: string;
    images?: string[];
  };
}

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
    items?: OrderItem[];
    client?: {
      full_name?: string | null;
      phone?: string | null;
    };
  };
  showTimeline?: boolean;
  showItems?: boolean;
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

export const OrderCard = ({ order, showTimeline = false, showItems = false, actions, onClick }: OrderCardProps) => {
  const config = statusConfig[order.status] || statusConfig.pending;
  const orderDate = new Date(order.created_at);

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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {orderDate.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <Clock className="h-3.5 w-3.5 ml-2" />
                <span>
                  {orderDate.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {order.client?.full_name && (
                <p className="text-sm text-muted-foreground">
                  Client: <span className="font-medium text-foreground">{order.client.full_name}</span>
                  {order.client.phone && ` • ${order.client.phone}`}
                </p>
              )}
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
                    Événement: {new Date(order.event_date).toLocaleDateString('fr-FR', {
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

          {/* Order Items */}
          {showItems && order.items && order.items.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Articles commandés ({order.items.length})</span>
                </div>
                <div className="space-y-2 pl-6">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="flex items-center gap-3">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product?.name || 'Produit'}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {item.product?.name || 'Produit'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {Number(item.price_per_day).toLocaleString()} FCFA/jour × {item.rental_days} jour(s)
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">
                        {Number(item.subtotal).toLocaleString()} FCFA
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
