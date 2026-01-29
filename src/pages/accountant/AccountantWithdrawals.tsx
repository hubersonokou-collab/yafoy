import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Withdrawal {
  id: string;
  provider_id: string;
  amount: number;
  status: string;
  payment_method: string;
  account_details: unknown;
  requested_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
}

const AccountantWithdrawals = () => {
  const { user, loading, isAccountant, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (isAccountant() || isAdmin() || isSuperAdmin())) {
      fetchWithdrawals();
    }
  }, [user, isAccountant, isAdmin, isSuperAdmin]);

  const handleAction = async () => {
    if (!selectedWithdrawal || !actionType) return;

    setIsProcessing(true);
    try {
      const updateData: Record<string, unknown> = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        processed_at: new Date().toISOString(),
      };

      if (actionType === 'reject') {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('withdrawals')
        .update(updateData)
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      toast({
        title: actionType === 'approve' ? 'Retrait approuvé' : 'Retrait rejeté',
        description: actionType === 'approve' 
          ? 'Le retrait a été approuvé avec succès'
          : 'Le retrait a été rejeté',
      });

      fetchWithdrawals();
      setSelectedWithdrawal(null);
      setActionType(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du traitement',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-1 rounded-full text-xs"><Clock className="h-3 w-3" /> En attente</span>;
      case 'approved':
        return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full text-xs"><CheckCircle className="h-3 w-3" /> Approuvé</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs"><XCircle className="h-3 w-3" /> Rejeté</span>;
      case 'completed':
        return <span className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs"><Wallet className="h-3 w-3" /> Complété</span>;
      default:
        return <span className="text-muted-foreground">{status}</span>;
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

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter(w => w.status !== 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Retraits</h1>
          <p className="text-muted-foreground">Gérer les demandes de retrait des prestataires</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Demandes en attente ({pendingWithdrawals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingWithdrawals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune demande de retrait en attente
              </p>
            ) : (
              <div className="space-y-4">
                {pendingWithdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border gap-4"
                  >
                    <div>
                      <p className="font-semibold text-lg">{formatCurrency(withdrawal.amount)}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {withdrawal.payment_method.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Demandé le {format(new Date(withdrawal.requested_at), 'PPp', { locale: fr })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setActionType('approve');
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setActionType('reject');
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des retraits</CardTitle>
          </CardHeader>
          <CardContent>
            {processedWithdrawals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun retrait traité
              </p>
            ) : (
              <div className="space-y-3">
                {processedWithdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-semibold">{formatCurrency(withdrawal.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(withdrawal.requested_at), 'PPp', { locale: fr })}
                      </p>
                      {withdrawal.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1">
                          Raison: {withdrawal.rejection_reason}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedWithdrawal && !!actionType} onOpenChange={() => {
        setSelectedWithdrawal(null);
        setActionType(null);
        setRejectionReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approuver le retrait' : 'Rejeter le retrait'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              {actionType === 'approve' 
                ? `Confirmer l'approbation du retrait de ${selectedWithdrawal ? formatCurrency(selectedWithdrawal.amount) : ''}?`
                : `Confirmer le rejet du retrait de ${selectedWithdrawal ? formatCurrency(selectedWithdrawal.amount) : ''}?`
              }
            </p>
            {actionType === 'reject' && (
              <Textarea
                placeholder="Raison du rejet..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-24"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedWithdrawal(null);
                setActionType(null);
                setRejectionReason('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing || (actionType === 'reject' && !rejectionReason)}
              className={actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
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

export default AccountantWithdrawals;
