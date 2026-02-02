
# Plan : Pagination par groupes de 2 catégories + Popup détails membre d'équipe

## 1. Pagination du Catalogue par groupes de 2 catégories

### Problème actuel
La pagination actuelle pagine les **produits individuellement** (12 produits par page), ce qui mélange les catégories sur chaque page.

### Solution
Paginer par **groupes de 2 catégories** au lieu de paginer par produits individuels.

**Exemple :**
- Page 1 : Mobilier + Décoration
- Page 2 : Sonorisation + Éclairage
- Page 3 : Vaisselle + Transport
- Page 4 : Photographie + Traiteur

### Modifications dans ClientCatalog.tsx

1. **Supprimer** la pagination par produits (lignes 320-337)

2. **Créer** une logique de pagination par catégories :
```typescript
// Grouper les catégories qui ont des produits
const categoriesWithProducts = categories.filter(cat => 
  filteredProducts.some(p => p.category_id === cat.id)
);

// Pagination par groupes de 2 catégories
const CATEGORIES_PER_PAGE = 2;
const totalCategoryPages = Math.ceil(categoriesWithProducts.length / CATEGORIES_PER_PAGE);
const [categoryPage, setCategoryPage] = useState(1);

const startCatIndex = (categoryPage - 1) * CATEGORIES_PER_PAGE;
const endCatIndex = startCatIndex + CATEGORIES_PER_PAGE;
const paginatedCategories = categoriesWithProducts.slice(startCatIndex, endCatIndex);
```

3. **Mettre à jour** l'affichage pour utiliser `paginatedCategories` au lieu de `productsByCategory`

4. **Adapter** les contrôles de pagination pour afficher les catégories au lieu des produits

---

## 2. Popup de détails pour les membres d'équipe

### Problème actuel
- Le dialogue de modification n'affiche que : Nom, Téléphone, Localisation
- L'email n'est pas affiché
- Pas de popup pour voir les infos quand on clique sur un membre

### Solution
Créer un nouveau composant `TeamMemberDetailsDialog` qui affiche les informations complètes d'un membre.

### Nouveau composant : src/components/team/TeamMemberDetailsDialog.tsx

```text
Structure du dialogue :
- En-tête avec avatar et nom
- Section Informations du compte :
  - Email (récupéré via Edge Function)
  - Rôle
  - Date d'ajout
- Section Profil :
  - Téléphone
  - Localisation
- Boutons d'action : Modifier, Changer le rôle, Fermer
```

### Modification de l'Edge Function manage-team-member

Ajouter une action `GET` pour récupérer les informations d'un utilisateur (email via auth.admin.getUserById) :

```typescript
// Nouvelle route GET pour obtenir les détails
if (req.method === 'GET') {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  
  // Récupérer l'email via auth.admin
  const { data: userData } = await adminClient.auth.admin.getUserById(userId);
  
  return Response.json({
    email: userData.user?.email,
    // autres infos...
  });
}
```

### Modification de AdminTeam.tsx

1. Ajouter un état pour le membre sélectionné et le dialogue
2. Rendre chaque carte de membre cliquable
3. Afficher le `TeamMemberDetailsDialog` au clic

```typescript
const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
const [showDetailsDialog, setShowDetailsDialog] = useState(false);

// Dans le rendu, rendre la carte cliquable
<div 
  onClick={() => {
    setSelectedMember(member);
    setShowDetailsDialog(true);
  }}
  className="cursor-pointer hover:bg-accent/50 transition-colors ..."
>
```

### Note de sécurité importante

**Le mot de passe ne peut PAS être affiché** pour des raisons de sécurité :
- Les mots de passe sont hashés en base de données (bcrypt)
- Supabase ne stocke jamais les mots de passe en clair
- Il est impossible de récupérer le mot de passe original

**Alternative proposée :** Ajouter un bouton "Réinitialiser le mot de passe" qui envoie un email de réinitialisation à l'utilisateur.

---

## Fichiers à créer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/pages/client/ClientCatalog.tsx` | Modifier | Pagination par groupes de 2 catégories |
| `src/components/team/TeamMemberDetailsDialog.tsx` | Créer | Popup de détails membre |
| `src/components/team/index.ts` | Modifier | Exporter le nouveau composant |
| `src/pages/admin/AdminTeam.tsx` | Modifier | Rendre les membres cliquables + intégrer le dialogue |
| `supabase/functions/manage-team-member/index.ts` | Modifier | Ajouter GET pour récupérer email + action reset password |

---

## Détails techniques

### Interface TeamMember enrichie
```typescript
interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string; // Ajouté
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    phone?: string | null;
    location?: string | null;
  };
}
```

### Boutons dans le dialogue de détails
1. **Voir les infos** : Email, rôle, date d'inscription, téléphone, localisation
2. **Modifier le profil** : Ouvre le dialogue d'édition existant
3. **Changer le rôle** : Ouvre le dialogue de changement de rôle existant
4. **Réinitialiser le mot de passe** : Envoie un email de réinitialisation (seul super_admin peut faire ça)
5. **Fermer** : Ferme le dialogue

---

## Résumé des changements

| Fonctionnalité | Avant | Après |
|----------------|-------|-------|
| Pagination catalogue | 12 produits/page mélangés | 2 catégories/page (ex: Mobilier + Décoration) |
| Clic sur membre équipe | Rien | Popup avec email, rôle, date, téléphone, localisation |
| Voir email membre | Impossible | Visible dans le popup (super_admin uniquement) |
| Mot de passe | Non affichable (sécurité) | Bouton "Réinitialiser" pour envoyer un email |
