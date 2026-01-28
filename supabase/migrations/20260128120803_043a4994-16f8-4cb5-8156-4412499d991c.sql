-- Ajouter le rôle super_admin à l'utilisateur existant
INSERT INTO public.user_roles (user_id, role)
VALUES ('eb7d33ca-2023-4218-8276-3b8016ceed6d', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;