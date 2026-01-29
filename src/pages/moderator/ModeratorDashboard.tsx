import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldCheck, AlertTriangle, Package, UserX, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ModeratorDashboard = () => {
  const { user, loading, isModerator, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    unverifiedProducts: 0,
    pendingReports: 0,
    totalProviders: 0,
    totalProducts: 0,
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && user && !isModerator() && !isAdmin() && !isSuperAdmin()) {
      navigate('/');
      return;
    }
  }, [user, loading, navigate, isModerator, isAdmin, isSuperAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const { data: products, count: productsCount } = await supabase
          .from('products')
          .select('is_verified', { count: 'exact' });

        const unverifiedProducts = products?.filter(p => !p.is_verified).length || 0;

        // Fetch reports
        const { data: reports } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        const pendingReports = reports?.filter(r => r.status === 'pending').length || 0;

        // Fetch providers count
        const { count: providersCount } = await supabase
          .from('user_roles')
          .select('id', { count: 'exact' })
          .eq('role', 'provider');

        setStats({
          unverifiedProducts,
          pendingReports,
          totalProviders: providersCount || 0,
          totalProducts: productsCount || 0,
        });
        
        setRecentReports(reports || []);
      } catch (error) {
        console.error('Error fetching moderator data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (isModerator() || isAdmin() || isSuperAdmin())) {
      fetchData();
    }
  }, [user, isModerator, isAdmin, isSuperAdmin]);

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const getReportTypeBadge = (type: string) => {
    const types: Record<string, { label: string; className: string }> = {
      fake_account: { label: 'Faux compte', className: 'bg-red-100 text-red-700' },
      inappropriate_content: { label: 'Contenu inapproprié', className: 'bg-amber-100 text-amber-700' },
      fraud: { label: 'Fraude', className: 'bg-purple-100 text-purple-700' },
      harassment: { label: 'Harcèlement', className: 'bg-pink-100 text-pink-700' },
      spam: { label: 'Spam', className: 'bg-blue-100 text-blue-700' },
      other: { label: 'Autre', className: 'bg-gray-100 text-gray-700' },
    };
    const typeInfo = types[type] || types.other;
    return <Badge className={typeInfo.className}>{typeInfo.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Tableau de bord Modérateur</h1>
          <p className="text-muted-foreground">Modération du contenu et des comptes</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Produits non vérifiés"
            value={stats.unverifiedProducts.toString()}
            icon={Package}
            description="À vérifier"
          />
          <StatsCard
            title="Signalements en attente"
            value={stats.pendingReports.toString()}
            icon={Flag}
            description="À traiter"
          />
          <StatsCard
            title="Prestataires"
            value={stats.totalProviders.toString()}
            icon={ShieldCheck}
            description="Total enregistrés"
          />
          <StatsCard
            title="Produits"
            value={stats.totalProducts.toString()}
            icon={Package}
            description="Total sur la plateforme"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-amber-500" />
                Signalements récents
              </CardTitle>
              <button
                onClick={() => navigate('/moderator/reports')}
                className="text-sm text-primary hover:underline"
              >
                Voir tout
              </button>
            </CardHeader>
            <CardContent>
              {recentReports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun signalement
                </p>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        {getReportTypeBadge(report.type)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(report.created_at), 'PPp', { locale: fr })}
                        </p>
                      </div>
                      <Badge variant={report.status === 'pending' ? 'secondary' : 'outline'}>
                        {report.status === 'pending' ? 'En attente' : 
                         report.status === 'investigating' ? 'En cours' :
                         report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => navigate('/moderator/products')}
                className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Modérer les produits</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.unverifiedProducts} produit(s) à vérifier
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/moderator/providers')}
                className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Vérifier les prestataires</p>
                    <p className="text-sm text-muted-foreground">Valider les profils</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/moderator/accounts')}
                className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserX className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Gérer les comptes</p>
                    <p className="text-sm text-muted-foreground">Détecter les comptes suspects</p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ModeratorDashboard;
