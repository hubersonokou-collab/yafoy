import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Download, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const AccountantReports = () => {
  const { user, loading, isAccountant, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('current_month');
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    totalWithdrawals: 0,
    completedOrders: 0,
    pendingOrders: 0,
  });

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
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        let startDate: Date;
        let endDate: Date = new Date();

        switch (period) {
          case 'last_month':
            startDate = startOfMonth(subMonths(new Date(), 1));
            endDate = endOfMonth(subMonths(new Date(), 1));
            break;
          case 'last_3_months':
            startDate = startOfMonth(subMonths(new Date(), 3));
            break;
          case 'last_6_months':
            startDate = startOfMonth(subMonths(new Date(), 6));
            break;
          case 'last_year':
            startDate = startOfMonth(subMonths(new Date(), 12));
            break;
          default: // current_month
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
        }

        // Fetch orders
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, status, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        const completedOrders = orders?.filter(o => o.status === 'completed') || [];
        const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

        // Fetch withdrawals
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('amount, status')
          .eq('status', 'completed')
          .gte('requested_at', startDate.toISOString())
          .lte('requested_at', endDate.toISOString());

        const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

        setReportData({
          totalRevenue,
          totalCommissions: totalRevenue * 0.1,
          totalWithdrawals,
          completedOrders: completedOrders.length,
          pendingOrders: pendingOrders.length,
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (isAccountant() || isAdmin() || isSuperAdmin())) {
      fetchReportData();
    }
  }, [user, period, isAccountant, isAdmin, isSuperAdmin]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const handleExport = () => {
    const csvContent = `Rapport Financier YAFOY
Période: ${period}
Date de génération: ${format(new Date(), 'PPP', { locale: fr })}

Revenus totaux: ${formatCurrency(reportData.totalRevenue)}
Commissions (10%): ${formatCurrency(reportData.totalCommissions)}
Retraits effectués: ${formatCurrency(reportData.totalWithdrawals)}
Commandes complétées: ${reportData.completedOrders}
Commandes en attente: ${reportData.pendingOrders}
`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-financier-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Rapports Financiers</h1>
            <p className="text-muted-foreground">Générer et exporter des rapports</p>
          </div>
          <div className="flex gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Ce mois</SelectItem>
                <SelectItem value="last_month">Mois dernier</SelectItem>
                <SelectItem value="last_3_months">3 derniers mois</SelectItem>
                <SelectItem value="last_6_months">6 derniers mois</SelectItem>
                <SelectItem value="last_year">Dernière année</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Revenus totaux</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">
                {formatCurrency(reportData.totalRevenue)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{reportData.completedOrders} commandes complétées</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Commissions (10%)</CardDescription>
              <CardTitle className="text-3xl text-primary">
                {formatCurrency(reportData.totalCommissions)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Marge de la plateforme</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Retraits effectués</CardDescription>
              <CardTitle className="text-3xl text-amber-600">
                {formatCurrency(reportData.totalWithdrawals)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Versés aux prestataires</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Résumé des commandes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-medium text-emerald-700">Commandes complétées</span>
                <span className="text-2xl font-bold text-emerald-600">{reportData.completedOrders}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-medium text-amber-700">Commandes en attente</span>
                <span className="text-2xl font-bold text-amber-600">{reportData.pendingOrders}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Balance nette</p>
                <p className="text-3xl font-bold text-secondary">
                  {formatCurrency(reportData.totalCommissions - reportData.totalWithdrawals)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Commissions - Retraits
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountantReports;
