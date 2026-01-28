
# Plan de Correction et Interconnexion du Projet YAFOY

Ce plan vise a corriger les problemes de navigation, de redirection post-connexion, et d'interconnexion entre toutes les parties de l'application.

---

## Problemes Identifies

### 1. Redirection Post-Connexion
**Probleme:** Apres connexion, tous les utilisateurs sont rediriges vers `/` (page d'accueil) au lieu de leur dashboard respectif.

**Impact:** Les utilisateurs doivent naviguer manuellement vers leur espace de travail.

### 2. Page d'Accueil Non Connectee aux Dashboards
**Probleme:** La page Index (`/`) n'offre pas de liens vers les dashboards selon le role de l'utilisateur connecte.

**Impact:** Apres connexion, l'utilisateur voit uniquement "Explorer le catalogue" sans acces direct a son espace.

### 3. Boutons d'Action Non Fonctionnels
**Probleme:** Plusieurs boutons sur la page d'accueil ne sont pas lies a des actions concretes.

### 4. Erreur sur ProductDetail
**Probleme:** Dans les logs, une erreur `invalid input syntax for type uuid: ":id"` indique que la route `/client/product/:id` ne recupere pas correctement le parametre.

**Analyse:** Le fichier ProductDetail.tsx fonctionne correctement, l'erreur venait d'un acces direct a la route template.

---

## Plan de Correction

### Etape 1: Redirection Intelligente Post-Connexion

**Fichier:** `src/pages/Auth.tsx`

Modifier le useEffect qui gere la redirection pour prendre en compte le role de l'utilisateur:

```text
Avant:
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

Apres:
  useEffect(() => {
    if (user && !loading && userRole) {
      // Redirection selon le role
      if (userRole === 'super_admin' || userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'provider') {
        navigate('/provider');
      } else {
        navigate('/client');
      }
    }
  }, [user, loading, userRole, navigate]);
```

**Modifications necessaires:**
- Importer `userRole` depuis `useAuth()`
- Attendre que le role soit charge avant de rediriger
- Ajouter une condition pour les utilisateurs anonymes (invites)

### Etape 2: Page d'Accueil avec Navigation Contextuelle

**Fichier:** `src/pages/Index.tsx`

Ameliorer la page d'accueil pour:
1. Afficher des boutons d'action differents selon le role
2. Lier "Explorer le catalogue" vers `/client/catalog`
3. Ajouter un bouton "Mon espace" qui redirige vers le bon dashboard

```text
Structure des liens selon le role:
- Super Admin/Admin: "Tableau de bord" -> /admin
- Provider: "Mon espace prestataire" -> /provider
- Client: "Mon espace" -> /client
- Non connecte: "Commencer maintenant" -> /auth
```

### Etape 3: Liens de Navigation Complets

**Fichier:** `src/pages/Index.tsx`

Ajouter les liens manquants:
- "Decouvrir les offres" -> `/client/catalog`
- "Explorer le catalogue" -> `/client/catalog`

### Etape 4: Gestion des Utilisateurs Invites

**Fichiers:** `src/pages/Auth.tsx`, `src/pages/Index.tsx`

Les utilisateurs anonymes (invites) doivent:
1. Etre rediriges vers `/client` (catalogue accessible en lecture)
2. Avoir un message les invitant a creer un compte pour reserver

### Etape 5: Amelioration du Dashboard Client

**Fichier:** `src/pages/client/ClientDashboard.tsx`

S'assurer que les boutons "Reserver" sur les produits redirigent vers la page de detail:

```text
onClick={() => navigate(`/client/product/${product.id}`)}
```

### Etape 6: Liens Inter-Pages Provider

**Fichiers:**
- `src/pages/provider/ProviderDashboard.tsx`
- `src/pages/provider/ProviderProducts.tsx`
- `src/pages/provider/ProviderOrders.tsx`

Verifier que tous les liens de navigation fonctionnent:
- "Ajouter un produit" -> formulaire de creation
- "Voir tout" sur commandes -> `/provider/orders`
- "Voir tout" sur produits -> `/provider/products`

### Etape 7: Liens Inter-Pages Admin

**Fichiers:**
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminUsers.tsx`
- `src/pages/admin/AdminOrders.tsx`

Verifier la navigation entre les sections admin.

---

## Details Techniques des Modifications

### Modification 1: Auth.tsx - Redirection Intelligente

```text
// Imports a ajouter
const { user, signUp, signIn, ..., userRole, loading } = useAuth();

// Nouveau useEffect
useEffect(() => {
  if (!loading && user) {
    // Si pas encore de role charge, attendre
    if (userRole === null && !user.is_anonymous) {
      return; // Le role sera charge par useAuth
    }
    
    // Redirection selon le role ou statut anonyme
    if (user.is_anonymous) {
      navigate('/client');
    } else if (userRole === 'super_admin' || userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'provider') {
      navigate('/provider');
    } else {
      navigate('/client');
    }
  }
}, [user, loading, userRole, navigate]);
```

### Modification 2: Index.tsx - Navigation Contextuelle

```text
// Section boutons pour utilisateur connecte
{user && (
  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
    {/* Bouton vers le dashboard approprie */}
    {isSuperAdmin() || isAdmin() ? (
      <Link to="/admin">
        <Button size="lg" className="text-lg gap-2">
          <Shield className="h-5 w-5" />
          Administration
        </Button>
      </Link>
    ) : isProvider() ? (
      <Link to="/provider">
        <Button size="lg" className="text-lg gap-2">
          <Store className="h-5 w-5" />
          Mon espace prestataire
        </Button>
      </Link>
    ) : (
      <Link to="/client">
        <Button size="lg" className="text-lg gap-2">
          <User className="h-5 w-5" />
          Mon espace
        </Button>
      </Link>
    )}
    
    {/* Bouton catalogue toujours visible */}
    <Link to="/client/catalog">
      <Button variant="outline" size="lg" className="text-lg">
        Decouvrir les offres
      </Button>
    </Link>
  </div>
)}
```

### Modification 3: ClientDashboard.tsx - Liens Produits

```text
// Dans la grille des produits populaires
<Button 
  size="sm"
  onClick={() => navigate(`/client/product/${product.id}`)}
>
  Reserver
</Button>
```

---

## Fichiers a Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/pages/Auth.tsx` | Redirection post-connexion intelligente |
| `src/pages/Index.tsx` | Navigation contextuelle selon role |
| `src/pages/client/ClientDashboard.tsx` | Liens vers detail produit |
| `src/hooks/useAuth.tsx` | Aucune modification (deja complet) |

---

## Tests de Verification

Apres implementation, verifier les scenarios suivants:

1. **Connexion Admin/Super Admin**
   - Se connecter avec huberson.okou@groupecerco.com
   - Doit etre redirige vers `/admin`
   - Le dashboard admin doit afficher les statistiques

2. **Connexion Provider**
   - Creer un compte provider
   - Doit etre redirige vers `/provider`
   - Peut ajouter des produits

3. **Connexion Client**
   - Creer un compte client
   - Doit etre redirige vers `/client`
   - Peut parcourir le catalogue et passer des commandes

4. **Mode Invite**
   - Cliquer sur "Continuer en tant qu'invite"
   - Doit etre redirige vers `/client`
   - Peut voir le catalogue mais pas reserver sans compte

5. **Navigation depuis l'accueil**
   - Utilisateur connecte voit son bouton d'espace personnel
   - Les liens "Decouvrir les offres" fonctionnent

---

## Resume des Corrections

1. **Redirection intelligente**: Les utilisateurs seront automatiquement diriges vers leur dashboard
2. **Page d'accueil dynamique**: Affiche les bons liens selon le role
3. **Boutons fonctionnels**: Tous les CTA sont relies aux bonnes pages
4. **Interconnexion complete**: Navigation fluide entre toutes les sections
