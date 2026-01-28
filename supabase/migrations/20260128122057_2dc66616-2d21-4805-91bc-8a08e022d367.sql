-- Table Favoris
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their favorites" ON public.favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their favorites" ON public.favorites
  FOR DELETE USING (user_id = auth.uid());

-- Table Reviews (Avis)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  quality_rating INTEGER,
  professionalism_rating INTEGER,
  value_rating INTEGER,
  comment TEXT,
  provider_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, client_id)
);

-- Trigger de validation pour les ratings (évite CHECK constraint issues)
CREATE OR REPLACE FUNCTION public.validate_review_ratings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF NEW.quality_rating IS NOT NULL AND (NEW.quality_rating < 1 OR NEW.quality_rating > 5) THEN
    RAISE EXCEPTION 'quality_rating must be between 1 and 5';
  END IF;
  IF NEW.professionalism_rating IS NOT NULL AND (NEW.professionalism_rating < 1 OR NEW.professionalism_rating > 5) THEN
    RAISE EXCEPTION 'professionalism_rating must be between 1 and 5';
  END IF;
  IF NEW.value_rating IS NOT NULL AND (NEW.value_rating < 1 OR NEW.value_rating > 5) THEN
    RAISE EXCEPTION 'value_rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_review_ratings_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_ratings();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews 
  FOR SELECT USING (true);

CREATE POLICY "Clients can create reviews for their orders" ON public.reviews 
  FOR INSERT WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND client_id = auth.uid() AND status = 'completed'
    )
  );

CREATE POLICY "Providers can respond to their reviews" ON public.reviews 
  FOR UPDATE USING (provider_id = auth.uid());

-- Table Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Trigger pour update_at sur reviews
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();