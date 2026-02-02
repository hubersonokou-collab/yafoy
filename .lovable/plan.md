
# Plan : Boutons d'accès aux interfaces par rôle sur la page d'accueil

## Problème Actuel

Sur la page d'accueil (HeroSection), seuls 3 types de boutons sont affichés pour les utilisateurs connectés :
- **Admin/Super Admin** : "Accéder à l'administration" → `/admin`
- **Prestataire** : "Mon espace prestataire" → `/provider`
- **Client** : "Mon espace client" → `/client`

Les rôles d'équipe (Comptable, Superviseur, Modérateur, Support) n'ont pas de bouton dédié pour accéder à leur interface.

---

## Solution

Ajouter des boutons d'accès pour chaque rôle d'équipe sur la page d'accueil, avec le même style que les boutons existants.

### Nouveaux boutons à ajouter

| Rôle | Texte du bouton | Destination |
|------|----------------|-------------|
| Comptable | Accéder à l'interface comptable | `/team/accountant` |
| Superviseur | Accéder à l'interface superviseur | `/team/supervisor` |
| Modérateur | Accéder à l'interface modérateur | `/team/moderator` |
| Support | Accéder à l'interface support | `/team/support` |

---

## Fichier à modifier

### src/components/landing/HeroSection.tsx

**Modifications :**

1. Importer les fonctions de vérification de rôle manquantes depuis `useAuth` :
   - `isAccountant`
   - `isSupervisor`
   - `isModerator`
   - `isSupport`

2. Ajouter les boutons conditionnels après les boutons existants (lignes 62-85) :

```text
Structure des boutons (ordre d'affichage) :
1. Admin/Super Admin → "Accéder à l'administration"
2. Comptable → "Accéder à l'interface comptable"
3. Superviseur → "Accéder à l'interface superviseur"
4. Modérateur → "Accéder à l'interface modérateur"
5. Support → "Accéder à l'interface support"
6. Prestataire → "Mon espace prestataire"
7. Client → "Mon espace client"
8. Bouton "Explorer le catalogue" (toujours visible)
```

---

## Détails techniques

### Code à ajouter dans HeroSection.tsx

Après la ligne 7, mettre à jour la destructuration :
```typescript
const { user, isAdmin, isSuperAdmin, isProvider, isClient, isAccountant, isSupervisor, isModerator, isSupport } = useAuth();
```

Après le bloc admin (ligne 69), ajouter les nouveaux boutons :

```typescript
{isAccountant() && (
  <Link to="/team/accountant">
    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
      Accéder à l'interface comptable
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  </Link>
)}
{isSupervisor() && (
  <Link to="/team/supervisor">
    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
      Accéder à l'interface superviseur
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  </Link>
)}
{isModerator() && (
  <Link to="/team/moderator">
    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
      Accéder à l'interface modérateur
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  </Link>
)}
{isSupport() && (
  <Link to="/team/support">
    <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
      Accéder à l'interface support
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  </Link>
)}
```

---

## Résumé des changements

| Fichier | Modification |
|---------|-------------|
| `src/components/landing/HeroSection.tsx` | Ajouter 4 boutons pour les rôles d'équipe (comptable, superviseur, modérateur, support) |

---

## Résultat attendu

Lorsqu'un utilisateur clique sur "Retour au site" depuis son tableau de bord et arrive sur la page d'accueil, il verra un bouton correspondant à son rôle :

- **Comptable** → "Accéder à l'interface comptable"
- **Superviseur** → "Accéder à l'interface superviseur"  
- **Modérateur** → "Accéder à l'interface modérateur"
- **Support** → "Accéder à l'interface support"

Cela permet une navigation fluide et cohérente pour tous les rôles de la plateforme.
