
# Plan d'implementation des nouveaux roles et interfaces d'equipe

## Apercu

Ce plan decrit la creation de 4 nouveaux roles d'equipe (Comptable, Superviseur, Moderateur, Support Client) avec leurs interfaces dediees, ainsi qu'une fonctionnalite d'ajout de membres dans le tableau de bord admin.

---

## Phase 1: Mise a jour de la base de donnees

### 1.1 Extension de l'enum des roles

Ajouter les nouveaux roles a l'enum `user_role` existant:
- `accountant` (Comptable)
- `supervisor` (Superviseur)  
- `moderator` (Moderateur)
- `support` (Support Client)

### 1.2 Creation de nouvelles tables

**Table `transactions`** - Pour le suivi comptable:
- `id`, `order_id`, `type` (payment, commission, withdrawal)
- `amount`, `status`, `payment_method` (mobile_money, card, cash)
- `provider_id`, `created_at`, `processed_at`, `processed_by`

**Table `withdrawals`** - Pour les retraits prestataires:
- `id`, `provider_id`, `amount`, `status` (pending, approved, rejected, completed)
- `payment_method`, `account_details`, `requested_at`, `processed_at`, `processed_by`

**Table `reports`** - Pour les signalements:
- `id`, `reporter_id`, `reported_user_id`, `reported_product_id`
- `type` (fake_account, inappropriate_content, fraud, other)
- `description`, `status` (pending, investigating, resolved, dismissed)
- `created_at`, `resolved_at`, `resolved_by`

**Table `support_tickets`** - Pour le support client:
- `id`, `user_id`, `subject`, `description`
- `status` (open, in_progress, resolved, closed)
- `priority` (low, medium, high), `assigned_to`
- `created_at`, `updated_at`

**Table `support_messages`** - Messages des tickets:
- `id`, `ticket_id`, `sender_id`, `message`, `created_at`

### 1.3 Creation de fonctions utilitaires

Nouvelles fonctions `SECURITY DEFINER`:
- `is_accountant(_user_id uuid)` 
- `is_supervisor(_user_id uuid)`
- `is_moderator(_user_id uuid)`
- `is_support(_user_id uuid)`

### 1.4 Politiques RLS

Configurer les politiques d'acces pour chaque role:
- Comptable: acces aux transactions, retraits, commandes (lecture)
- Superviseur: acces aux commandes, profils clients/prestataires (lecture)
- Moderateur: acces aux profils, produits, signalements (lecture/ecriture)
- Support: acces aux tickets, profils utilisateurs (lecture/ecriture)

---

## Phase 2: Mise a jour du systeme d'authentification

### 2.1 Extension du hook `useAuth`

Ajouter les nouvelles methodes de verification:
- `isAccountant()`
- `isSupervisor()`
- `isModerator()`
- `isSupport()`
- `isTeamMember()` - retourne vrai pour tout role d'equipe

### 2.2 Extension du type TypeScript

Mettre a jour le type `UserRole` dans `src/types/database.ts`:

```text
export type UserRole = 
  | 'client' 
  | 'provider' 
  | 'admin' 
  | 'super_admin'
  | 'accountant'
  | 'supervisor'
  | 'moderator'
  | 'support';
```

---

## Phase 3: Creation des interfaces

### 3.1 Interface Comptable (`/accountant`)

**Pages a creer:**

1. **AccountantDashboard** (`/accountant`)
   - Resume financier: revenus totaux, commissions, retraits en attente
   - Graphiques: evolution des revenus, repartition par categorie
   - Indicateurs cles (KPIs)

2. **AccountantTransactions** (`/accountant/transactions`)
   - Liste des paiements avec filtres (statut, periode, methode)
   - Details de chaque transaction
   - Export des donnees

3. **AccountantWithdrawals** (`/accountant/withdrawals`)
   - Demandes de retrait des prestataires
   - Actions: approuver/rejeter avec justification
   - Historique des retraits traites

4. **AccountantReports** (`/accountant/reports`)
   - Generation de rapports financiers
   - Rapports par periode, par prestataire, par categorie
   - Export PDF/Excel

### 3.2 Interface Superviseur (`/supervisor`)

**Pages a creer:**

1. **SupervisorDashboard** (`/supervisor`)
   - Vue d'ensemble des commandes du jour
   - Statistiques: commandes par statut
   - Alertes (commandes en retard, problemes)

2. **SupervisorOrders** (`/supervisor/orders`)
   - Liste complete des commandes avec tous les details
   - Informations client: nom, telephone, lieu
   - Informations prestataire: nom, telephone
   - Statut et timeline de la commande
   - Filtres avances (date, statut, lieu, prestataire)

### 3.3 Interface Moderateur (`/moderator`)

**Pages a creer:**

1. **ModeratorDashboard** (`/moderator`)
   - Statistiques: prestataires a verifier, signalements en attente
   - Activite recente

2. **ModeratorProviders** (`/moderator/providers`)
   - Liste des prestataires avec statut de verification
   - Actions: verifier profil, demander modifications
   - Visualisation des documents

3. **ModeratorProducts** (`/moderator/products`)
   - Liste des produits a moderer
   - Verification des photos et descriptions
   - Actions: approuver, demander modification, supprimer

4. **ModeratorReports** (`/moderator/reports`)
   - Signalements des utilisateurs
   - Actions: investiguer, resoudre, rejeter
   - Historique des actions

5. **ModeratorAccounts** (`/moderator/accounts`)
   - Detection des comptes suspects
   - Actions: suspendre, supprimer

### 3.4 Interface Support Client (`/support`)

**Pages a creer:**

1. **SupportDashboard** (`/support`)
   - Tickets ouverts et en cours
   - Temps de reponse moyen
   - Satisfaction client

