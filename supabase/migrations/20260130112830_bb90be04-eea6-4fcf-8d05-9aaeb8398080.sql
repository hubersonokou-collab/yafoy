-- Allow chat participants to view profiles of other participants in shared rooms
CREATE POLICY "Chat participants can view other participants profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- User can view profiles of others who are in the same chat room as them
  EXISTS (
    SELECT 1
    FROM chat_room_participants crp1
    INNER JOIN chat_room_participants crp2 ON crp1.room_id = crp2.room_id
    WHERE crp1.user_id = auth.uid()
      AND crp2.user_id = profiles.user_id
  )
);

-- Also allow providers to see client profiles for their orders (and vice versa)
CREATE POLICY "Order participants can view each other profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- User can see profiles of clients/providers in their orders
  EXISTS (
    SELECT 1 FROM orders
    WHERE (orders.client_id = auth.uid() AND orders.provider_id = profiles.user_id)
       OR (orders.provider_id = auth.uid() AND orders.client_id = profiles.user_id)
  )
);