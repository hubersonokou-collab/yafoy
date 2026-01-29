-- Phase 1: Ajout des nouveaux rôles à l'enum existant UNIQUEMENT
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accountant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'support';