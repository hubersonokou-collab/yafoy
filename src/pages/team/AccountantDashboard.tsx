import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Loader2,
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowDownToLine,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  PieChart,
  Percent,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  payment_method: string | null;
  description: string | null;
  reference: string | null;
  created_at: string;
}

interface Withdrawal {
  id: string;
  provider_id: string;
  amount: number;
  status: string;
  payment_method: string;
  requested_at: string;
  notes: string | null;
}

const AccountantDashboard = () => {
  const { user, loading: authLoading, isAccountant, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingWithdrawals: 0,
    completedTransactions: 0,
    todayRevenue: 0,
    totalCommission: 0,
    pendingWithdrawalsAmount: 0,
  });
  const [paymentMethodsData, setPaymentMethodsData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isAccountant() && !isAdmin() && !isSuperAdmin()) {
      navigate('/');
      return;
    }

    if (user && (isAccountant() || isAdmin() || isSuperAdmin())) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(50);

      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = (transactionsData || []).filter(
        (t) => t.created_at.startsWith(today) && (t.status === 'completed' || t.status === 'success')
      );

      const completedPayments = (transactionsData || [])
        .filter((t) => (t.status === 'completed' || t.status === 'success') && t.type === 'payment');
      
      const totalRevenue = completedPayments.reduce((sum, t) => sum + Number(t.amount), 0);
      const commissionRate = 0.05; // 5% commission

      // Calculate payment methods distribution
      const methodCounts: Record<string, number> = {};
      completedPayments.forEach((t) => {
        const method = t.payment_method || 'Autre';
        methodCounts[method] = (methodCounts[method] || 0) + Number(t.amount);
      });
      setPaymentMethodsData(
        Object.entries(methodCounts).map(([name, value]) => ({ name, value }))
      );

      const pendingWithdrawalsAmount = (withdrawalsData || [])
        .filter((w) => w.status === 'pending')
        .reduce((sum, w) => sum + Number(w.amount), 0);

      setStats({
        totalRevenue,
        pendingWithdrawals: (withdrawalsData || []).filter((w) => w.status === 'pending').length,
        completedTransactions: (transactionsData || []).filter((t) => t.status === 'completed' || t.status === 'success').length,
        todayRevenue: todayTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
        totalCommission: Math.round(totalRevenue * commissionRate),
        pendingWithdrawalsAmount,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: action === 'approve' ? 'completed' : 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge>;
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
          <h1 className="text-2xl font-bold text-secondary">Tableau de bord Comptable</h1>
          <p className="text-muted-foreground">
            Gérez les transactions et les retraits des prestataires
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FCFA</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus du jour</p>
                <p className="text-2xl font-bold">{stats.todayRevenue.toLocaleString()} FCFA</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions réussies</p>
                <p className="text-2xl font-bold">{stats.completedTransactions}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <ArrowDownToLine className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retraits en attente</p>
                <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission (5%)</p>
                <p className="text-2xl font-bold">{stats.totalCommission.toLocaleString()} FCFA</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Reports Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Répartition par méthode de paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethodsData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie>
                    <Pie
                      data={paymentMethodsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {paymentMethodsData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'][index % 6]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapport financier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Revenus totaux</span>
                  <span className="font-bold text-lg">{stats.totalRevenue.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Commission plateforme (5%)</span>
                  <span className="font-bold text-lg text-emerald-600">+{stats.totalCommission.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Revenus prestataires (95%)</span>
                  <span className="font-bold text-lg">{(stats.totalRevenue - stats.totalCommission).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-orange-700">Retraits en attente</span>
                  <span className="font-bold text-lg text-orange-600">-{stats.pendingWithdrawalsAmount.toLocaleString()} FCFA</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  const csvContent = [
                    'Date,Type,Montant,Méthode,Statut,Référence',
                    ...transactions.map((t) =>
                      `${format(new Date(t.created_at), 'dd/MM/yyyy HH:mm')},${t.type},${t.amount},${t.payment_method || '-'},${t.status},${t.reference || '-'}`
                    ),
                  ].join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `rapport-financier-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                  link.click();
                }}
              >
                <Download className="h-4 w-4" />
                Exporter en CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Transactions and Withdrawals */}
        <Tabs defaultValue="withdrawals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="withdrawals" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Retraits ({stats.pendingWithdrawals} en attente)
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de retrait</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune demande de retrait
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>
                            {format(new Date(withdrawal.requested_at), 'dd MMM yyyy HH:mm', {
                              locale: fr,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {Number(withdrawal.amount).toLocaleString()} FCFA
                          </TableCell>
                          <TableCell>{withdrawal.payment_method}</TableCell>
                          <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                          <TableCell>
                            {withdrawal.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-green-600 hover:bg-green-50"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-red-600 hover:bg-red-50"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Rejeter
                                </Button>
                              </div>
                            )}
                            {withdrawal.status !== 'pending' && (
                              <span className="text-sm text-muted-foreground">Traité</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Historique des transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune transaction
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Référence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', {
                              locale: fr,
                            })}
                          </TableCell>
                          <TableCell>{transaction.type}</TableCell>
                          <TableCell className="font-medium">
                            {Number(transaction.amount).toLocaleString()} FCFA
                          </TableCell>
                          <TableCell>{transaction.payment_method || '-'}</TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {transaction.reference || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
