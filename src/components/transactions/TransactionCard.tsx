import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Calendar, User, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TransactionCardProps {
  transaction: {
    id: string;
    reference: string | null;
    amount: number;
    status: string;
    type: string;
    payment_method: string | null;
    created_at: string;
    processed_at: string | null;
    description: string | null;
    order_id: string | null;
  };
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      success: { label: 'Réussi', className: 'bg-success text-success-foreground' },
      completed: { label: 'Réussi', className: 'bg-success text-success-foreground' },
      pending: { label: 'En attente', className: 'bg-warning text-warning-foreground' },
      failed: { label: 'Échoué', className: 'bg-destructive text-destructive-foreground' },
      cancelled: { label: 'Annulé', className: 'bg-muted text-muted-foreground' },
    };
    const { label, className } = config[status] || { label: status, className: 'bg-muted' };
    return <Badge className={className}>{label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return 'N/A';
    const methods: Record<string, string> = {
      card: 'Carte',
      bank: 'Virement',
      mobile_money: 'Mobile Money',
      ussd: 'USSD',
    };
    return methods[method] || method;
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Reference & Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-medium text-secondary truncate">
                {transaction.reference?.slice(0, 20) || transaction.id.slice(0, 8)}
              </span>
              {getStatusBadge(transaction.status)}
            </div>

            {/* Description */}
            {transaction.description && (
              <p className="text-sm text-muted-foreground truncate">
                {transaction.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
              </span>
              {transaction.payment_method && (
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {getPaymentMethodLabel(transaction.payment_method)}
                </span>
              )}
              {transaction.order_id && (
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  #{transaction.order_id.slice(0, 8)}
                </span>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <p className={`text-lg font-bold ${(transaction.status === 'success' || transaction.status === 'completed') ? 'text-success' : 'text-secondary'}`}>
              {Number(transaction.amount).toLocaleString()} FCFA
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {transaction.type === 'payment' ? 'Paiement' : transaction.type}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
