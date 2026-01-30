import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  CreditCard, 
  CheckCircle2, 
  Store,
  Package,
  Calendar,
  MapPin,
  AlertCircle,
  Users,
} from 'lucide-react';

interface OrderSummary {
  orderId: string;
  providerId: string;
  providerName: string;
  amount: number;
  items: {
    name: string;
    quantity: number;
    rentalDays: number;
    pricePerDay: number;
    subtotal: number;
  }[];
}

interface GlobalPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: OrderSummary[];
  groupId: string;
  eventType?: string;
  eventDate?: string;
  eventLocation?: string;
  serviceFeePercent?: number;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  anniversaire: 'Anniversaire',
  fete_entreprise: "Fête d'entreprise",
  communion: 'Communion',
  fiancailles: 'Fiançailles',
  autre: 'Autre',
};

export const GlobalPaymentDialog = ({
  open,
  onOpenChange,
  orders,
  groupId,
  eventType,
  eventDate,
  eventLocation,
  serviceFeePercent = 5,
}: GlobalPaymentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Calculate totals
  const subtotal = orders.reduce((sum, order) => sum + order.amount, 0);
  const serviceFee = Math.round(subtotal * (serviceFeePercent / 100));
  const totalAmount = subtotal + serviceFee;

  // Listen for payment verification after Paystack redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const trxref = urlParams.get('trxref');
    
    if (reference || trxref) {
      verifyPayment(reference || trxref!);
    }
  }, []);

  const verifyPayment = async (reference: string) => {
    setIsProcessing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Session non valide');
      }

      const { data, error } = await supabase.functions.invoke('paystack/verify-group', {
        body: { reference },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setPaymentSuccess(true);
        toast({
          title: 'Paiement réussi !',
          description: 'Vos commandes ont été envoyées aux prestataires',
          className: 'bg-green-600 text-white',
        });

        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/client/orders');
        }, 2000);
      } else {
        toast({
          title: 'Paiement échoué',
          description: 'Le paiement n\'a pas été validé. Veuillez réessayer.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Erreur de vérification',
        description: "Impossible de vérifier le paiement",
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!user?.email || orders.length === 0) return;

    setIsProcessing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Session non valide');
      }

      const orderIds = orders.map(o => o.orderId);
      const callbackUrl = `${window.location.origin}/client/event-planner?payment=success`;

      const { data, error } = await supabase.functions.invoke('paystack/initialize-group', {
        body: { 
          orderIds,
          groupId,
          email: user.email,
          amount: totalAmount,
          callbackUrl,
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast({
        title: 'Erreur de paiement',
        description: "Impossible d'initier le paiement. Veuillez réessayer.",
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Paiement réussi !</h2>
            <p className="text-muted-foreground mb-4">
              Vos {orders.length} commande(s) ont été envoyées aux prestataires.
              <br />
              Chaque prestataire doit maintenant confirmer sa participation.
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Redirection en cours...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-primary" />
            Paiement Global
          </DialogTitle>
          <DialogDescription>
            Un seul paiement pour tous les prestataires. Chaque prestataire confirmera ensuite individuellement.
          </DialogDescription>
        </DialogHeader>

        {/* Event Info */}
        {(eventType || eventDate || eventLocation) && (
          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50">
            {eventType && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {EVENT_TYPE_LABELS[eventType] || eventType}
              </Badge>
            )}
            {eventDate && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(eventDate).toLocaleDateString('fr-FR')}
              </Badge>
            )}
            {eventLocation && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {eventLocation}
              </Badge>
            )}
          </div>
        )}

        {/* Orders Summary */}
        <ScrollArea className="flex-1 max-h-[300px] pr-4">
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div key={order.orderId} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Store className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{order.providerName}</span>
                  <Badge variant="outline" className="ml-auto">
                    {order.amount.toLocaleString()} FCFA
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between text-muted-foreground">
                      <span>
                        {item.name} 
                        <span className="text-xs ml-1">
                          (x{item.quantity} • {item.rentalDays}j)
                        </span>
                      </span>
                      <span>{item.subtotal.toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total ({orders.length} prestataire{orders.length > 1 ? 's' : ''})</span>
            <span>{subtotal.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de service ({serviceFeePercent}%)</span>
            <span>{serviceFee.toLocaleString()} FCFA</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total à payer</span>
            <span className="text-primary">{totalAmount.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Info Message */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-sm">
          <Users className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">Confirmation individuelle requise</p>
            <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
              Après votre paiement, chaque prestataire recevra une notification et devra confirmer sa disponibilité.
            </p>
          </div>
        </div>

        {/* Pay Button */}
        <Button 
          size="lg" 
          className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
          onClick={handlePayment}
          disabled={isProcessing || orders.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Traitement en cours...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Payer {totalAmount.toLocaleString()} FCFA
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
