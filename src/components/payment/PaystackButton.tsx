import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2, CheckCircle } from 'lucide-react';

interface PaystackButtonProps {
  orderId: string;
  amount: number;
  email: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const PaystackButton = ({
  orderId,
  amount,
  email,
  onSuccess,
  onError,
  disabled = false,
  className = '',
}: PaystackButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Initialize payment
      const { data, error } = await supabase.functions.invoke('paystack/initialize', {
        body: {
          orderId,
          email,
          amount,
          callbackUrl: `${window.location.origin}/client/orders?payment=success&orderId=${orderId}`,
        },
      });

      if (error) throw error;

      if (data?.authorization_url) {
        // Store reference for verification
        sessionStorage.setItem('paystack_reference', data.reference);
        sessionStorage.setItem('paystack_order_id', orderId);

        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Erreur lors de l\'initialisation du paiement';
      toast({
        title: 'Erreur de paiement',
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('paystack/verify', {
        body: { reference },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Paiement réussi',
          description: 'Votre paiement a été confirmé avec succès.',
          className: 'bg-success text-success-foreground',
        });
        onSuccess?.();
        return true;
      } else {
        throw new Error('Le paiement n\'a pas été confirmé');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage = error.message || 'Erreur lors de la vérification du paiement';
      toast({
        title: 'Erreur de vérification',
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(errorMessage);
      return false;
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading || verifying}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : verifying ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Vérification...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Payer {amount.toLocaleString()} FCFA
        </>
      )}
    </Button>
  );
};

// Hook to verify payment on callback
export const usePaystackVerification = () => {
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  const verifyPayment = async (reference: string): Promise<boolean> => {
    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('paystack/verify', {
        body: { reference },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Paiement confirmé',
          description: 'Votre paiement a été traité avec succès.',
          className: 'bg-success text-success-foreground',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de vérifier le paiement',
        variant: 'destructive',
      });
      return false;
    } finally {
      setVerifying(false);
    }
  };

  return { verifyPayment, verifying };
};
