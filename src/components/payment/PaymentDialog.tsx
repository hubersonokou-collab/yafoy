import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaystackButton } from './PaystackButton';
import { CreditCard, Shield, Clock, CheckCircle } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    total_amount: number;
    deposit_paid?: number;
  };
  userEmail: string;
  onPaymentSuccess?: () => void;
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  order,
  userEmail,
  onPaymentSuccess,
}: PaymentDialogProps) => {
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const amountToPay = order.total_amount - (order.deposit_paid || 0);

  const handleSuccess = () => {
    setPaymentCompleted(true);
    onPaymentSuccess?.();
    setTimeout(() => {
      onOpenChange(false);
    }, 2000);
  };

  if (paymentCompleted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-success/10 p-4">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <h3 className="text-xl font-bold text-success">Paiement réussi !</h3>
            <p className="mt-2 text-muted-foreground">
              Votre commande a été confirmée avec succès.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Paiement sécurisé
          </DialogTitle>
          <DialogDescription>
            Finalisez votre réservation en effectuant le paiement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commande</span>
                  <span className="font-medium">#{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montant total</span>
                  <span>{order.total_amount.toLocaleString()} FCFA</span>
                </div>
                {order.deposit_paid && order.deposit_paid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Déjà payé</span>
                    <span className="text-success">-{order.deposit_paid.toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>À payer</span>
                    <span className="text-primary">{amountToPay.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Paiement sécurisé
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Confirmation instantanée
            </Badge>
          </div>

          {/* Payment info */}
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p>
              Vous serez redirigé vers Paystack pour finaliser votre paiement de manière sécurisée.
              Les cartes Visa, Mastercard et les paiements mobiles sont acceptés.
            </p>
          </div>

          {/* Payment button */}
          <PaystackButton
            orderId={order.id}
            amount={amountToPay}
            email={userEmail}
            onSuccess={handleSuccess}
            className="w-full"
          />

          <p className="text-center text-xs text-muted-foreground">
            En cliquant sur "Payer", vous acceptez nos conditions générales de vente
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
