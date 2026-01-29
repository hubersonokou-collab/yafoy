import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, UserX, User, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserAccount {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  role: string;
  reportCount: number;
}

const ModeratorAccounts = () => {
  const { user, loading, isModerator, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    const fetchAccounts = async () => {
      try {
        // Fetch user roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('role', ['client', 'provider']);

        if (!roles || roles.length === 0) {
          setAccounts([]);
          setIsLoading(false);
          return;
        }

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', roles.map(r => r.user_id));

        // Fetch reports
        const { data: reports } = await supabase
          .from('reports')
          .select('reported_user_id');

        const reportCounts: Record<string, number> = {};
        reports?.forEach(r => {
          if (r.reported_user_id) {
            reportCounts[r.reported_user_id] = (reportCounts[r.reported_user_id] || 0) + 1;
          }
        });

        const roleMap: Record<string, string> = {};
        roles.forEach(r => {
          roleMap[r.user_id] = r.role;
        });

        const accountsWithData = profiles?.map(p => ({
          ...p,
          role: roleMap[p.user_id] || 'unknown',
          reportCount: reportCounts[p.user_id] || 0,
        })).sort((a, b) => b.reportCount - a.reportCount) || [];

        setAccounts(accountsWithData);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (isModerator() || isAdmin() || isSuperAdmin())) {
      fetchAccounts();
    }
  }, [user, isModerator, isAdmin, isSuperAdmin]);

  const filteredAccounts = accounts.filter(account =>
    account.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.phone?.includes(searchTerm)
  );

  const suspiciousAccounts = filteredAccounts.filter(a => a.reportCount > 0);
  const normalAccounts = filteredAccounts.filter(a => a.reportCount === 0);

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
        <div>
          <h1 className="text-3xl font-bold text-secondary">Gestion des comptes</h1>
          <p className="text-muted-foreground">Surveiller les comptes suspects</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>

        {suspiciousAccounts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                Comptes signalés ({suspiciousAccounts.length})
              </CardTitle>
              <CardDescription>Comptes ayant fait l'objet de signalements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suspiciousAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white border border-amber-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{account.full_name || 'Non renseigné'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="capitalize">{account.role}</Badge>
                          <span>•</span>
                          <span>{format(new Date(account.created_at), 'PP', { locale: fr })}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">
                      {account.reportCount} signalement(s)
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Tous les comptes ({normalAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {normalAccounts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun compte trouvé
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {normalAccounts.slice(0, 12).map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{account.full_name || 'Non renseigné'}</p>
                      <Badge variant="outline" className="capitalize text-xs">{account.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {normalAccounts.length > 12 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Et {normalAccounts.length - 12} autres comptes...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ModeratorAccounts;
