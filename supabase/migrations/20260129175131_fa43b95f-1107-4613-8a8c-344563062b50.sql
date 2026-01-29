-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()));

-- Allow admins to view all favorites (for client profiles)
CREATE POLICY "Admins can view all favorites"
  ON public.favorites FOR SELECT
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()));