

# Plan d'Implementation - Gestion de l'Equipe YAFOY

## Resume

Ce plan ajoute la fonctionnalite complete de gestion d'equipe permettant aux administrateurs de creer des membres avec email/mot de passe et de leur attribuer des roles specifiques. Chaque role aura son propre tableau de bord avec les fonctionnalites appropriees.

---

## Analyse de l'Existant

### Roles deja configures dans la base de donnees
- super_admin, admin, provider, client, accountant, supervisor, moderator, support

### Interfaces existantes
- Admin : Dashboard complet avec gestion utilisateurs, produits, commandes, transactions
- Provider : Dashboard, produits, commandes, parametres
- Client : Dashboard, catalogue, commandes, favoris, planificateur

### Ce qui manque
1. Tableaux de bord dedies pour les roles d'equipe (Comptable, Superviseur, Moderateur, Support)
2. Edge function pour creer des utilisateurs (l'admin doit pouvoir creer des comptes)
3. Navigation specifique pour chaque role dans DashboardLayout
4. Formulaire complet d'ajout de membre avec email + mot de passe

---

## Architecture Proposee

```text
+------------------+     +------------------------+     +-------------------+
|  AddTeamMember   | --> | Edge Function          | --> | Supabase Auth     |
|  Dialog (Admin)  |     | create-team-member     |     | + user_roles      |
+------------------+     +------------------------+     +-------------------+
        |                         |
        v                         v
+------------------+     +------------------------+
| Email + Password |     | Service Role Key       |
| + Role Selection |     | (cree l'utilisateur)   |
+------------------+     +------------------------+
```

---

## Etapes d'Implementation

### Etape 1 : Edge Function pour creer des membres d'equipe

Creer `supabase/functions/create-team-member/index.ts` qui :
- Verifie que l'appelant est admin/super_admin
- Utilise le service role key pour creer l'utilisateur dans auth.users
- Insere le role dans user_roles
- Cree le profil dans profiles
- Retourne les informations du nouvel utilisateur

### Etape 2 : Mettre a jour AddTeamMemberDialog

Modifier le composant pour :
- Ajouter un champ mot de passe
- Ajouter un champ nom complet
- Appeler l'edge function pour creer le membre
- Afficher un message de succes avec les informations

### Etape 3 : Creer les tableaux de bord d'equipe

#### 3.1 Tableau de bord Comptable (`/team/accountant`)
- Acces aux transactions (deja accessible via AdminTransactions)
- Statistiques financieres
- Gestion des retraits prestataires
- Rapports financiers

#### 3.2 Tableau de bord Superviseur (`/team/supervisor`)
- Vue des commandes avec details complets
- Informations clients et prestataires
- Contacts et localisations

#### 3.3 Tableau de bord Moderateur (`/team/moderator`)
- Verification des profils prestataires
- Controle des contenus (photos/descriptions)
- Gestion des signalements (reports)
- Validation/blocage de produits

#### 3.4 Tableau de bord Support (`/team/support`)
- Gestion des tickets de support
- Messagerie avec les utilisateurs
- Aide aux plaintes

### Etape 4 : Mettre a jour DashboardLayout

Ajouter les navigations specifiques pour chaque role :
- accountantNav : Transactions, Retraits, Rapports
- supervisorNav : Commandes, Suivi
- moderatorNav : Verification, Signalements, Produits
- supportNav : Tickets, Assistance

### Etape 5 : Ajouter les routes dans App.tsx

Nouvelles routes pour les roles d'equipe :
- `/team/accountant/*`
- `/team/supervisor/*`
- `/team/moderator/*`
- `/team/support/*`

### Etape 6 : Ajouter "Equipe" dans la navigation admin

Ajouter l'option "Equipe" dans le menu admin (si pas deja present) pointant vers `/admin/team`

---

## Fichiers a Creer

| Fichier | Description |
|---------|-------------|
| `supabase/functions/create-team-member/index.ts` | Edge function creation utilisateur |
| `src/pages/team/AccountantDashboard.tsx` | Dashboard comptable |
| `src/pages/team/SupervisorDashboard.tsx` | Dashboard superviseur |
| `src/pages/team/ModeratorDashboard.tsx` | Dashboard moderateur |
| `src/pages/team/SupportDashboard.tsx` | Dashboard support |

## Fichiers a Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/components/team/AddTeamMemberDialog.tsx` | Ajouter champs mot de passe et nom, appeler edge function |
| `src/components/dashboard/DashboardLayout.tsx` | Ajouter navigations pour chaque role d'equipe |
| `src/App.tsx` | Ajouter routes /team/* |
| `src/hooks/useAuth.tsx` | Deja OK - les fonctions role check existent |

---

## Details Techniques

### Edge Function create-team-member

```text
POST /functions/v1/create-team-member
Headers: Authorization: Bearer <user_token>
Body: {
  email: string,
  password: string,
  fullName: string,
  role: 'admin' | 'accountant' | 'supervisor' | 'moderator' | 'support'
}
```

Securite :
- Verification JWT de l'appelant
- Verification que l'appelant est admin ou super_admin
- Utilisation du SUPABASE_SERVICE_ROLE_KEY pour creer l'utilisateur

### Navigation par Role

```text
Comptable:
- Tableau de bord -> /team/accountant
- Transactions -> /admin/transactions (acces partage)
- Retraits -> /team/accountant/withdrawals

Superviseur:
- Tableau de bord -> /team/supervisor
- Commandes -> /team/supervisor/orders

Moderateur:
- Tableau de bord -> /team/moderator
- Verification -> /team/moderator/verification
- Signalements -> /team/moderator/reports

Support:
- Tableau de bord -> /team/support
- Tickets -> /team/support/tickets
```

### Redirection apres connexion

Modifier `Auth.tsx` pour rediriger les roles d'equipe vers leur dashboard :
- accountant -> /team/accountant
- supervisor -> /team/supervisor
- moderator -> /team/moderator
- support -> /team/support

---

## Estimation

- Edge Function : 1 fichier
- Dashboards equipe : 4 fichiers
- Modifications : 4 fichiers
- Total : ~9 fichiers a creer/modifier










en reumé tu doit ajouter sa :

4️⃣ Modérateur
👉 Le gardien de la qualité

Rôles :

Vérifier les profils prestataires

Contrôler les contenus (photos, descriptions)

Supprimer les faux comptes

Gérer les signalements

Aider à maintenir la crédibilité du site

📌 Utile quand la plateforme grandit

5️⃣ Gestionnaire de paiements / Finance
👉 L’argent du site 💰

Rôles :

Suivre les paiements

Gérer les commissions

Valider les retraits des prestataires

Gérer Mobile Money / cartes bancaires

Produire des rapports financiers

📌 Peut être combiné avec l’admin au début

6️⃣ Support Client
👉 L’assistance utilisateurs

Rôles :

Répondre aux questions clients et prestataires

Aider à la création de comptes

Gérer les plaintes simples

Accompagner les nouveaux utilisateurs

📌 Très important pour la confiance

7️⃣ Visiteur (Non connecté)
👉 Les curieux 👀

Droits :

Voir les prestataires

Consulter les services

Lire les avis

MAIS pas de contact direct sans inscription

📌 Objectif : pousser à l’inscription

8️⃣ (Optionnel) Partenaire / Sponsor
👉 Pour la monétisation

Rôles :

Avoir une visibilité spéciale

Mettre des annonces sponsorisées

Être mis en avant sur la page d’accueil




