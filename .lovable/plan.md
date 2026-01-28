

# Plan de Completion du Projet YAFOY

Ce plan detaille toutes les interfaces a creer pour completer les deux parcours utilisateurs principaux selon le cahier des charges.

---

## Etat Actuel du Projet

### Deja Implemente
| Module | Statut |
|--------|--------|
| Authentification multi-roles (email/telephone/invite) | Complet |
| Interface vocale (Web Speech API) | Complet |
| Dashboard Admin/Super Admin | Complet |
| Dashboard Provider (produits, commandes) | Partiel |
| Dashboard Client (catalogue, commandes) | Partiel |
| Upload images produits | Complet |

### Manquant (selon le CDC)
| Module | Priorite |
|--------|----------|
| Page Favoris Client | Haute |
| Page Parametres Client/Provider | Haute |
| Page Commandes Provider | Haute |
| Profil Public Prestataire | Haute |
| Page Detail Produit | Haute |
| Messagerie interne | Moyenne |
| Systeme d'avis et notations | Moyenne |
| Notifications in-app | Moyenne |

---

## Parcours 1: Organisateur de Ceremonie (Client)

### 1.1 Page d'Accueil Enrichie (Icon-First)
**Fichier:** `src/pages/Index.tsx`

Modifications:
- Ajouter une grille de categories avec grandes icones visuelles
- Integrer la recherche vocale directement dans le hero
- Ajouter des boutons d'action visuels avec retour tactile
- Afficher les produits populaires avec images reelles

### 1.2 Page Detail Produit
**Nouveau fichier:** `src/pages/client/ProductDetail.tsx`

Contenu:
- Galerie d'images avec carousel
- Informations du prestataire avec badge verifie
- Prix et caution clairement affiches
- Bouton de reservation avec option vocale
- Avis des clients precedents
- Bouton "Contacter le prestataire"
- Lecture vocale de la description (TTS)

### 1.3 Page Favoris
**Nouveau fichier:** `src/pages/client/ClientFavorites.tsx`

Contenu:
- Liste des produits favoris
- Actions rapides (supprimer, reserver)
- Interface Icon-First avec grandes vignettes

### 1.4 Page Parametres Client
**Nouveau fichier:** `src/pages/client/ClientSettings.tsx`

Contenu:
- Modification du profil (nom, telephone, email)
- Avatar/photo de profil
- Preferences de notification
- Gestion des adresses de livraison
- Deconnexion

### 1.5 Amelioration Catalogue
**Fichier:** `src/pages/client/ClientCatalog.tsx`

