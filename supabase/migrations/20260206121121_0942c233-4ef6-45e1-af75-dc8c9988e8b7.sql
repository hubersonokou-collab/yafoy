
-- Policy 1: Organizers can view assigned client events
CREATE POLICY "Organizers can view assigned client events"
  ON public.event_planning_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_organizer_assignments
      WHERE organizer_id = auth.uid()
        AND client_id = event_planning_requests.user_id
        AND status = 'active'
    )
  );

-- Policy 2: Participants can add to their rooms (organizers who are already participants)
CREATE POLICY "Participants can add to their rooms"
  ON public.chat_room_participants
  FOR INSERT
  WITH CHECK (
    is_chat_room_participant(room_id, auth.uid())
  );

-- Policy 3: Organizers can view event_selected_providers for assigned clients
CREATE POLICY "Organizers can view assigned client selected providers"
  ON public.event_selected_providers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_planning_requests epr
      JOIN public.client_organizer_assignments coa
        ON coa.client_id = epr.user_id
      WHERE epr.id = event_selected_providers.event_planning_id
        AND coa.organizer_id = auth.uid()
        AND coa.status = 'active'
    )
  );
