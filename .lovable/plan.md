
# Plan : Consultation des profils Fournisseurs et Clients depuis l'Admin

## Objectif
Permettre aux administrateurs de consulter les profils complets des fournisseurs (avec leurs produits, avis, statistiques) et des clients (avec leur historique de commandes, favoris) directement depuis le tableau de bord admin.

---

## Approche choisie

Plutot que de creer des pages separees, nous allons utiliser un **Dialog/Modal** pour afficher les details des profils. Cela permet une navigation rapide sans quitter la liste des utilisateurs.

Pour les fournisseurs, nous ajouterons egalement un lien direct vers leur profil public.

---

## Etape 1 : Creer le composant UserProfileDialog

**Nouveau fichier : `src/components/admin/UserProfileDialog.tsx`**

Ce composant affichera les details selon le role de l'utilisateur :

### Pour les Fournisseurs (Prestataires) :
- Avatar et informations de base (nom, telephone, localisation)
- Badge de verification
- Statistiques : nombre de produits, avis, note moyenne, commandes completees
- Liste des produits (avec miniatures, prix, statut)
- Lien vers le profil public `/provider/:id`

### Pour les Clients :
- Avatar et informations de base
- Statistiques : nombre de commandes, montant total depense
- Historique des commandes recentes (5 dernieres)
- Produits favoris

---

## Etape 2 : Modifier AdminUsers.tsx

**Fichier : `src/pages/admin/AdminUsers.tsx`**

Modifications :
1. Ajouter un etat pour l'utilisateur selectionne
2. Connecter le bouton "Voir le profil" pour ouvrir le dialog
3. Ajouter des onglets/filtres pour separer Clients / Fournisseurs / Tous
4. Importer et utiliser le composant `UserProfileDialog`

---

## Etape 3 : Creer le composant ProviderProductsList

**Nouveau fichier : `src/components/admin/ProviderProductsList.tsx`**

Affiche une liste compacte des produits d'un fournisseur :
- Miniature de l'image
- Nom du produit
- Prix par jour
- Statut (actif/inactif, verifie)
- Bouton pour voir le produit dans le catalogue

---

## Etape 4 : Creer le composant ClientOrdersList

**Nouveau fichier : `src/components/admin/ClientOrdersList.tsx`**

Affiche l'historique des commandes d'un client :
- Date de la commande
- Montant total
- Statut (badge colore)
- Lien vers les details de la commande

---

## Etape 5 : Creer le barrel export

**Nouveau fichier : `src/components/admin/index.ts`**

Exporte tous les composants admin pour faciliter les imports.

---

## Structure des nouveaux fichiers

```text
src/
└── components/
    └── admin/
        ├── UserProfileDialog.tsx    (nouveau)
        ├── ProviderProductsList.tsx (nouveau)
        ├── ClientOrdersList.tsx     (nouveau)
        └── index.ts                 (nouveau)
```

---

## Details techniques

### Donnees a recuperer pour un Fournisseur

```typescript
// Profil
const profile = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Produits
const products = await supabase
  .from('products')
  .select('*, category:categories(name)')
  .eq('provider_id', userId);

// Avis et statistiques
const reviews = await supabase
  .from('reviews')
  .select('rating')
  .eq('provider_id', userId);

// Commandes completees
const orders = await supabase
  .from('orders')
  .select('*', { count: 'exact' })
  .eq('provider_id', userId)
  .eq('status', 'completed');
```

### Donnees a recuperer pour un Client

```typescript
// Profil
const profile = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Commandes
const orders = await supabase
  .from('orders')
  .select('*')
  .eq('client_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);

// Favoris
const favorites = await supabase
  .from('favorites')
  .select('*, product:products(id, name, images, price_per_day)')
  .eq('user_id', userId);
```

---

## Design du Dialog

```text
+------------------------------------------+
|  [X]     Profil Utilisateur              |
+------------------------------------------+
|  +--------+                              |
|  | Avatar |  Jean Dupont                 |
|  +--------+  Prestataire  [Badge Verifie]|
|              +225 07 12 34 56            |
|              Abidjan, Cote d'Ivoire      |
+------------------------------------------+
|  [Stats Cards]                           |
|  +--------+  +--------+  +--------+      |
|  |   12   |  |  4.5★  |  |   45   |      |
|  |Produits|  | Note   |  |Commandes|     |
|  +--------+  +--------+  +--------+      |
+------------------------------------------+
|  Produits (12)                           |
|  +--------------------------------------+|
|  | [img] Tente 10x10   50,000 FCFA [V] ||
|  | [img] Sonorisation  25,000 FCFA [V] ||
|  | [img] Eclairage     15,000 FCFA     ||
|  +--------------------------------------+|
+------------------------------------------+
|  [ Voir profil public ]                  |
+------------------------------------------+
```

---

## Policies RLS

Les admins peuvent deja consulter toutes les donnees necessaires grace aux policies existantes :
- `profiles` : Moderators/Supervisors/Support peuvent voir tous les profils
- `products` : Admins peuvent gerer tous les produits
- `orders` : Admins peuvent gerer toutes les commandes
- `reviews` : Tout le monde peut voir les avis

Pour les admins, il faudra ajouter une policy sur `profiles` :

```sql
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()));
```

---

## Responsive Design

Le dialog sera entierement responsive :
- Sur desktop : dialog large (max-w-2xl) avec grille 2 colonnes
- Sur mobile : dialog pleine largeur avec scroll, une seule colonne

---

## Resultat attendu

Apres implementation :
1. Cliquer sur "Voir le profil" dans la liste des utilisateurs ouvrira un dialog detaille
2. Pour les fournisseurs : affichage de tous leurs produits, avis et statistiques
3. Pour les clients : affichage de leur historique de commandes et favoris
4. Un bouton permet d'acceder au profil public des fournisseurs
5. Interface responsive et fluide