2. **SupportTickets** (`/support/tickets`)
   - Liste des tickets avec priorite
   - Filtres: statut, priorite, date
   - Actions: prendre en charge, repondre, cloturer

3. **SupportUsers** (`/support/users`)
   - Recherche d'utilisateurs
   - Aide a la creation de compte
   - Historique des interactions

4. **SupportFAQ** (`/support/faq`)
   - Gestion des questions frequentes
   - Templates de reponses

---

## Phase 4: Composants partages

### 4.1 DashboardLayout

Mise a jour pour supporter les nouveaux roles:
- Navigation specifique pour chaque role
- Titres et icones appropries
- Redirection vers le bon dashboard

### 4.2 Nouveaux composants

- `TransactionCard` - Affichage des transactions
- `WithdrawalRequest` - Demande de retrait
- `ReportCard` - Carte de signalement
- `TicketCard` - Carte de ticket support
- `TicketChat` - Conversation de ticket
- `AddTeamMemberDialog` - Modal d'ajout de membre

---

## Phase 5: Gestion des membres d'equipe

### 5.1 Page d'administration des membres (`/admin/team`)

- Liste des membres avec leur role
- Ajout de nouveaux membres via email
- Modification/suppression de roles
- Invitation par email

### 5.2 Processus d'ajout de membre

1. Admin entre l'email et selectionne le role
2. Systeme cree le compte ou assigne le role si compte existant
3. Email d'invitation envoye (si nouveau compte)

---

## Phase 6: Mise a jour du routage

### 6.1 Nouvelles routes dans App.tsx

```text
Routes Comptable:
/accountant           -> AccountantDashboard
/accountant/transactions -> AccountantTransactions
/accountant/withdrawals  -> AccountantWithdrawals
/accountant/reports      -> AccountantReports

Routes Superviseur:
/supervisor           -> SupervisorDashboard
/supervisor/orders    -> SupervisorOrders

Routes Moderateur:
/moderator            -> ModeratorDashboard
/moderator/providers  -> ModeratorProviders
/moderator/products   -> ModeratorProducts
/moderator/reports    -> ModeratorReports
/moderator/accounts   -> ModeratorAccounts

Routes Support:
/support              -> SupportDashboard
/support/tickets      -> SupportTickets
/support/users        -> SupportUsers
/support/faq          -> SupportFAQ

Route Admin:
/admin/team           -> AdminTeam
```

### 6.2 Redirection post-connexion

Mise a jour dans `Auth.tsx` pour rediriger vers le bon dashboard selon le role.

---

## Structure des fichiers a creer

```text
src/pages/
  accountant/
    AccountantDashboard.tsx
    AccountantTransactions.tsx
    AccountantWithdrawals.tsx
    AccountantReports.tsx
  
  supervisor/
    SupervisorDashboard.tsx
    SupervisorOrders.tsx
  
  moderator/
    ModeratorDashboard.tsx
    ModeratorProviders.tsx
    ModeratorProducts.tsx
    ModeratorReports.tsx
    ModeratorAccounts.tsx
  
  support/
    SupportDashboard.tsx
    SupportTickets.tsx
    SupportUsers.tsx
    SupportFAQ.tsx
  
  admin/
    AdminTeam.tsx (nouveau)

src/components/
  team/
    AddTeamMemberDialog.tsx
    TeamMemberCard.tsx
  
  accountant/
    TransactionCard.tsx
    WithdrawalRequest.tsx
    FinancialChart.tsx
  
  moderator/
    ReportCard.tsx
    VerificationBadge.tsx
  
  support/
    TicketCard.tsx
    TicketChat.tsx
    QuickReplyTemplates.tsx
```

---

## Section technique

### Migration SQL

```text
-- Ajout des nouveaux roles
ALTER TYPE user_role ADD VALUE 'accountant';
ALTER TYPE user_role ADD VALUE 'supervisor';
ALTER TYPE user_role ADD VALUE 'moderator';
ALTER TYPE user_role ADD VALUE 'support';

-- Table transactions
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  type text NOT NULL CHECK (type IN ('payment', 'commission', 'withdrawal')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  provider_id uuid,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid
);

-- Table withdrawals
CREATE TABLE withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL,
  account_details jsonb,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  rejection_reason text
);

-- Table reports
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  reported_product_id uuid,
  type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- Table support_tickets
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text DEFAULT 'medium',
  assigned_to uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table support_messages
CREATE TABLE support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Fonctions de verification de role
CREATE FUNCTION is_accountant(_user_id uuid) RETURNS boolean AS $$
  SELECT has_role(_user_id, 'accountant')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- (idem pour supervisor, moderator, support)

-- Politiques RLS pour chaque table et role
```

### Estimation de la complexite

- Migrations de base de donnees: Haute
- Mise a jour useAuth: Moyenne  
- Interfaces Comptable: Haute (rapports, graphiques)
- Interfaces Superviseur: Moyenne
- Interfaces Moderateur: Haute (verification de contenu)
- Interfaces Support: Haute (systeme de tickets)
- Gestion des membres: Moyenne

---

## Ordre d'implementation recommande

1. **Migration de base de donnees** - Extension de l'enum et creation des tables
2. **Mise a jour useAuth et types** - Support des nouveaux roles
3. **Mise a jour DashboardLayout** - Navigation dynamique
4. **Interface Superviseur** - La plus simple, bonne pour valider l'architecture
5. **Interface Comptable** - Fonctionnalites financieres
6. **Interface Moderateur** - Verification de contenu
7. **Interface Support** - Systeme de tickets
8. **Page d'administration des membres** - Ajout de membres par l'admin

