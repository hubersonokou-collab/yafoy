
# Plan d'intégration complète des paiements Paystack

## Résumé
Ce plan va compléter l'intégration Paystack en ajoutant l'enregistrement automatique des transactions, une interface de gestion des transactions responsive/mobile-first, et des statistiques de paiement complètes.

---

## Étape 1 : Corriger et améliorer l'Edge Function Paystack

**Fichier : `supabase/functions/paystack/index.ts`**

Modifications à apporter :
- Ajouter l'enregistrement automatique de chaque transaction dans la table `transactions` lors de l'initialisation et de la vérification
- Stocker : référence, montant, méthode de paiement, statut, order_id, provider_id, description
- Mettre à jour le statut de la transaction quand le paiement est vérifié ou via webhook
- Ajouter des logs détaillés pour le débogage

**Nouveau flux :**
1. `/initialize` → Crée une transaction avec status="pending"
2. `/verify` → Met à jour la transaction avec status="success" ou "failed"
3. `/webhook` → Backup pour mettre à jour si verify n'est pas appelé

---

## Étape 2 : Créer la page de Transactions Admin

**Nouveau fichier : `src/pages/admin/AdminTransactions.tsx`**

**Fonctionnalités :**
- Tableau responsive et mobile-first avec colonnes adaptatives
- Affichage des informations clés :
  - Référence de transaction
  - Nom du client (via order → client)
  - Service/Produit commandé
  - Montant en FCFA
  - Méthode de paiement
  - Statut (pending, success, failed) avec badges colorés
  - Date/heure
- Filtres :
  - Par statut (tous, réussis, en attente, échoués)
  - Par période (aujourd'hui, semaine, mois, personnalisé)
  - Par méthode de paiement
- Pagination
- Export CSV (optionnel)

**Design mobile-first :**
- Sur mobile : cartes empilées avec informations essentielles
- Sur desktop : tableau complet avec toutes les colonnes
- Animations subtiles pour les changements de statut

---

## Étape 3 : Créer le composant TransactionStats

**Nouveau fichier : `src/components/transactions/TransactionStats.tsx`**

**Statistiques affichées :**
- Total des revenus (transactions réussies)
- Nombre de transactions aujourd'hui/cette semaine/ce mois
- Taux de réussite des paiements
- Montant moyen par transaction
- Graphique d'évolution des revenus (avec Recharts - déjà installé)
- Répartition par méthode de paiement (pie chart)

---

## Étape 4 : Intégrer dans la navigation Admin

**Fichier : `src/components/dashboard/DashboardLayout.tsx`**

Ajouter dans `superAdminNav` :
```typescript
{ title: 'Transactions', href: '/admin/transactions', icon: Receipt }
```

**Fichier : `src/App.tsx`**

Ajouter la route :
```typescript
<Route path="/admin/transactions" element={<AdminTransactions />} />
```

---

## Étape 5 : Améliorer le Dashboard Admin avec les stats de paiement

**Fichier : `src/pages/admin/AdminDashboard.tsx`**

Ajouter :
- Widget de transactions récentes
- Stats rapides (transactions du jour, revenus du jour)
- Lien vers la page complète des transactions

---

## Structure des fichiers à créer/modifier

```text
src/
├── pages/
│   └── admin/
│       ├── AdminTransactions.tsx (nouveau)
│       └── AdminDashboard.tsx (modifier)
├── components/
│   └── transactions/
│       ├── TransactionStats.tsx (nouveau)
│       ├── TransactionTable.tsx (nouveau)
│       ├── TransactionCard.tsx (nouveau - mobile)
│       └── index.ts (nouveau)
├── App.tsx (modifier - ajouter route)
supabase/
└── functions/
    └── paystack/
        └── index.ts (modifier)
```

---

## Détails techniques

### Table transactions (existante)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| order_id | uuid | Lien vers la commande |
| provider_id | uuid | Prestataire concerné |
| type | text | "payment", "refund", "commission" |
| amount | numeric | Montant en FCFA |
| status | text | "pending", "success", "failed" |
| payment_method | text | "card", "mobile_money", etc. |
| reference | text | Référence Paystack |
| description | text | Description de la transaction |
| created_at | timestamp | Date de création |
| processed_at | timestamp | Date de traitement |

### API Paystack - Données récupérées
Lors de la vérification, Paystack retourne :
- `reference` - Référence unique
- `amount` - Montant en kobo (diviser par 100)
- `currency` - Devise (XOF)
- `status` - success, failed, abandoned
- `paid_at` - Date de paiement
- `channel` - card, bank, mobile_money
- `customer` - email, nom du client

---

## Considérations de sécurité

1. **RLS sur transactions** - Déjà configuré pour admin/accountant uniquement
2. **Validation JWT** - Déjà en place dans l'edge function
3. **Signature webhook** - Déjà vérifiée avec HMAC SHA512

---

## À propos de la clé Paystack

Les logs montrent une erreur "Invalid key". Avant d'implémenter ces changements, il faudra :
1. Vérifier que la clé secrète Paystack est correcte (elle doit commencer par `sk_live_` ou `sk_test_`)
2. S'assurer que c'est bien une clé secrète (pas la clé publique)

Je peux vous guider pour mettre à jour cette clé si nécessaire.

---

## Résultat attendu

Après implémentation :
- Chaque paiement sera automatiquement enregistré dans la table transactions
- Une interface professionnelle permettra de visualiser toutes les transactions
- Des statistiques détaillées avec graphiques seront disponibles
- Le tout sera responsive et accessible sur mobile
