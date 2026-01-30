
# Plan: Notifications et Panier Global dans la Planification d'Événements

## Résumé

Ce plan couvre deux fonctionnalités majeures :

1. **Cloche de notifications fonctionnelle** - Remplacer le badge statique "3" par un système de notifications réel connecté à la base de données
2. **Panier/Facture globale après les recommandations** - Améliorer le flux de planification pour montrer une facture globale au client et envoyer automatiquement des notifications aux prestataires

---

## 1. Système de Notifications

### Situation actuelle
- La cloche affiche un badge statique "3" sans connexion à la base de données
- La table `notifications` existe mais est vide
- Aucun hook ni composant pour gérer les notifications

### Changements proposés

#### 1.1 Créer un hook `useNotifications`
Fichier: `src/hooks/useNotifications.ts`

- Récupérer les notifications de l'utilisateur connecté depuis Supabase
- Écouter en temps réel les nouvelles notifications avec `realtime`
- Fournir des fonctions pour marquer comme lu et supprimer
- Compter les notifications non lues

#### 1.2 Créer un composant `NotificationPopover`
Fichier: `src/components/notifications/NotificationPopover.tsx`

- Afficher la liste des notifications dans un popover
- Icônes différentes selon le type (commande, message, avis)
- Bouton "Marquer tout comme lu"
- Navigation vers la ressource concernée au clic
- Badge avec le nombre de notifications non lues

#### 1.3 Intégrer dans le DashboardLayout
Fichier: `src/components/dashboard/DashboardLayout.tsx`

- Remplacer le bouton statique par le nouveau `NotificationPopover`

---

## 2. Panier et Facture Globale

### Situation actuelle
- Le client sélectionne des produits après les recommandations
- L'`InvoiceDisplay` montre une facture pro forma globale
- `handleCreateGlobalOrder` crée des commandes séparées par prestataire
- Aucune notification n'est envoyée aux prestataires

### Changements proposés

#### 2.1 Améliorer le flux du panier
Le flux actuel est déjà bien structuré :
- `recommendations` → sélection de produits
- `invoice` → affichage de la facture globale avec frais de service (5%)

Amélioration : Ajouter un récapitulatif par prestataire dans la facture pour plus de transparence.

#### 2.2 Envoyer des notifications aux prestataires
Fichier: `src/pages/client/ClientEventPlanner.tsx`

Modifier `handleCreateGlobalOrder` pour :
- Après création de chaque commande, insérer une notification pour le prestataire concerné
- Inclure les détails de la commande (type d'événement, date, montant)

Structure de la notification :
```text
type: 'new_order'
title: 'Nouvelle commande reçue'
body: 'Commande pour [Événement] - [Montant] FCFA'
data: { order_id, event_type, client_id }
```

#### 2.3 Afficher le récapitulatif par prestataire
Fichier: `src/components/event-planner/InvoiceDisplay.tsx`

Ajouter une section "Détail par prestataire" montrant :
- Nom du prestataire (si disponible)
- Liste des produits de ce prestataire
- Sous-total par prestataire

---

## Détails Techniques

### Base de données
Aucune migration nécessaire - la table `notifications` est déjà prête :
- `user_id` : UUID du destinataire
- `type` : type de notification ('new_order', 'order_update', 'new_message', 'new_review')
- `title` : titre de la notification
- `body` : description détaillée
- `read` : boolean (lu/non lu)
- `data` : JSONB pour les métadonnées

Problème RLS identifié : Actuellement, les utilisateurs ne peuvent pas INSÉRER de notifications car il n'y a pas de politique INSERT. Il faudra ajouter une politique permettant aux utilisateurs authentifiés d'insérer des notifications pour d'autres utilisateurs (ou utiliser une edge function avec le service role).

**Solution proposée** : Créer une edge function `create-notification` qui utilise le service role pour insérer les notifications.

### Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `src/hooks/useNotifications.ts` | Hook pour gérer les notifications |
| `src/components/notifications/NotificationPopover.tsx` | Composant popover des notifications |
| `src/components/notifications/NotificationItem.tsx` | Composant pour chaque notification |
| `src/components/notifications/index.ts` | Exports du module |
| `supabase/functions/create-notification/index.ts` | Edge function pour créer des notifications |

### Fichiers à modifier

| Fichier | Changement |
|---------|------------|
| `src/components/dashboard/DashboardLayout.tsx` | Remplacer la cloche statique par `NotificationPopover` |
| `src/pages/client/ClientEventPlanner.tsx` | Appeler l'edge function pour notifier les prestataires |
| `src/components/event-planner/InvoiceDisplay.tsx` | Ajouter le récapitulatif par prestataire |

### Responsivité
Tous les composants seront conçus pour :
- Desktop : Popover aligné à droite
- Mobile : Popover prenant plus de largeur (w-80 → w-[90vw] max-w-sm)
- Liste scrollable avec hauteur maximale

---

## Flux Utilisateur Final

```text
1. Client planifie un événement
                ↓
2. Système recommande des produits
                ↓
3. Client sélectionne les produits souhaités
                ↓
4. Client voit la FACTURE GLOBALE avec :
   - Récapitulatif de l'événement
   - Liste de tous les produits
   - Détail par prestataire
   - Sous-total + Frais 5% + Total TTC
                ↓
5. Client clique "Commander tout"
                ↓
6. Système crée une commande PAR prestataire
                ↓
7. Chaque prestataire reçoit une NOTIFICATION
                ↓
8. Client est redirigé vers "Mes commandes"
```

---

## Résumé des Livrables

1. **Notifications fonctionnelles** : Cloche avec badge dynamique, popover listant les notifications, temps réel
2. **Edge function sécurisée** : Pour créer des notifications entre utilisateurs
3. **Facture améliorée** : Récapitulatif par prestataire dans la facture globale
4. **Alertes prestataires** : Notification automatique à chaque prestataire lors d'une nouvelle commande
5. **Design responsive** : Tous les composants adaptés mobile et desktop

