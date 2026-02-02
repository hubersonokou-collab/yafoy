
# Plan d'Implementation - Actions sur les Membres d'Equipe et Interfaces par Role

## Resume

Ce plan ajoute les fonctionnalites suivantes :
1. Actions de gestion des membres d'equipe (supprimer, modifier le role, modifier les informations)
2. Confirmation que chaque role a bien son interface dediee
3. Le moderateur utilise l'interface client avec ses fonctionnalites supplementaires

---

## Analyse de l'Existant

### Interfaces par role actuellement :
| Role | Interface actuelle | Statut |
|------|-------------------|--------|
| super_admin | /admin/* | OK |
| admin | /admin/* | OK |
| provider | /provider/* | OK |
| client | /client/* | OK |
| accountant | /team/accountant | 	Un modificateur selon demandé|
| supervisor | /team/supervisor | 	Un modificateur selon demandé|
| moderator | /team/moderator | A modifier selon demande |
| support | /team/support | 	Un modificateur selon demandé|

### Ce qui manque :
1. Actions de suppression/modification des membres dans AdminTeam.tsx
2. Dialog de modification d'un membre (role + infos profil)
3. Edge function pour supprimer un membre d'equipe
4. Edge function pour modifier le role d'un membre
5. Redirection du moderateur vers l'interface client

---

## Etapes d'Implementation

### Etape 1 : Creer une Edge Function pour gerer les membres d'equipe

Creer `supabase/functions/manage-team-member/index.ts` qui supporte :
- `DELETE` : Supprimer un membre d'equipe (supprime le role + optionnellement l'utilisateur)
- `PATCH` : Modifier le role d'un membre ou ses informations de profil

Securite :
- Seuls les admin/super_admin peuvent modifier des membres
- Un super_admin ne peut pas etre supprime sauf par lui-meme
- Un admin ne peut pas supprimer/modifier un autre admin ou super_admin

### Etape 2 : Creer un composant TeamMemberActions

Creer `src/components/team/TeamMemberActions.tsx` avec :
- Menu dropdown avec 3 actions : Modifier le profil, Changer le role, Supprimer
- Dialog de confirmation pour la suppression
- Dialog de modification du profil (nom, telephone, localisation)
- Dialog de changement de role

### Etape 3 : Creer un composant EditTeamMemberDialog

Creer `src/components/team/EditTeamMemberDialog.tsx` pour :
- Modifier le nom complet
- Modifier le telephone
- Modifier la localisation
- Appeler l'edge function avec les nouvelles informations

### Etape 4 : Creer un composant ChangeRoleDialog

Creer `src/components/team/ChangeRoleDialog.tsx` pour :
- Afficher le role actuel
- Permettre de selectionner un nouveau role
- Appeler l'edge function pour changer le role

### Etape 5 : Mettre a jour AdminTeam.tsx

Modifier la page pour :
- Ajouter le menu d'actions pour chaque membre
- Afficher l'email du membre (necessaire pour l'identification)
- Ajouter le bouton de suppression avec confirmation

### Etape 6 : Rediriger le moderateur vers l'interface client

Modifier les fichiers suivants :
- `src/pages/Auth.tsx` : Rediriger le moderateur vers `/client` au lieu de `/team/moderator`
- `src/components/dashboard/DashboardLayout.tsx` : Quand le moderateur est sur une route `/client/*`, afficher la navigation client avec un badge "Moderateur" et un lien vers le dashboard moderateur

### Etape 7 : Ajouter un lien "Mode Moderation" pour le moderateur

Dans la navigation client, ajouter un bouton special pour les moderateurs qui les amene a `/team/moderator` pour leurs taches de moderation specifiques (verification produits, signalements).

---

## Fichiers a Creer

| Fichier | Description |
|---------|-------------|
| `supabase/functions/manage-team-member/index.ts` | Edge function pour modifier/supprimer les membres |
| `src/components/team/TeamMemberActions.tsx` | Menu d'actions pour chaque membre |
| `src/components/team/EditTeamMemberDialog.tsx` | Dialog de modification du profil |
| `src/components/team/ChangeRoleDialog.tsx` | Dialog de changement de role |

## Fichiers a Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/pages/admin/AdminTeam.tsx` | Ajouter le composant TeamMemberActions, afficher l'email |
| `src/components/team/index.ts` | Exporter les nouveaux composants |
| `src/pages/Auth.tsx` | Rediriger moderateur vers /client |
| `src/components/dashboard/DashboardLayout.tsx` | Navigation speciale pour moderateur en mode client |
| `supabase/config.toml` | Ajouter la nouvelle edge function |

---

## Details Techniques

### Edge Function manage-team-member

```text
DELETE /functions/v1/manage-team-member
Headers: Authorization: Bearer <token>
Body: { userId: string }
Response: { success: true, message: "..." }

PATCH /functions/v1/manage-team-member  
Headers: Authorization: Bearer <token>
Body: { 
  userId: string,
  action: "update_role" | "update_profile",
  data: { role?: string, fullName?: string, phone?: string, location?: string }
}
Response: { success: true, user: {...} }
```

### Interface TeamMemberActions

```text
[...] <- DropdownMenu trigger
  |
  +-- Modifier le profil (ouvre EditTeamMemberDialog)
  +-- Changer le role (ouvre ChangeRoleDialog)
  +-- Supprimer (AlertDialog de confirmation)
```

### Flux moderateur

```text
Connexion moderateur
       |
       v
Redirection vers /client (interface client)
       |
       +-- Navigation client normale
       |
       +-- Badge "Moderateur" visible
       |
       +-- Bouton "Mode Moderation" -> /team/moderator
              |
              v
       Dashboard moderation (signalements, produits)
```

---

## Interface Moderateur Simplifiee

Le moderateur aura :
1. Acces a l'interface client complete (/client/*)
2. Un badge "Moderateur" dans la sidebar
3. Un lien "Mode Moderation" qui amene vers /team/moderator
4. Sur /team/moderator : verification des produits et gestion des signalements

Cela permet au moderateur de voir l'experience utilisateur tout en ayant acces aux outils de moderation.

---

## Regles de Securite

1. Un admin peut modifier/supprimer : accountant, supervisor, moderator, support
2. Un super_admin peut modifier/supprimer : tout sauf lui-meme
3. Personne ne peut se supprimer soi-meme (sauf super_admin via autre methode)
4. Seul un super_admin peut creer/modifier un admin
5. Les changements sont loggues pour audit

---

## Estimation

- Edge Function : 1 fichier
- Nouveaux composants : 3 fichiers
- Modifications : 5 fichiers
- Total : ~9 fichiers a creer/modifier
