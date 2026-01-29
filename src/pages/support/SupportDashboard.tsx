import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Headphones, MessageSquare, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SupportDashboard = () => {
  const { user, loading, isSupport, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    openTickets: 0,
    inProgressTickets: 0,
    resolvedToday: 0,
    urgentTickets: 0,
  });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && user && !isSupport() && !isAdmin() && !isSuperAdmin()) {
      navigate('/');
      return;
    }
  }, [user, loading, navigate, isSupport, isAdmin, isSuperAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: tickets } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (tickets) {
          const today = new Date().toDateString();
          setStats({
            openTickets: tickets.filter(t => t.status === 'open').length,
            inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
            resolvedToday: tickets.filter(t => 
              t.status === 'resolved' && 
              new Date(t.updated_at).toDateString() === today
            ).length,
            urgentTickets: tickets.filter(t => 
              t.priority === 'urgent' && 
              (t.status === 'open' || t.status === 'in_progress')
            ).length,
          });
          setRecentTickets(tickets.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching support data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (isSupport() || isAdmin() || isSuperAdmin())) {
      fetchData();
    }
  }, [user, isSupport, isAdmin, isSuperAdmin]);

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-700">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-amber-100 text-amber-700">Haute</Badge>;
      case 'medium':
        return <Badge variant="secondary">Moyenne</Badge>;
      case 'low':
        return <Badge variant="outline">Basse</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-700">Ouvert</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-100 text-purple-700">En cours</Badge>;
      case 'waiting':
        return <Badge className="bg-amber-100 text-amber-700">En attente</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-100 text-emerald-700">Résolu</Badge>;
      case 'closed':
        return <Badge variant="outline">Fermé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Support Client</h1>
          <p className="text-muted-foreground">Gérer les demandes d'assistance</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Tickets ouverts"
            value={stats.openTickets.toString()}
            icon={MessageSquare}
            description="À traiter"
          />
          <StatsCard
            title="En cours"
            value={stats.inProgressTickets.toString()}
            icon={Clock}
            description="En traitement"
          />
          <StatsCard
            title="Résolus aujourd'hui"
            value={stats.resolvedToday.toString()}
            icon={CheckCircle}
            description="Tickets fermés"
          />
          <StatsCard
            title="Urgents"
            value={stats.urgentTickets.toString()}
            icon={AlertTriangle}
            description="Priorité haute"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Tickets récents
              </CardTitle>
              <button
                onClick={() => navigate('/support/tickets')}
                className="text-sm text-primary hover:underline"
              >
                Voir tout
              </button>
            </CardHeader>
            <CardContent>
              {recentTickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun ticket
                </p>
              ) : (
                <div className="space-y-3">
                  {recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate('/support/tickets')}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium line-clamp-1">{ticket.subject}</p>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {getStatusBadge(ticket.status)}
                        <span>•</span>
                        <span>{format(new Date(ticket.created_at), 'PPp', { locale: fr })}</span>
                      </div>
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
                onClick={() => navigate('/support/tickets')}
                className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Gérer les tickets</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.openTickets} ticket(s) en attente
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/support/users')}
                className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Headphones className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Rechercher un utilisateur</p>
                    <p className="text-sm text-muted-foreground">Aider à la création de compte</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/support/faq')}
                className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">FAQ & Réponses rapides</p>
                    <p className="text-sm text-muted-foreground">Templates de réponses</p>
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

export default SupportDashboard;
