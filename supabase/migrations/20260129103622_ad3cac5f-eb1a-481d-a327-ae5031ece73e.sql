-- Phase 2: Création des nouvelles tables

-- Table transactions pour le suivi comptable
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('payment', 'commission', 'withdrawal', 'refund')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method text CHECK (payment_method IN ('mobile_money', 'card', 'cash', 'bank_transfer')),
  provider_id uuid,
  description text,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid
);

-- Table withdrawals pour les retraits prestataires
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  payment_method text NOT NULL CHECK (payment_method IN ('mobile_money', 'bank_transfer')),
  account_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  rejection_reason text,
  notes text
);

-- Table reports pour les signalements
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  reported_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('fake_account', 'inappropriate_content', 'fraud', 'harassment', 'spam', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- Table support_tickets pour le support client
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text CHECK (category IN ('account', 'order', 'payment', 'technical', 'other')),
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table support_messages pour les messages des tickets
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Création des fonctions de vérification de rôle
CREATE OR REPLACE FUNCTION public.is_accountant(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'accountant')
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'supervisor')
$$;

CREATE OR REPLACE FUNCTION public.is_moderator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'moderator')
$$;

CREATE OR REPLACE FUNCTION public.is_support(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'support')
$$;

-- Fonction utilitaire pour vérifier si l'utilisateur est un membre de l'équipe
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin', 'accountant', 'supervisor', 'moderator', 'support')
  )
$$;

-- Politiques RLS pour transactions
CREATE POLICY "Admins and accountants can view all transactions"
  ON public.transactions FOR SELECT
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_accountant(auth.uid()));

CREATE POLICY "Admins and accountants can manage transactions"
  ON public.transactions FOR ALL
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_accountant(auth.uid()));

-- Politiques RLS pour withdrawals
CREATE POLICY "Providers can view their own withdrawals"
  ON public.withdrawals FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can request withdrawals"
  ON public.withdrawals FOR INSERT
  WITH CHECK (provider_id = auth.uid() AND is_provider(auth.uid()));

CREATE POLICY "Admins and accountants can view all withdrawals"
  ON public.withdrawals FOR SELECT
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_accountant(auth.uid()));

CREATE POLICY "Admins and accountants can manage withdrawals"
  ON public.withdrawals FOR UPDATE
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_accountant(auth.uid()));

-- Politiques RLS pour reports
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Moderators can view all reports"
  ON public.reports FOR SELECT
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_moderator(auth.uid()));

CREATE POLICY "Moderators can update reports"
  ON public.reports FOR UPDATE
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_moderator(auth.uid()));

-- Politiques RLS pour support_tickets
CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Support team can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_support(auth.uid()));

CREATE POLICY "Support team can manage tickets"
  ON public.support_tickets FOR UPDATE
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_support(auth.uid()));

-- Politiques RLS pour support_messages
CREATE POLICY "Users can view messages of their tickets"
  ON public.support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  ) AND is_internal = false);

CREATE POLICY "Users can send messages to their tickets"
  ON public.support_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  ) AND sender_id = auth.uid() AND is_internal = false);

CREATE POLICY "Support team can view all messages"
  ON public.support_messages FOR SELECT
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_support(auth.uid()));

CREATE POLICY "Support team can send messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR is_support(auth.uid()));

-- Politiques pour superviseur: accès en lecture aux commandes et profils
CREATE POLICY "Supervisors can view all orders"
  ON public.orders FOR SELECT
  USING (is_supervisor(auth.uid()));

CREATE POLICY "Supervisors can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_supervisor(auth.uid()));

-- Politiques pour modérateur: accès aux produits et profils
CREATE POLICY "Moderators can view all products"
  ON public.products FOR SELECT
  USING (is_moderator(auth.uid()));

CREATE POLICY "Moderators can update products"
  ON public.products FOR UPDATE
  USING (is_moderator(auth.uid()));

CREATE POLICY "Moderators can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_moderator(auth.uid()));

-- Support peut voir les profils pour aider les utilisateurs
CREATE POLICY "Support can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_support(auth.uid()));

-- Comptable peut voir les commandes
CREATE POLICY "Accountants can view all orders"
  ON public.orders FOR SELECT
  USING (is_accountant(auth.uid()));

-- Trigger pour mettre à jour updated_at sur support_tickets
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX idx_transactions_provider_id ON public.transactions(provider_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);

CREATE INDEX idx_withdrawals_provider_id ON public.withdrawals(provider_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_type ON public.reports(type);
CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

CREATE INDEX idx_support_messages_ticket_id ON public.support_messages(ticket_id);