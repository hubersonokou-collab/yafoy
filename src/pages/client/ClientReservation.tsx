 import { useState, useEffect } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { useAuth } from '@/hooks/useAuth';
 import { supabase } from '@/integrations/supabase/client';
 import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
 import { ClientReservationChat } from '@/components/reservation';
 import { Button } from '@/components/ui/button';
 import { useToast } from '@/hooks/use-toast';
 import { Loader2, ArrowLeft, Calendar, Users, MapPin } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 
 interface ReservationData {
   id: string;
   event_name: string | null;
   event_type: string;
   event_date: string | null;
   event_location: string | null;
   guest_count: number;
   status: string;
   chatRoomId: string | null;
   organizerName: string | null;
   organizerAvatar: string | null;
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
 
 const ClientReservation = () => {
   const { id } = useParams<{ id: string }>();
   const { user, loading: authLoading } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
   const [reservation, setReservation] = useState<ReservationData | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!authLoading && !user) {
       navigate('/auth');
     }
   }, [user, authLoading, navigate]);
 
   useEffect(() => {
     const fetchReservation = async () => {
       if (!id || !user) return;
 
       try {
         // Fetch event planning request
         const { data: eventData, error: eventError } = await supabase
           .from('event_planning_requests')
           .select('*')
           .eq('id', id)
           .eq('user_id', user.id)
           .single();
 
         if (eventError) throw eventError;
 
         // Fetch chat room for this event
         const { data: chatRoom } = await supabase
           .from('chat_rooms')
           .select('id')
           .eq('event_planning_id', id)
           .maybeSingle();
 
         // Fetch organizer info from assignment
         let organizerName = null;
         let organizerAvatar = null;
 
         const { data: assignment } = await supabase
           .from('client_organizer_assignments')
           .select('organizer_id')
           .eq('client_id', user.id)
           .eq('status', 'active')
           .maybeSingle();
 
         if (assignment) {
           const { data: profile } = await supabase
             .from('profiles')
             .select('full_name, avatar_url')
             .eq('user_id', assignment.organizer_id)
             .maybeSingle();
 
           if (profile) {
             organizerName = profile.full_name;
             organizerAvatar = profile.avatar_url;
           }
         }
 
         setReservation({
           id: eventData.id,
           event_name: eventData.event_name,
           event_type: eventData.event_type,
           event_date: eventData.event_date,
           event_location: eventData.event_location,
           guest_count: eventData.guest_count,
           status: eventData.status,
           chatRoomId: chatRoom?.id || null,
           organizerName,
           organizerAvatar,
         });
       } catch (error) {
         console.error('Error fetching reservation:', error);
         toast({
           title: 'Erreur',
           description: 'Impossible de charger la réservation',
           variant: 'destructive',
         });
         navigate('/client');
       } finally {
         setLoading(false);
       }
     };
 
     fetchReservation();
   }, [id, user, navigate, toast]);
 
   if (authLoading || loading) {
     return (
       <div className="flex min-h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!reservation) {
     return null;
   }
 
   return (
     <DashboardLayout>
       <div className="space-y-4 h-[calc(100vh-120px)]">
         {/* Header */}
         <div className="flex items-center gap-4">
           <Button
             variant="ghost"
             size="icon"
             className="h-12 w-12 rounded-full"
             onClick={() => navigate('/client')}
           >
             <ArrowLeft className="h-6 w-6" />
           </Button>
           <div className="flex-1">
             <h1 className="text-2xl font-bold text-secondary">
               {reservation.event_name || EVENT_TYPE_LABELS[reservation.event_type] || 'Ma Réservation'}
             </h1>
             <div className="flex flex-wrap items-center gap-3 mt-1">
               <Badge variant="secondary">
                 {EVENT_TYPE_LABELS[reservation.event_type]}
               </Badge>
               {reservation.event_date && (
                 <span className="flex items-center gap-1 text-sm text-muted-foreground">
                   <Calendar className="h-4 w-4" />
                   {new Date(reservation.event_date).toLocaleDateString('fr-FR')}
                 </span>
               )}
               <span className="flex items-center gap-1 text-sm text-muted-foreground">
                 <Users className="h-4 w-4" />
                 {reservation.guest_count} invités
               </span>
               {reservation.event_location && (
                 <span className="flex items-center gap-1 text-sm text-muted-foreground">
                   <MapPin className="h-4 w-4" />
                   {reservation.event_location}
                 </span>
               )}
             </div>
           </div>
         </div>
 
         {/* Chat Area */}
         {reservation.chatRoomId ? (
           <div className="h-[calc(100%-80px)] rounded-xl overflow-hidden border">
             <ClientReservationChat
               roomId={reservation.chatRoomId}
               organizerName={reservation.organizerName || 'Équipe YAFOY'}
               organizerAvatar={reservation.organizerAvatar || undefined}
               eventName={reservation.event_name || undefined}
             />
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center h-[calc(100%-80px)] text-muted-foreground">
             <Loader2 className="h-12 w-12 animate-spin mb-4" />
             <p>Connexion avec votre organisateur en cours...</p>
           </div>
         )}
       </div>
     </DashboardLayout>
   );
 };
 
 export default ClientReservation;