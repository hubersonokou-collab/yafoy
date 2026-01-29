import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SupportTickets = () => {
  const { user, loading, isSupport, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (!loading && user && !isSupport() && !isAdmin() && !isSuperAdmin()) navigate('/');
  }, [user, loading, navigate, isSupport, isAdmin, isSuperAdmin]);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      setTickets(data || []);
      setIsLoading(false);
    };
    if (user && (isSupport() || isAdmin() || isSuperAdmin())) fetchTickets();
  }, [user, isSupport, isAdmin, isSuperAdmin]);

  if (loading || isLoading) return <DashboardLayout><div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-secondary">Tickets Support</h1>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Tous les tickets ({tickets.length})</CardTitle></CardHeader>
          <CardContent>
            {tickets.length === 0 ? <p className="text-muted-foreground text-center py-8">Aucun ticket</p> : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-lg border hover:bg-muted/30">
                    <p className="font-medium">{t.subject}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={t.status === 'open' ? 'default' : 'secondary'}>{t.status}</Badge>
                      <Badge variant="outline">{t.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(t.created_at), 'PPp', { locale: fr })}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SupportTickets;
