

# Plan: Paiement Global avec Confirmation Individuelle des Prestataires

## Résumé

Ce plan implémente un système où :
1. Le client paie la facture **globalement** (un seul paiement pour tous les prestataires)
2. Chaque prestataire doit **confirmer individuellement** sa partie de la commande dans son compte
3. Les commandes restent séparées mais liées par un identifiant de groupe

---

## Situation Actuelle

- Le client voit une facture globale avec tous les prestataires
- En cliquant "Confirmer la commande", des commandes séparées sont créées pour chaque prestataire
- Chaque prestataire peut déjà accepter/refuser les commandes via `OrderActions`
- Le paiement Paystack fonctionne mais uniquement pour une commande individuelle

---

## Changements Proposés

### 1. Ajouter un Identifiant de Groupe de Commandes

Créer un champ pour lier les commandes issues de la même planification d'événement.

**Migration SQL** :
- Ajouter une colonne `group_id` à la table `orders` pour lier les commandes du même événement

### 2. Modifier le Flux de Paiement Global

**Fichier** : `src/pages/client/ClientEventPlanner.tsx`

Après confirmation de la facture :
1. Créer toutes les commandes individuelles avec un `group_id` commun
2. Calculer le total global (sous-total + 5% frais de service)
3. Afficher un dialogue de paiement avec le montant total
4. Rediriger vers Paystack pour payer le montant global
5. Une fois le paiement confirmé, les commandes passent en statut "pending" (en attente de confirmation prestataire)

### 3. Créer un Composant de Paiement Global

**Fichier** : `src/components/payment/GlobalPaymentDialog.tsx`

Ce composant affiche :
- Le récapitulatif des commandes par prestataire
- Le sous-total, les frais de service (5%), et le total TTC
- Le bouton de paiement Paystack pour le montant total
- Une indication que chaque prestataire devra confirmer sa partie

### 4. Mettre à Jour l'Edge Function Paystack

**Fichier** : `supabase/functions/paystack/index.ts`

Ajouter la gestion du paiement groupé :
- Accepter une liste d'IDs de commandes (`orderIds`) au lieu d'un seul
- Vérifier que l'utilisateur possède toutes les commandes
- Après paiement réussi, mettre à jour le `deposit_paid` sur toutes les commandes
- Envoyer une notification à chaque prestataire pour confirmer

### 5. Interface Prestataire - Confirmation Individuelle

L'interface prestataire (`ProviderOrders.tsx`) fonctionne déjà correctement :
- Les prestataires voient leurs commandes en statut "pending"
- Ils peuvent cliquer "Accepter" ou "Refuser" via `OrderActions`
- Aucun changement nécessaire - le système actuel convient parfaitement

### 6. Notifications aux Prestataires

Après le paiement global réussi, envoyer une notification à chaque prestataire :
- Type : `new_order`
- Message : "Nouvelle commande payée - Confirmation requise"
- Inclure les détails : montant, type d'événement, date

---

## Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `src/components/payment/GlobalPaymentDialog.tsx` | Dialogue de paiement pour plusieurs commandes |

## Fichiers à Modifier

| Fichier | Changement |
|---------|------------|
| `src/pages/client/ClientEventPlanner.tsx` | Intégrer le paiement global après confirmation |
| `supabase/functions/paystack/index.ts` | Gérer les paiements groupés |

## Migration SQL

```text
ALTER TABLE orders ADD COLUMN group_id uuid;
CREATE INDEX idx_orders_group_id ON orders(group_id);
```

---

## Flux Utilisateur Final

```text
1. Client remplit le formulaire de planification
                    ↓
2. Facture pro forma générée (éditable)
                    ↓
3. Client clique "Payer la commande"
                    ↓
4. Dialogue de paiement global s'affiche :
   - Récapitulatif par prestataire
   - Total avec frais de service (5%)
   - Bouton "Payer [X] FCFA"
                    ↓
5. Redirection vers Paystack (paiement unique)
                    ↓
6. Après paiement réussi :
   - Commandes créées avec statut "pending"
   - Notifications envoyées aux prestataires
   - Client redirigé vers "Mes commandes"
                    ↓
7. Chaque PRESTATAIRE voit la commande dans son compte
                    ↓
8. Prestataire clique "Accepter" → statut "confirmed"
   ou "Refuser" → statut "cancelled"
```

---

## Détails Techniques

### Gestion du Paiement Groupé

Le paiement Paystack sera initialisé avec :
- Un `group_id` unique (UUID)
- Le montant total de toutes les commandes + frais de service
- Les métadonnées contenant tous les `order_id` concernés

### Après Vérification du Paiement

L'edge function `paystack/verify` :
1. Récupère tous les `order_id` depuis les métadonnées
2. Met à jour `deposit_paid` sur chaque commande
3. Envoie les notifications aux prestataires via `create-notification`

### Sécurité

- Vérification JWT pour toutes les opérations
- Le client ne peut payer que ses propres commandes
- Les prestataires ne peuvent confirmer que leurs propres commandes
- Les politiques RLS existantes protègent déjà les opérations

---

## Résumé des Livrables

1. **Paiement global** : Un seul paiement Paystack pour toutes les commandes
2. **Commandes liées** : Toutes les commandes partagent un `group_id`
3. **Confirmation individuelle** : Chaque prestataire confirme sa commande séparément
4. **Notifications** : Les prestataires sont notifiés après le paiement
5. **Suivi client** : Le client peut suivre l'état de confirmation de chaque prestataire

