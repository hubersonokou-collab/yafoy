-- Fix infinite recursion in RLS policies involving chat_room_participants

-- Helper function to check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_chat_room_participant(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_room_participants
    WHERE room_id = _room_id
      AND user_id = _user_id
  );
$$;

-- chat_room_participants: replace self-referencing policy that causes recursion
DROP POLICY IF EXISTS "Participants can view room participants" ON public.chat_room_participants;
CREATE POLICY "Participants can view room participants"
ON public.chat_room_participants
FOR SELECT
USING (
  public.is_chat_room_participant(chat_room_participants.room_id, auth.uid())
);

-- chat_rooms: use helper function as well (SELECT happens immediately after INSERT via .select())
DROP POLICY IF EXISTS "Participants can view their chat rooms" ON public.chat_rooms;
CREATE POLICY "Participants can view their chat rooms"
ON public.chat_rooms
FOR SELECT
USING (
  created_by = auth.uid()
  OR public.is_chat_room_participant(chat_rooms.id, auth.uid())
);

-- chat_messages: keep consistent and avoid depending on potentially problematic subqueries
DROP POLICY IF EXISTS "Participants can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Participants can view messages in their rooms"
ON public.chat_messages
FOR SELECT
USING (
  public.is_chat_room_participant(chat_messages.room_id, auth.uid())
);

DROP POLICY IF EXISTS "Participants can send messages to their rooms" ON public.chat_messages;
CREATE POLICY "Participants can send messages to their rooms"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_chat_room_participant(chat_messages.room_id, auth.uid())
);
