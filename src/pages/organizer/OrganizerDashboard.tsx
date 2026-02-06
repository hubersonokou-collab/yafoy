import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useChatRoom } from '@/hooks/useChatRoom';
import { Loader2 } from 'lucide-react';
import { OrganizerConversationList, OrganizerChat, OrganizerTools } from '@/components/organizer';
import type { Reservation } from '@/components/organizer';

const OrganizerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loadingReservations, setLoadingReservations] = useState(true);

  // Chat hook for sending quotes
  const { sendMessage } = useChatRoom(selectedReservation?.chatRoomId || null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch reservations assigned to this organizer
  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;

      try {
        const { data: assignments } = await supabase
          .from('client_organizer_assignments')
          .select('client_id')
          .eq('organizer_id', user.id)
          .eq('status', 'active');

        if (!assignments || assignments.length === 0) {
          setReservations([]);
          setLoadingReservations(false);
          return;
        }

        const clientIds = assignments.map((a) => a.client_id);

        const { data: events } = await supabase
          .from('event_planning_requests')
          .select('*')
          .in('user_id', clientIds)
          .in('status', ['pending_contact', 'contacted', 'confirmed', 'pending'])
          .order('created_at', { ascending: false });

        if (!events) {
          setReservations([]);
          setLoadingReservations(false);
          return;
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', clientIds);

        const profileMap = (profiles || []).reduce(
          (acc, p) => {
            acc[p.user_id] = p;
            return acc;
          },
          {} as Record<string, { full_name: string | null; avatar_url: string | null }>
        );

        const eventIds = events.map((e) => e.id);
        const { data: chatRooms } = await supabase
          .from('chat_rooms')
          .select('id, event_planning_id')
          .in('event_planning_id', eventIds);

        const chatRoomMap = (chatRooms || []).reduce(
          (acc, r) => {
            acc[r.event_planning_id] = r.id;
            return acc;
          },
          {} as Record<string, string>
        );

        const reservationData: Reservation[] = events.map((e) => ({
          id: e.id,
          clientId: e.user_id,
          clientName: profileMap[e.user_id]?.full_name || 'Client',
          clientAvatar: profileMap[e.user_id]?.avatar_url || null,
          eventName: e.event_name,
          eventType: e.event_type,
          eventDate: e.event_date,
          guestCount: e.guest_count,
          status: e.status,
          chatRoomId: chatRoomMap[e.id] || null,
          createdAt: e.created_at,
        }));

        setReservations(reservationData);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les réservations',
          variant: 'destructive',
        });
      } finally {
        setLoadingReservations(false);
      }
    };

    fetchReservations();
  }, [user, toast]);

  const handleSendQuote = useCallback(async (quoteMessage: string) => {
    if (!selectedReservation?.chatRoomId) return;
    await sendMessage(quoteMessage, 'text');
  }, [selectedReservation, sendMessage]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-secondary">Dashboard Organisateur</h1>
        <p className="text-muted-foreground">Gestion des réservations et conversations clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        <OrganizerConversationList
          reservations={reservations}
          selectedReservation={selectedReservation}
          onSelect={setSelectedReservation}
          loading={loadingReservations}
        />

        <OrganizerChat selectedReservation={selectedReservation} />

        <OrganizerTools
          chatRoomId={selectedReservation?.chatRoomId || null}
          onSendQuote={handleSendQuote}
        />
      </div>
    </DashboardLayout>
  );
};

export default OrganizerDashboard;
