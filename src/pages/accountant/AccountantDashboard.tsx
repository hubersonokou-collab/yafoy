import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, DollarSign, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AccountantDashboard = () => {
  const { user, loading, isAccountant, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsCount: 0,
    completedTransactions: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && user && !isAccountant() && !isAdmin() && !isSuperAdmin()) {
      navigate('/');
      return;
    }
  }, [user, loading, navigate, isAccountant, isAdmin, isSuperAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders for revenue calculation
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, status');
        
        const completedOrders = orders?.filter(o => o.status === 'completed') || [];
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        
        // Fetch pending withdrawals
        const { data: withdrawals, count: withdrawalsCount } = await supabase
          .from('withdrawals')
          .select('amount', { count: 'exact' })
          .eq('status', 'pending');
        
        const pendingWithdrawals = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
        
        // Fetch transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        const completedTransactions = transactions?.filter(t => t.status === 'completed').length || 0;

        setStats({
          totalRevenue,
          totalCommissions: totalRevenue * 0.1, // 10% commission assumption
          pendingWithdrawals,
          pendingWithdrawalsCount: withdrawalsCount || 0,
          completedTransactions,
        });
        
        setRecentTransactions(transactions || []);
      } catch (error) {
        console.error('Error fetching accountant data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (isAccountant() || isAdmin() || isSuperAdmin())) {
      fetchData();
    }
  }, [user, isAccountant, isAdmin, isSuperAdmin]);

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Tableau de bord Comptable</h1>
          <p className="text-muted-foreground">Vue d'ensemble financière de la plateforme</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Revenus totaux"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            description="Montant total des commandes complétées"
          />
          <StatsCard
            title="Commissions"
            value={formatCurrency(stats.totalCommissions)}
            icon={TrendingUp}
            description="10% des revenus totaux"
          />
          <StatsCard
            title="Retraits en attente"
            value={formatCurrency(stats.pendingWithdrawals)}
            icon={Wallet}
            description={`${stats.pendingWithdrawalsCount} demande(s)`}
          />
          <StatsCard
            title="Transactions"
            value={stats.completedTransactions.toString()}
            icon={CreditCard}
            description="Transactions complétées"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                Transactions récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune transaction enregistrée
                </p>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        {transaction.type === 'payment' ? (
                          <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-amber-500" />
                        )}
                        <div>
                          <p className="font-medium capitalize">{transaction.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.type === 'payment' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {transaction.type === 'payment' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          transaction.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          transaction.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => navigate('/accountant/transactions')}
                className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">Voir toutes les transactions</p>
                <p className="text-sm text-muted-foreground">Historique complet des paiements</p>
              </button>
              <button
                onClick={() => navigate('/accountant/withdrawals')}
                className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">Gérer les retraits</p>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingWithdrawalsCount} demande(s) en attente
                </p>
              </button>
              <button
                onClick={() => navigate('/accountant/reports')}
                className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">Rapports financiers</p>
                <p className="text-sm text-muted-foreground">Générer et exporter des rapports</p>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
