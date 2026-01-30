-- Fix the buggy RLS policy for chat_rooms SELECT
-- The current policy incorrectly references chat_room_participants.id instead of chat_rooms.id

DROP POLICY IF EXISTS "Participants can view their chat rooms" ON public.chat_rooms;

CREATE POLICY "Participants can view their chat rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (
  (created_by = auth.uid()) OR
  (EXISTS ( 
    SELECT 1
    FROM chat_room_participants
    WHERE (chat_room_participants.room_id = chat_rooms.id) 
    AND (chat_room_participants.user_id = auth.uid())
  ))
);