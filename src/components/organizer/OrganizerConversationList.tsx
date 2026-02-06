import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EVENT_TYPE_LABELS: Record<string, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  anniversaire: 'Anniversaire',
  fete_entreprise: "Fête d'entreprise",
  communion: 'Communion',
  fiancailles: 'Fiançailles',
  autre: 'Autre',
};

export interface Reservation {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string | null;
  eventName: string | null;
  eventType: string;
  eventDate: string | null;
  guestCount: number;
  status: string;
  chatRoomId: string | null;
  createdAt: string;
}

interface Props {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  onSelect: (reservation: Reservation) => void;
  loading: boolean;
}

export const OrganizerConversationList = ({ reservations, selectedReservation, onSelect, loading }: Props) => {
  return (
    <Card className="lg:col-span-3 flex flex-col">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Conversations ({reservations.length})
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune conversation</p>
          </div>
        ) : (
          <div className="divide-y">
            {reservations.map((res) => (
              <div
                key={res.id}
                className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedReservation?.id === res.id ? 'bg-primary text-primary-foreground' : ''
                }`}
                onClick={() => onSelect(res)}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={res.clientAvatar || undefined} />
                    <AvatarFallback className="text-xs">{res.clientName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm truncate ${selectedReservation?.id === res.id ? 'text-primary-foreground' : ''}`}>
                      {res.clientName}
                    </p>
                    <p className={`text-xs truncate ${selectedReservation?.id === res.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {res.eventName || EVENT_TYPE_LABELS[res.eventType]} · {res.eventDate
                        ? format(new Date(res.eventDate), 'd MMM', { locale: fr })
                        : format(new Date(res.createdAt), 'd MMM', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
