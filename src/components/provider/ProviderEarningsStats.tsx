import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format, subDays, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Order {
  id: string;
  total_amount: number;
  deposit_paid: number | null;
  status: string;
  created_at: string;
}

interface ProviderEarningsStatsProps {
  orders: Order[];
}

const COMMISSION_RATE = 0.05; // 5% commission

export const ProviderEarningsStats = ({ orders }: ProviderEarningsStatsProps) => {
  // Calculate earnings statistics
  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'in_progress');
    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    // Total gross revenue (before commission)
    const grossRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    // Commission deducted (5%)
    const totalCommission = Math.round(grossRevenue * COMMISSION_RATE);
    
    // Net earnings (what provider actually receives)
    const netEarnings = grossRevenue - totalCommission;
    
    // Pending earnings (from confirmed/in_progress orders)
    const pendingEarnings = confirmedOrders.reduce((sum, o) => {
      const amount = Number(o.total_amount);
      return sum + Math.round(amount * (1 - COMMISSION_RATE));
    }, 0);
    
    // Today's earnings
    const todayCompleted = completedOrders.filter(o => isToday(parseISO(o.created_at)));
    const todayGross = todayCompleted.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const todayNet = Math.round(todayGross * (1 - COMMISSION_RATE));
    
    // This week's earnings
    const weekCompleted = completedOrders.filter(o => isThisWeek(parseISO(o.created_at), { locale: fr }));
    const weekGross = weekCompleted.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const weekNet = Math.round(weekGross * (1 - COMMISSION_RATE));
    
    // This month's earnings
    const monthCompleted = completedOrders.filter(o => isThisMonth(parseISO(o.created_at)));
    const monthGross = monthCompleted.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const monthNet = Math.round(monthGross * (1 - COMMISSION_RATE));
    
    // Average order value
    const avgOrderValue = completedOrders.length > 0 
      ? Math.round(grossRevenue / completedOrders.length) 
      : 0;
    
    // Conversion rate (completed / total orders)
    const conversionRate = orders.length > 0 
      ? Math.round((completedOrders.length / orders.length) * 100) 
      : 0;

    return {
      grossRevenue,
      totalCommission,
      netEarnings,
      pendingEarnings,
      todayNet,
      weekNet,
      monthNet,
      avgOrderValue,
      conversionRate,
      completedCount: completedOrders.length,
      pendingCount: pendingOrders.length,
      confirmedCount: confirmedOrders.length,
    };
  }, [orders]);

  // Chart data for last 30 days
  const earningsChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'dd/MM', { locale: fr }),
        fullDate: format(date, 'yyyy-MM-dd'),
        gross: 0,
        net: 0,
      };
    });

    orders
      .filter(o => o.status === 'completed')
      .forEach(order => {
        const orderDate = format(parseISO(order.created_at), 'yyyy-MM-dd');
        const dayData = last30Days.find(d => d.fullDate === orderDate);
        if (dayData) {
          const gross = Number(order.total_amount);
          dayData.gross += gross;
          dayData.net += Math.round(gross * (1 - COMMISSION_RATE));
        }
      });

    return last30Days.map(({ date, gross, net }) => ({ date, gross, net }));
  }, [orders]);

  // Monthly summary data
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; gross: number; net: number; count: number }> = {};
    
    orders
      .filter(o => o.status === 'completed')
      .forEach(order => {
        const monthKey = format(parseISO(order.created_at), 'yyyy-MM');
        const monthLabel = format(parseISO(order.created_at), 'MMM yyyy', { locale: fr });
        
        if (!months[monthKey]) {
          months[monthKey] = { month: monthLabel, gross: 0, net: 0, count: 0 };
        }
        
        const gross = Number(order.total_amount);
        months[monthKey].gross += gross;
        months[monthKey].net += Math.round(gross * (1 - COMMISSION_RATE));
        months[monthKey].count += 1;
      });

    return Object.values(months).slice(-6);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Earnings */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gains nets</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {stats.netEarnings.toLocaleString()} FCFA
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Après déduction des 5%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gross Revenue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenus bruts</p>
                <p className="text-2xl font-bold text-secondary">
                  {stats.grossRevenue.toLocaleString()} FCFA
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total des commandes
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Deducted */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission (5%)</p>
                <p className="text-2xl font-bold text-orange-600">
                  -{stats.totalCommission.toLocaleString()} FCFA
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Frais de service YAFOY
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Percent className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Earnings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gains en attente</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.pendingEarnings.toLocaleString()} FCFA
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.confirmedCount} commande(s) en cours
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aujourd'hui</p>
              <p className="text-lg font-bold text-secondary">
                {stats.todayNet.toLocaleString()} FCFA
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cette semaine</p>
              <p className="text-lg font-bold text-secondary">
                {stats.weekNet.toLocaleString()} FCFA
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ce mois</p>
              <p className="text-lg font-bold text-secondary">
                {stats.monthNet.toLocaleString()} FCFA
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Évolution des gains (30 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {earningsChartData.some(d => d.net > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsChartData}>
                    <defs>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={4}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString()} FCFA`,
                        name === 'net' ? 'Gains nets' : 'Brut'
                      ]}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorNet)"
                      strokeWidth={2}
                      name="net"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Pas de données disponibles
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Résumé mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString()} FCFA`,
                        name === 'net' ? 'Gains nets' : 'Brut'
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="net" fill="#10b981" radius={[4, 4, 0, 0]} name="net" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Pas de données disponibles
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-secondary">{stats.completedCount}</p>
            <p className="text-sm text-muted-foreground">Commandes terminées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-secondary">{stats.pendingCount}</p>
            <p className="text-sm text-muted-foreground">En attente de confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-secondary">
              {stats.avgOrderValue.toLocaleString()} <span className="text-base font-normal">FCFA</span>
            </p>
            <p className="text-sm text-muted-foreground">Panier moyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-3xl font-bold text-secondary">{stats.conversionRate}%</p>
              {stats.conversionRate >= 50 ? (
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-orange-600" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">Taux de conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <Percent className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-300">
                Comment sont calculés vos gains ?
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                YAFOY prélève une commission de <strong>5%</strong> sur chaque commande terminée pour couvrir les frais de plateforme, paiement et support. Vos gains nets représentent <strong>95%</strong> du montant total de la commande.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
