-- Add CHECK constraints to products table for data integrity
ALTER TABLE public.products 
  ADD CONSTRAINT products_price_per_day_positive CHECK (price_per_day > 0),
  ADD CONSTRAINT products_price_per_day_reasonable CHECK (price_per_day <= 100000000),
  ADD CONSTRAINT products_deposit_amount_non_negative CHECK (deposit_amount >= 0),
  ADD CONSTRAINT products_quantity_available_positive CHECK (quantity_available > 0),
  ADD CONSTRAINT products_quantity_available_reasonable CHECK (quantity_available <= 100000);

-- Add INSERT policy on notifications table to block direct inserts
-- Edge functions using service role will still work as service role bypasses RLS
CREATE POLICY "Notifications created via edge functions only"
  ON public.notifications
  FOR INSERT
  WITH CHECK (false);