Modifications:
- Integrer VoiceSearch dans les filtres
- Afficher les images des produits (pas seulement l'icone Package)
- Ajouter bouton favori sur chaque produit
- Afficher note moyenne du prestataire

### 1.6 Amelioration Page Commandes Client
**Fichier:** `src/pages/client/ClientOrders.tsx`

Modifications:
- Timeline visuelle du statut de commande
- Bouton "Contacter prestataire" par commande
- Option "Laisser un avis" pour commandes terminees
- Affichage des items de la commande

---

## Parcours 2: Prestataire (Gestion Simplifiee)

### 2.1 Page Commandes Prestataire
**Nouveau fichier:** `src/pages/provider/ProviderOrders.tsx`

Contenu:
- Liste des commandes recues avec filtres (en attente, confirmees, terminees)
- Actions: Accepter, Refuser, Marquer comme termine
- Detail de chaque commande avec informations client
- Timeline de progression
- Bouton "Contacter client"

### 2.2 Page Parametres Prestataire
**Nouveau fichier:** `src/pages/provider/ProviderSettings.tsx`

Contenu:
- Modification du profil professionnel
- Description de l'entreprise
- Conditions generales de location
- Zone de service/localisation
- Horaires de disponibilite
- Documents et certifications

### 2.3 Profil Public Prestataire
**Nouveau fichier:** `src/pages/provider/ProviderPublicProfile.tsx`

Contenu:
- Galerie de tous les produits
- Informations de l'entreprise
- Avis et notations des clients
- Badge "Verifie" si applicable
- Statistiques (nombre de locations, note moyenne)
- Bouton de contact

### 2.4 Amelioration Dashboard Prestataire
**Fichier:** `src/pages/provider/ProviderDashboard.tsx`

Modifications:
- Ajouter notifications des nouvelles commandes
- Quick actions avec grandes icones
- Statistiques de performance

---

## Composants Partages a Creer

### 3.1 Composants d'Avis
**Nouveaux fichiers:**
```text
src/components/reviews/
  StarRating.tsx        - Composant d'etoiles interactif
  ReviewCard.tsx        - Carte d'avis individuel
  ReviewForm.tsx        - Formulaire pour laisser un avis
  ReviewList.tsx        - Liste paginee des avis
```

### 3.2 Composants Favoris
**Nouveau fichier:** `src/components/favorites/FavoriteButton.tsx`

Contenu:
- Bouton coeur pour ajouter/retirer des favoris
- Animation au clic
- Integration avec table favoris

### 3.3 Composants de Commande
**Nouveaux fichiers:**
```text
src/components/orders/
  OrderTimeline.tsx     - Timeline visuelle du statut
  OrderCard.tsx         - Carte de commande reutilisable
  OrderActions.tsx      - Actions contextuelles (accepter, refuser, etc.)
```

### 3.4 Composant Profil Prestataire
**Nouveau fichier:** `src/components/provider/ProviderCard.tsx`

Contenu:
- Mini-carte affichant les infos du prestataire
- Note moyenne, badge verifie
- Bouton "Voir profil"

### 3.5 Galerie d'Images
**Nouveau fichier:** `src/components/products/ImageGallery.tsx`

Contenu:
- Carousel d'images avec miniatures
- Zoom sur clic
- Navigation fleches et swipe

---

## Migrations Base de Donnees

### 4.1 Table Favoris
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their favorites" ON favorites
  FOR ALL USING (user_id = auth.uid());
```

### 4.2 Table Avis
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id),
  provider_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  comment TEXT,
  provider_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, client_id)
);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews" ON reviews FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Providers can respond to reviews" ON reviews FOR UPDATE 
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());
```

### 4.3 Table Notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
```

---

## Routes a Ajouter

Modification de `src/App.tsx`:

```text
// Client Routes (nouveaux)
/client/product/:id     -> ProductDetail.tsx
/client/favorites       -> ClientFavorites.tsx
/client/settings        -> ClientSettings.tsx

// Provider Routes (nouveaux)
/provider/orders        -> ProviderOrders.tsx (remplace AdminOrders)
/provider/settings      -> ProviderSettings.tsx
/provider/profile/:id   -> ProviderPublicProfile.tsx

// Route publique
/provider/:id           -> ProviderPublicProfile.tsx (accessible sans auth)
```

---

## Ordre d'Implementation

### Etape 1: Infrastructure (migrations)
1. Creer les tables favorites, reviews, notifications
2. Configurer les RLS policies

### Etape 2: Composants Reutilisables
1. StarRating, FavoriteButton
2. OrderTimeline, OrderCard
3. ImageGallery, ProviderCard

### Etape 3: Pages Client
1. ProductDetail (essentiel pour le parcours)
2. ClientFavorites
3. ClientSettings
4. Ameliorations ClientCatalog et ClientOrders

### Etape 4: Pages Prestataire
1. ProviderOrders
2. ProviderSettings
3. ProviderPublicProfile

### Etape 5: Integration Vocale
1. Ajouter commandes vocales pour les nouvelles pages
2. TTS pour la lecture des informations produit

---

## Details Techniques

### Architecture des Composants

```text
src/
  components/
    favorites/
      FavoriteButton.tsx
    orders/
      OrderTimeline.tsx
      OrderCard.tsx
      OrderActions.tsx
    products/
      ImageGallery.tsx
      ProductCard.tsx
    provider/
      ProviderCard.tsx
      ProviderStats.tsx
    reviews/
      StarRating.tsx
      ReviewCard.tsx
      ReviewForm.tsx
      ReviewList.tsx
    notifications/
      NotificationBell.tsx
      NotificationCenter.tsx
  pages/
    client/
      ProductDetail.tsx
      ClientFavorites.tsx
      ClientSettings.tsx
    provider/
      ProviderOrders.tsx
      ProviderSettings.tsx
      ProviderPublicProfile.tsx
```

### Interactions Vocales Prevues

| Commande | Action |
|----------|--------|
| "Voir produit [nom]" | Ouvre le detail du produit |
| "Ajouter aux favoris" | Ajoute le produit actuel aux favoris |
| "Mes favoris" | Navigue vers la page favoris |
| "Reserver ce produit" | Ouvre le dialogue de reservation |
| "Lire la description" | TTS de la description produit |
| "Contacter prestataire" | Ouvre le chat |

### Palette de Couleurs (rappel)
- **Orange Vif**: Boutons d'action principaux
- **Bleu Nuit**: Navigation et textes importants
- **Or/Jaune Dore**: Badges verifies et etoiles
- **Vert Emeraude**: Validations
- **Rouge Corail**: Alertes et annulations

---

## Estimation des Fichiers

| Type | Nouveaux | Modifies |
|------|----------|----------|
| Pages | 6 | 4 |
| Composants | 12 | 2 |
| Migrations SQL | 3 | 0 |
| **Total** | **21 fichiers** | **6 fichiers** |

