 import { supabase } from '@/integrations/supabase/client';
 
 /**
  * Assigne automatiquement un organisateur disponible au client
  * Si tous les organisateurs sont occupés, assigne celui avec le moins de clients actifs
  */
 export const assignOrganizer = async (clientId: string): Promise<string | null> => {
   try {
     // Récupérer tous les utilisateurs avec le rôle 'organizer'
     const { data: organizers } = await supabase
       .from('user_roles')
       .select('user_id')
       .eq('role', 'organizer');
 
     if (!organizers || organizers.length === 0) {
       console.error('No organizers found');
       return null;
     }
 
     const organizerIds = organizers.map((o) => o.user_id);
 
     // Compter les assignations actives par organisateur
     const { data: assignments } = await supabase
       .from('client_organizer_assignments')
       .select('organizer_id')
       .eq('status', 'active')
       .in('organizer_id', organizerIds);
 
     // Créer un map des counts
     const assignmentCounts: Record<string, number> = {};
     organizerIds.forEach((id) => {
       assignmentCounts[id] = 0;
     });
     (assignments || []).forEach((a) => {
       assignmentCounts[a.organizer_id] = (assignmentCounts[a.organizer_id] || 0) + 1;
     });
 
     // Trouver l'organisateur avec le moins de clients
     let minCount = Infinity;
     let selectedOrganizerId: string | null = null;
 
     for (const [organizerId, count] of Object.entries(assignmentCounts)) {
       if (count < minCount) {
         minCount = count;
         selectedOrganizerId = organizerId;
       }
     }
 
     if (!selectedOrganizerId) {
       // Si aucun organisateur trouvé, prendre le premier
       selectedOrganizerId = organizerIds[0];
     }
 
     // Vérifier si une assignation existe déjà pour ce client
     const { data: existingAssignment } = await supabase
       .from('client_organizer_assignments')
       .select('id, organizer_id')
       .eq('client_id', clientId)
       .eq('status', 'active')
       .maybeSingle();
 
     if (existingAssignment) {
       // Retourner l'organisateur déjà assigné
       return existingAssignment.organizer_id;
     }
 
     // Créer la nouvelle assignation
     const { data: newAssignment, error } = await supabase
       .from('client_organizer_assignments')
       .insert({
         client_id: clientId,
         organizer_id: selectedOrganizerId,
         status: 'active',
       })
       .select()
       .single();
 
     if (error) {
       console.error('Error creating assignment:', error);
       return null;
     }
 
     return newAssignment.organizer_id;
   } catch (error) {
     console.error('Error in assignOrganizer:', error);
     return null;
   }
 };
 
 /**
  * Récupère l'organisateur assigné à un client
  */
 export const getAssignedOrganizer = async (
   clientId: string
 ): Promise<{ id: string; name: string; avatar: string | null } | null> => {
   try {
     const { data: assignment } = await supabase
       .from('client_organizer_assignments')
       .select('organizer_id')
       .eq('client_id', clientId)
       .eq('status', 'active')
       .maybeSingle();
 
     if (!assignment) return null;
 
     const { data: profile } = await supabase
       .from('profiles')
       .select('user_id, full_name, avatar_url')
       .eq('user_id', assignment.organizer_id)
       .maybeSingle();
 
     if (!profile) return null;
 
     return {
       id: profile.user_id,
       name: profile.full_name || 'Équipe YAFOY',
       avatar: profile.avatar_url,
     };
   } catch (error) {
     console.error('Error getting assigned organizer:', error);
     return null;
   }
 };