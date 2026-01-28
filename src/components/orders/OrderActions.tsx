import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, Play, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface OrderActionsProps {
  orderId: string;
  currentStatus: OrderStatus;
  isProvider?: boolean;
  onStatusChange?: () => void;
}

export const OrderActions = ({
  orderId,
  currentStatus,
  isProvider = false,
  onStatusChange,
}: OrderActionsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (newStatus: OrderStatus) => {
    setLoading(newStatus);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: getStatusMessage(newStatus),
        className: newStatus === 'cancelled' ? '' : 'bg-success text-success-foreground',
        variant: newStatus === 'cancelled' ? 'destructive' : 'default',
      });

      onStatusChange?.();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le statut.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const getStatusMessage = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return 'La commande a été confirmée.';
      case 'in_progress':
        return 'La commande est maintenant en cours.';
      case 'completed':
        return 'La commande a été marquée comme terminée.';
      case 'cancelled':
        return 'La commande a été annulée.';
      default:
        return 'Statut mis à jour.';
    }
  };

  if (!isProvider) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === 'pending' && (
        <>
          <Button
            size="sm"
            onClick={() => updateStatus('confirmed')}
            disabled={loading !== null}
          >
            {loading === 'confirmed' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="mr-1 h-4 w-4" />
                Accepter
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={loading !== null}>
                <X className="mr-1 h-4 w-4" />
                Refuser
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Refuser cette commande ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le client sera notifié du refus.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => updateStatus('cancelled')}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Confirmer le refus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {currentStatus === 'confirmed' && (
        <Button
          size="sm"
          onClick={() => updateStatus('in_progress')}
          disabled={loading !== null}
        >
          {loading === 'in_progress' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Play className="mr-1 h-4 w-4" />
              Démarrer
            </>
          )}
        </Button>
      )}

      {currentStatus === 'in_progress' && (
        <Button
          size="sm"
          onClick={() => updateStatus('completed')}
          disabled={loading !== null}
          className="bg-success hover:bg-success/90"
        >
          {loading === 'completed' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="mr-1 h-4 w-4" />
              Terminer
            </>
          )}
        </Button>
      )}
    </div>
  );
};
