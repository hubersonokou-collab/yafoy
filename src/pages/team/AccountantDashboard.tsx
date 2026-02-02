import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  FileText,
  Download,
  PieChart,
  Percent,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

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
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Tab management with URL params
  const currentTab = searchParams.get('tab') || 'dashboard';
  const setCurrentTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Pagination
  const transactionsPagination = usePagination(transactions, { itemsPerPage: 10 });
  const withdrawalsPagination = usePagination(withdrawals, { itemsPerPage: 10 });

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
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('requested_at', { ascending: false });

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
      pending: 'bg-warning/20 text-warning-foreground',
      completed: 'bg-success/20 text-success',
      success: 'bg-success/20 text-success',
      failed: 'bg-destructive/20 text-destructive',
      rejected: 'bg-destructive/20 text-destructive',
      cancelled: 'bg-muted text-muted-foreground',
    };
    return <Badge className={styles[status] || 'bg-muted text-muted-foreground'}>{status}</Badge>;
  };

  const exportCSV = () => {
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

        {/* Stats Cards - clickable to navigate to tabs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('dashboard')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-success">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FCFA</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('dashboard')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus du jour</p>
                <p className="text-2xl font-bold">{stats.todayRevenue.toLocaleString()} FCFA</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('transactions')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions réussies</p>
                <p className="text-2xl font-bold">{stats.completedTransactions}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('withdrawals')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
                <ArrowDownToLine className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retraits en attente</p>
                <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('reports')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission (5%)</p>
                <p className="text-2xl font-bold">{stats.totalCommission.toLocaleString()} FCFA</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Retraits ({stats.pendingWithdrawals})
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Rapports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
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
                              fill={['hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'][index % 6]}
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
                      <span className="font-bold text-lg text-success">+{stats.totalCommission.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground">Revenus prestataires (95%)</span>
                      <span className="font-bold text-lg">{(stats.totalRevenue - stats.totalCommission).toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/30">
                      <span className="text-warning-foreground">Retraits en attente</span>
                      <span className="font-bold text-lg text-warning-foreground">-{stats.pendingWithdrawalsAmount.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={exportCSV}>
                    <Download className="h-4 w-4" />
                    Exporter en CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Historique des transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune transaction</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Référence</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Méthode</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionsPagination.paginatedItems.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {transaction.reference?.slice(0, 12) || transaction.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.type}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {Number(transaction.amount).toLocaleString()} FCFA
                            </TableCell>
                            <TableCell>{transaction.payment_method || '-'}</TableCell>
                            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <PaginationControls
                      currentPage={transactionsPagination.currentPage}
                      totalPages={transactionsPagination.totalPages}
                      startIndex={transactionsPagination.startIndex}
                      endIndex={transactionsPagination.endIndex}
                      totalItems={transactionsPagination.totalItems}
                      onPreviousPage={transactionsPagination.goToPreviousPage}
                      onNextPage={transactionsPagination.goToNextPage}
                      onGoToPage={transactionsPagination.goToPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de retrait</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune demande de retrait</p>
                ) : (
                  <>
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
                        {withdrawalsPagination.paginatedItems.map((withdrawal) => (
                          <TableRow key={withdrawal.id}>
                            <TableCell>
                              {format(new Date(withdrawal.requested_at), 'dd MMM yyyy HH:mm', { locale: fr })}
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
                                    className="gap-1 text-success hover:bg-success/10"
                                    onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-destructive hover:bg-destructive/10"
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
                    <PaginationControls
                      currentPage={withdrawalsPagination.currentPage}
                      totalPages={withdrawalsPagination.totalPages}
                      startIndex={withdrawalsPagination.startIndex}
                      endIndex={withdrawalsPagination.endIndex}
                      totalItems={withdrawalsPagination.totalItems}
                      onPreviousPage={withdrawalsPagination.goToPreviousPage}
                      onNextPage={withdrawalsPagination.goToNextPage}
                      onGoToPage={withdrawalsPagination.goToPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rapports financiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Rapport des transactions</p>
                      <p className="text-sm text-muted-foreground">Export CSV de toutes les transactions</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={exportCSV}>
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Rapport des commissions</p>
                      <p className="text-sm text-muted-foreground">Total: {stats.totalCommission.toLocaleString()} FCFA</p>
                    </div>
                    <Badge variant="secondary">5%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Rapport des retraits</p>
                      <p className="text-sm text-muted-foreground">{withdrawals.length} demandes au total</p>
                    </div>
                    <Badge variant="outline">{stats.pendingWithdrawals} en attente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
