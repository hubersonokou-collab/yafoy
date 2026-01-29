import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Flag, Search as SearchIcon, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_product_id: string | null;
  type: string;
  description: string | null;
  status: string;
  resolution_notes: string | null;
  created_at: string;
}

const ModeratorReports = () => {
  const { user, loading, isModerator, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionType, setActionType] = useState<'resolve' | 'dismiss' | 'investigate' | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const fetchReports = async () => {
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (isModerator() || isAdmin() || isSuperAdmin())) {
      fetchReports();
    }
  }, [user, statusFilter, isModerator, isAdmin, isSuperAdmin]);

  const handleAction = async () => {
    if (!selectedReport || !actionType) return;

    setIsProcessing(true);
    try {
      const statusMap = {
        resolve: 'resolved',
        dismiss: 'dismissed',
        investigate: 'investigating',
      };

      const updateData: Record<string, unknown> = {
        status: statusMap[actionType],
        resolved_by: user?.id,
      };

      if (actionType !== 'investigate') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolution_notes = resolutionNotes;
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', selectedReport.id);

      if (error) throw error;

      toast({
        title: 'Signalement mis à jour',
        description: `Le signalement a été ${actionType === 'resolve' ? 'résolu' : actionType === 'dismiss' ? 'rejeté' : 'mis en investigation'}`,
      });

      fetchReports();
      setSelectedReport(null);
      setActionType(null);
      setResolutionNotes('');
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'investigating':
        return <Badge className="bg-blue-100 text-blue-700">En investigation</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-100 text-emerald-700">Résolu</Badge>;
      case 'dismissed':
        return <Badge variant="outline">Rejeté</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
        <div>
          <h1 className="text-3xl font-bold text-secondary">Signalements</h1>
          <p className="text-muted-foreground">Gérer les signalements des utilisateurs</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-amber-500" />
                Liste des signalements ({reports.length})
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="investigating">En investigation</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="dismissed">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun signalement
              </p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getReportTypeBadge(report.type)}
                          {getStatusBadge(report.status)}
                        </div>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Signalé le {format(new Date(report.created_at), 'PPp', { locale: fr })}
                        </p>
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('investigate');
                            }}
                          >
                            <SearchIcon className="h-4 w-4 mr-1" />
                            Investiguer
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('resolve');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Résoudre
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('dismiss');
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                      {report.status === 'investigating' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('resolve');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Résoudre
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('dismiss');
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedReport && !!actionType} onOpenChange={() => {
        setSelectedReport(null);
        setActionType(null);
        setResolutionNotes('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'resolve' ? 'Résoudre le signalement' :
               actionType === 'dismiss' ? 'Rejeter le signalement' :
               'Mettre en investigation'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {actionType !== 'investigate' && (
              <Textarea
                placeholder="Notes de résolution..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="min-h-24"
              />
            )}
            {actionType === 'investigate' && (
              <p className="text-muted-foreground">
                Ce signalement sera marqué comme étant en investigation. Vous pourrez le résoudre ou le rejeter ultérieurement.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReport(null);
                setActionType(null);
                setResolutionNotes('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing}
              className={
                actionType === 'resolve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                actionType === 'dismiss' ? 'bg-red-600 hover:bg-red-700' :
                ''
              }
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ModeratorReports;
