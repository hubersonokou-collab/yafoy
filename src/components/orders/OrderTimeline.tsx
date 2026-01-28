import { Check, Clock, Package, Truck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface OrderTimelineProps {
  status: OrderStatus;
  compact?: boolean;
}

const statusSteps = [
  { key: 'pending', label: 'En attente', icon: Clock },
  { key: 'confirmed', label: 'Confirmée', icon: Check },
  { key: 'in_progress', label: 'En cours', icon: Truck },
  { key: 'completed', label: 'Terminée', icon: Package },
];

export const OrderTimeline = ({ status, compact = false }: OrderTimelineProps) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <X className="h-5 w-5" />
        <span className="font-medium">Commande annulée</span>
      </div>
    );
  }

  const currentIndex = statusSteps.findIndex((s) => s.key === status);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {statusSteps.map((step, index) => {
          const isActive = index <= currentIndex;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-1',
                index < statusSteps.length - 1 && 'after:content-[""] after:w-4 after:h-0.5 after:mx-1',
                isActive ? 'text-success after:bg-success' : 'text-muted-foreground/30 after:bg-muted-foreground/30'
              )}
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center',
                  isActive ? 'bg-success text-success-foreground' : 'bg-muted'
                )}
              >
                <Icon className="h-3 w-3" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {statusSteps.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = step.key === status;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div
              className={cn(
                'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                isActive ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {index < statusSteps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-full left-1/2 h-6 w-0.5 -translate-x-1/2',
                    index < currentIndex ? 'bg-success' : 'bg-muted'
                  )}
                />
              )}
            </div>
            <div className="pt-1">
              <p
                className={cn(
                  'font-medium',
                  isCurrent && 'text-success',
                  !isActive && 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
