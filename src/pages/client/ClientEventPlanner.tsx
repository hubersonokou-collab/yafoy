import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EventPlannerChat } from '@/components/event-planner';
import { AccessibleEventPlanner } from '@/components/event-planner/AccessibleEventPlanner';
import { ChatRoomView } from '@/components/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  MessageSquare, 
  Check, 
  Users,
  Calendar,
  Wallet,
  Sparkles,
  Heart,
  Cake,
  Baby,
  Church,
  Building2,
  PartyPopper
} from 'lucide-react';

interface EventFormData {
  eventType: string;
  eventName: string;
  budgetMin: number;
  budgetMax: number;
  guestCount: number;
  eventDate: string;
  eventLocation: string;
  servicesNeeded: string[];
  additionalNotes: string;
}

const EVENT_TYPE_ICONS: Record<string, React.ElementType> = {
  mariage: Heart,
  bapteme: Baby,
  anniversaire: Cake,
  fete_entreprise: Building2,
  communion: Church,
  fiancailles: PartyPopper,
  autre: Sparkles,
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  anniversaire: 'Anniversaire',
  fete_entreprise: "Fête d'entreprise",
  communion: 'Communion',
  fiancailles: 'Fiançailles',
  autre: 'Autre',
};

const ClientEventPlanner = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'form' | 'chat' | 'room'>('form');
  const [eventData, setEventData] = useState<EventFormData | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [eventPlanningId, setEventPlanningId] = useState<string | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleFormSubmit = async (data: EventFormData) => {
    if (!user) return;

    try {
      // Save event planning request
      const { data: eventPlanning, error } = await supabase
        .from('event_planning_requests')
        .insert({
          user_id: user.id,
          event_type: data.eventType as any,
          event_name: data.eventName || null,
          budget_min: data.budgetMin,
          budget_max: data.budgetMax,
          guest_count: data.guestCount,
          event_date: data.eventDate || null,
          event_location: data.eventLocation || null,
          services_needed: data.servicesNeeded,
          additional_notes: data.additionalNotes || null,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      setEventPlanningId(eventPlanning.id);
      setEventData(data);
      setStep('chat');
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de sauvegarder votre événement",
        variant: 'destructive',
      });
    }
  };

  const handleCreateChatRoom = async () => {
    if (!user || !eventPlanningId || selectedProductIds.length === 0) return;

    setIsCreatingRoom(true);
    try {
      // Get provider IDs from selected products
      const { data: products } = await supabase
        .from('products')
        .select('id, provider_id')
        .in('id', selectedProductIds);

      if (!products || products.length === 0) throw new Error('Aucun produit sélectionné');

      // Create chat room
      const roomName = eventData?.eventName || `Événement ${EVENT_TYPE_LABELS[eventData?.eventType || 'autre']}`;
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          event_planning_id: eventPlanningId,
          name: roomName,
          created_by: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add organizer as participant
      await supabase.from('chat_room_participants').insert({
        room_id: room.id,
        user_id: user.id,
        role: 'organizer',
      });

      // Add providers as participants and save selected providers
      const providerIds = [...new Set(products.map(p => p.provider_id))];
      
      for (const providerId of providerIds) {
        await supabase.from('chat_room_participants').insert({
          room_id: room.id,
          user_id: providerId,
          role: 'provider',
        });
      }

      // Save selected providers
      for (const product of products) {
        await supabase.from('event_selected_providers').insert({
          event_planning_id: eventPlanningId,
          provider_id: product.provider_id,
          product_id: product.id,
          status: 'pending',
        });
      }

      // Update event planning with recommendations
      await supabase
        .from('event_planning_requests')
        .update({
          ai_recommendations: selectedProductIds,
          status: 'pending',
        })
        .eq('id', eventPlanningId);

      // Fetch participants info
      const { data: participantsData } = await supabase
        .from('chat_room_participants')
        .select(`
          user_id,
          role,
          profiles:user_id(full_name, avatar_url)
        `)
        .eq('room_id', room.id);

      if (participantsData) {
        setParticipants(participantsData.map(p => ({
          id: p.user_id,
          full_name: (p.profiles as any)?.full_name,
          avatar_url: (p.profiles as any)?.avatar_url,
          role: p.role,
        })));
      }

      setChatRoomId(room.id);
      setStep('room');

      toast({
        title: 'Groupe créé',
        description: `${providerIds.length} prestataire(s) ajouté(s) au groupe`,
      });
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de créer le groupe de chat",
        variant: 'destructive',
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const EventIcon = eventData ? EVENT_TYPE_ICONS[eventData.eventType] || Sparkles : Sparkles;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {step !== 'form' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setStep(step === 'room' ? 'chat' : 'form')}
              aria-label="Retour"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-secondary flex items-center gap-3">
              {step === 'form' && (
                <>
                  <Sparkles className="h-8 w-8 text-primary" />
                  Planifier un événement
                </>
              )}
              {step === 'chat' && (
                <>
                  <MessageSquare className="h-8 w-8 text-primary" />
                  Assistant IA
                </>
              )}
              {step === 'room' && (
                <>
                  <Users className="h-8 w-8 text-primary" />
                  Groupe de discussion
                </>
              )}
            </h1>
            {eventData && step !== 'form' && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1 text-sm py-1 px-3">
                  <EventIcon className="h-4 w-4" />
                  {EVENT_TYPE_LABELS[eventData.eventType]}
                </Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {eventData.guestCount} invités
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  {eventData.budgetMax.toLocaleString()} FCFA
                </span>
                {eventData.eventDate && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(eventData.eventDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step Content */}
        {step === 'form' && (
          <AccessibleEventPlanner onSubmit={handleFormSubmit} />
        )}

        {step === 'chat' && eventData && (
          <div className="space-y-4">
            <EventPlannerChat
              eventContext={{
                eventType: eventData.eventType,
                budgetMin: eventData.budgetMin,
                budgetMax: eventData.budgetMax,
                guestCount: eventData.guestCount,
                eventDate: eventData.eventDate,
                eventLocation: eventData.eventLocation,
                servicesNeeded: eventData.servicesNeeded,
              }}
              onSelectProducts={setSelectedProductIds}
              selectedProductIds={selectedProductIds}
            />

            {selectedProductIds.length > 0 && (
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="font-semibold text-lg">
                        {selectedProductIds.length} prestataire(s) sélectionné(s)
                      </span>
                    </div>
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto h-12 text-base"
                      onClick={handleCreateChatRoom} 
                      disabled={isCreatingRoom}
                    >
                      {isCreatingRoom ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <MessageSquare className="h-5 w-5 mr-2" />
                      )}
                      Créer le groupe de discussion
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 'room' && chatRoomId && (
          <div className="h-[600px] rounded-xl overflow-hidden border">
            <ChatRoomView roomId={chatRoomId} participants={participants} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientEventPlanner;
