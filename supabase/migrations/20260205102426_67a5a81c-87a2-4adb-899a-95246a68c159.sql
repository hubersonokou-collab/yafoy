-- Allow clients to view organizers in user_roles table
CREATE POLICY "Clients can view organizers" 
ON public.user_roles 
FOR SELECT 
USING (role = 'organizer');

-- Allow organizers to view their own role
CREATE POLICY "Organizers can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid() AND role = 'organizer');

-- Allow clients to create organizer assignments
CREATE POLICY "Clients can create assignments" 
ON public.client_organizer_assignments 
FOR INSERT 
WITH CHECK (client_id = auth.uid());

-- Allow clients to view organizer profiles
CREATE POLICY "Clients can view organizer profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = profiles.user_id 
  AND user_roles.role = 'organizer'
));