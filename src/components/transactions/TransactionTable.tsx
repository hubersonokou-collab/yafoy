import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transaction {
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
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export const TransactionTable = ({ transactions }: TransactionTableProps) => {
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
    if (!method) return '-';
    const methods: Record<string, string> = {
      card: 'Carte',
      bank: 'Virement',
      mobile_money: 'Mobile Money',
      ussd: 'USSD',
    };
    return methods[method] || method;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      payment: 'Paiement',
      refund: 'Remboursement',
      commission: 'Commission',
    };
    return types[type] || type;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Référence</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Méthode</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Aucune transaction trouvée
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-mono text-sm">
                  {transaction.reference?.slice(0, 16) || transaction.id.slice(0, 8)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {transaction.description || '-'}
                </TableCell>
                <TableCell>{getTypeLabel(transaction.type)}</TableCell>
                <TableCell>{getPaymentMethodLabel(transaction.payment_method)}</TableCell>
                <TableCell className="font-medium">
                  {Number(transaction.amount).toLocaleString()} FCFA
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(transaction.created_at), 'dd/MM/yy HH:mm', { locale: fr })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
