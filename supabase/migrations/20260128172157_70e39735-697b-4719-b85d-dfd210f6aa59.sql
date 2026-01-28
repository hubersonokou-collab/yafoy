-- Allow admins and super_admins to view all user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()));