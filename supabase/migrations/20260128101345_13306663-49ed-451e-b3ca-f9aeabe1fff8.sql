-- Ajouter le rôle 'admin' à l'enum user_role existant
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';