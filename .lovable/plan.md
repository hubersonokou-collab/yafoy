
# Plan : Interfaces Dediees par Role d'Equipe

## Probleme Actuel

Les interfaces des roles d'equipe ne sont pas correctement separees :

1. **Moderateur** : Redirige vers `/client` (interface client) au lieu de son propre tableau de bord
2. **Comptable** : Navigation incomplete, renvoie vers des routes `/admin`
3. **Logique de navigation** : Les roles utilisent des routes partagees au lieu d'interfaces independantes

---

## Solution Proposee

Chaque role d'equipe aura sa propre interface complete et independante.

### 1. Redirection Apres Connexion (Auth.tsx)

Modifier les redirections pour que chaque role aille directement vers son interface dediee :

| Role | Redirection Actuelle | Nouvelle Redirection |
|------|---------------------|---------------------|
| Moderateur | `/client` | `/team/moderator` |
| Comptable | `/team/accountant` | `/team/accountant` (OK) |
| Superviseur | `/team/supervisor` | `/team/supervisor` (OK) |
| Support | `/team/support` | `/team/support` (OK) |

### 2. Navigation du Moderateur (DashboardLayout.tsx)

Supprimer `moderatorClientNav` et utiliser uniquement `moderatorNav` :

**Navigation actuelle (problematique)** :
```
moderatorClientNav: Accueil, Planifier, Catalogue, Commandes, Favoris, Mode Moderation, Parametres
```

**Nouvelle navigation (dediee)** :
```
moderatorNav: Tableau de bord, Signalements, Produits, Prestataires, Parametres
```

### 3. Navigation du Comptable (DashboardLayout.tsx)

Enrichir la navigation pour inclure toutes les fonctionnalites :

**Navigation actuelle** :
```
accountantNav: Tableau de bord, Transactions
```

**Nouvelle navigation** :
```
accountantNav: Tableau de bord, Transactions, Retraits, Rapports
```

Toutes les fonctionnalites restent dans `/team/accountant` (le dashboard existant contient deja les onglets).

### 4. Navigation du Support (DashboardLayout.tsx)

Enrichir la navigation :

**Nouvelle navigation** :
```
supportNav: Tableau de bord, Tickets, Creer un compte
```

---

## Fichiers a Modifier

### 1. src/pages/Auth.tsx
- Ligne 85-87 : Changer la redirection du moderateur de `/client` vers `/team/moderator`

### 2. src/components/dashboard/DashboardLayout.tsx
- Supprimer `moderatorClientNav` (lignes 67-76)
- Mettre a jour `moderatorNav` avec navigation complete
- Mettre a jour `accountantNav` avec navigation complete  
- Mettre a jour `supportNav` avec navigation complete
- Supprimer la logique speciale pour le moderateur sur les routes client (lignes 148-159)

### 3. src/pages/team/ModeratorDashboard.tsx
- Ajouter un onglet "Parametres" pour les parametres du compte moderateur
- S'assurer que toutes les fonctionnalites sont accessibles depuis cette interface

---

## Navigation Finale par Role

```text
Comptable (/team/accountant):
  - Tableau de bord (statistiques, graphiques, rapports)
  - Transactions (historique complet)
  - Retraits (validation des demandes)

Superviseur (/team/supervisor):
  - Tableau de bord (vue des commandes)
  - Commandes (liste complete avec details)

Moderateur (/team/moderator):
  - Tableau de bord (signalements, produits, prestataires)
  - Signalements (gestion des reports)
  - Produits (verification)
  - Prestataires (profils a verifier)

Support (/team/support):
  - Tableau de bord (tickets)
  - Tickets (gestion des demandes)
  - Creation de compte (aide aux utilisateurs)
```

---

## Resume des Changements

| Fichier | Modification |
|---------|-------------|
| Auth.tsx | Rediriger moderateur vers `/team/moderator` |
| DashboardLayout.tsx | Supprimer navigation client pour moderateur, enrichir navigations equipe |
| ModeratorDashboard.tsx | Interface complete et autonome (deja OK) |
| AccountantDashboard.tsx | Interface complete (deja OK avec onglets) |
| SupportDashboard.tsx | Interface complete (deja OK) |
| SupervisorDashboard.tsx | Interface complete (deja OK) |
