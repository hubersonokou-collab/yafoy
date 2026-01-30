import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TransactionCard, TransactionTable, TransactionStats } from '@/components/transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Receipt, Download, Filter } from 'lucide-react';
import { format, subDays, startOfDay, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

type Transaction = {
  id: string;
  order_id: string | null;
  provider_id: string | null;
  type: string;
  amount: number;
  status: string;
  payment_method: string | null;
  reference: string | null;
  description: string | null;
  created_at: string;
  processed_at: string | null;
};

const AdminTransactions = () => {
  const { user, loading: authLoading, isSuperAdmin, isAdmin, isAccountant } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isSuperAdmin() && !isAdmin() && !isAccountant()) {
      navigate('/');
      return;
    }

    if (user && (isSuperAdmin() || isAdmin() || isAccountant())) {
      fetchTransactions();
    }
  }, [user, authLoading, navigate]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // Payment method filter
      if (methodFilter !== 'all' && t.payment_method !== methodFilter) return false;

      // Period filter
      if (periodFilter !== 'all') {
        const transactionDate = parseISO(t.created_at);
        const now = new Date();

        switch (periodFilter) {
          case 'today':
            if (!isToday(transactionDate)) return false;
            break;
          case 'week':
            if (transactionDate < subDays(startOfDay(now), 7)) return false;
            break;
          case 'month':
            if (transactionDate < subDays(startOfDay(now), 30)) return false;
            break;
        }
      }

      return true;
    });
  }, [transactions, statusFilter, periodFilter, methodFilter]);

  // Calculate stats with commission (5%)
  const stats = useMemo(() => {
    const successfulTransactions = transactions.filter((t) => t.status === 'success' || t.status === 'completed');
    const todayTransactions = transactions.filter((t) => isToday(parseISO(t.created_at)));
    const todaySuccessful = todayTransactions.filter((t) => t.status === 'success' || t.status === 'completed');

    const totalRevenue = successfulTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const todayRevenue = todaySuccessful.reduce((sum, t) => sum + Number(t.amount), 0);

    // Commission is 5% of total amount
    const totalCommission = Math.round(totalRevenue * 0.05);
    const todayCommission = Math.round(todayRevenue * 0.05);

    return {
      totalRevenue,
      totalTransactions: transactions.length,
      successRate: transactions.length > 0
        ? (successfulTransactions.length / transactions.length) * 100
        : 0,
      averageAmount: successfulTransactions.length > 0
        ? totalRevenue / successfulTransactions.length
        : 0,
      todayRevenue,
      todayCount: todayTransactions.length,
      pendingCount: transactions.filter((t) => t.status === 'pending').length,
      failedCount: transactions.filter((t) => t.status === 'failed').length,
      totalCommission,
      todayCommission,
    };
  }, [transactions]);

  // Revenue data for chart (last 30 days)
  const revenueData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'dd/MM', { locale: fr }),
        fullDate: format(date, 'yyyy-MM-dd'),
        amount: 0,
      };
    });

    transactions
      .filter((t) => t.status === 'success' || t.status === 'completed')
      .forEach((t) => {
        const txDate = format(parseISO(t.created_at), 'yyyy-MM-dd');
        const dayData = last30Days.find((d) => d.fullDate === txDate);
        if (dayData) {
          dayData.amount += Number(t.amount);
        }
      });

    return last30Days.map(({ date, amount }) => ({ date, amount }));
  }, [transactions]);

  // Payment method data for pie chart - with detailed mobile money providers
  const paymentMethodData = useMemo(() => {
    const methodCounts: Record<string, number> = {};
    
    transactions
      .filter((t) => (t.status === 'success' || t.status === 'completed') && t.payment_method)
      .forEach((t) => {
        const method = t.payment_method || 'unknown';
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      });

    const totalCount = Object.values(methodCounts).reduce((sum, count) => sum + count, 0);

    const colors: Record<string, string> = {
      card: 'hsl(var(--primary))',
      mobile_money: 'hsl(var(--success))',
      orange_money: '#FF6B00', // Orange Money brand color
      mtn_money: '#FFCC00', // MTN brand color  
      wave: '#1A8FE3', // Wave brand color
      moov_money: '#00A651', // Moov Money brand color
      bank: 'hsl(var(--accent))',
      ussd: 'hsl(var(--warning))',
      unknown: 'hsl(var(--muted))',
    };

    const labels: Record<string, string> = {
      card: 'Carte bancaire',
      mobile_money: 'Mobile Money',
      orange_money: 'Orange Money',
      mtn_money: 'MTN Mobile Money',
      wave: 'Wave',
      moov_money: 'Moov Money',
      bank: 'Virement bancaire',
      ussd: 'USSD',
      unknown: 'Autre',
    };

    return Object.entries(methodCounts).map(([method, value]) => {
      const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
      return {
        name: labels[method] || method,
        value,
        percentage,
        color: colors[method] || 'hsl(var(--muted))',
      };
    });
  }, [transactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Référence', 'Description', 'Type', 'Méthode', 'Montant', 'Statut', 'Date'];
    const rows = filteredTransactions.map((t) => [
      t.reference || t.id,
      t.description || '',
      t.type,
      t.payment_method || '',
      t.amount,
      t.status,
      format(parseISO(t.created_at), 'dd/MM/yyyy HH:mm'),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Transactions</h1>
            <p className="text-muted-foreground">
              Historique et statistiques des paiements
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Stats Section */}
        <TransactionStats
          stats={stats}
          revenueData={revenueData}
          paymentMethodData={paymentMethodData}
        />

        {/* Transactions List */}
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Historique des transactions
            </CardTitle>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="success">Réussi</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">7 jours</SelectItem>
                  <SelectItem value="month">30 jours</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="mtn_money">MTN Money</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="moov_money">Moov Money</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank">Virement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile: Cards, Desktop: Table */}
            {isMobile ? (
              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Receipt className="mb-2 h-12 w-12" />
                    <p>Aucune transaction trouvée</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TransactionCard key={transaction.id} transaction={transaction} />
                  ))
                )}
              </div>
            ) : (
              <TransactionTable transactions={filteredTransactions} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminTransactions;
