import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  MessageSquare,
  Star,
  Bell,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    read: boolean;
    created_at: string;
    data: Record<string, unknown> | null;
  };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  new_order: ShoppingCart,
  order_update: RefreshCw,
  new_message: MessageSquare,
  new_review: Star,
  default: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  new_order: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  order_update: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  new_message: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  new_review: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  default: 'bg-muted text-muted-foreground',
};

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps) => {
  const Icon = TYPE_ICONS[notification.type] || TYPE_ICONS.default;
  const colorClass = TYPE_COLORS[notification.type] || TYPE_COLORS.default;

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onClick?.();
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        notification.read
          ? 'bg-background hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10'
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 p-2 rounded-full', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium line-clamp-1',
              notification.read ? 'text-foreground' : 'text-foreground'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
        
        {notification.body && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.body}
          </p>
        )}
        
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Marquer comme lu"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="Supprimer"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
