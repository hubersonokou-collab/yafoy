import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const SupportUsers = () => {
  const { user, loading, isSupport, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (!loading && user && !isSupport() && !isAdmin() && !isSuperAdmin()) navigate('/');
  }, [user, loading, navigate, isSupport, isAdmin, isSuperAdmin]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-secondary">Recherche Utilisateurs</h1>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Aide aux utilisateurs</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">Fonctionnalité de recherche utilisateurs à venir.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SupportUsers;
