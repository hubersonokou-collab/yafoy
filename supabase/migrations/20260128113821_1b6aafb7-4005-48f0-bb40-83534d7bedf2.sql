-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price_per_day DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    quantity_available INTEGER NOT NULL DEFAULT 1,
    images TEXT[] DEFAULT '{}',
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- Create orders table
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    status public.order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    deposit_paid DECIMAL(10,2) DEFAULT 0,
    event_date DATE,
    event_location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_per_day DECIMAL(10,2) NOT NULL,
    rental_days INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()));

-- Products policies
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Providers can view their own products" ON public.products
    FOR SELECT USING (provider_id = auth.uid());

CREATE POLICY "Providers can insert their products" ON public.products
    FOR INSERT WITH CHECK (provider_id = auth.uid() AND public.is_provider(auth.uid()));

CREATE POLICY "Providers can update their products" ON public.products
    FOR UPDATE USING (provider_id = auth.uid());

CREATE POLICY "Providers can delete their products" ON public.products
    FOR DELETE USING (provider_id = auth.uid());

CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()));

-- Orders policies
CREATE POLICY "Clients can view their orders" ON public.orders
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Providers can view orders for their products" ON public.orders
    FOR SELECT USING (provider_id = auth.uid());

CREATE POLICY "Clients can create orders" ON public.orders
    FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Providers can update order status" ON public.orders
    FOR UPDATE USING (provider_id = auth.uid());

CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()));

-- Order items policies
CREATE POLICY "Users can view their order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
        )
    );

CREATE POLICY "Clients can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.client_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all order items" ON public.order_items
    FOR ALL USING (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, description, icon) VALUES
    ('Décoration', 'Articles de décoration pour cérémonies', 'Sparkles'),
    ('Mobilier', 'Tables, chaises, tentes', 'Armchair'),
    ('Sonorisation', 'Équipement audio et microphones', 'Speaker'),
    ('Éclairage', 'Lumières et effets lumineux', 'Lightbulb'),
    ('Vaisselle', 'Assiettes, verres, couverts', 'UtensilsCrossed'),
    ('Transport', 'Véhicules de cérémonie', 'Car'),
    ('Photographie', 'Équipement photo et vidéo', 'Camera'),
    ('Traiteur', 'Services de restauration', 'ChefHat');