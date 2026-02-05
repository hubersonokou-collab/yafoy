
# Plan : Remplacer le paiement par un système de réservation avec chat organisateur

## Contexte et objectif

Actuellement, après sélection des services sur la facture, le client doit "Payer la commande" via Paystack. La demande est de :

1. **Remplacer** le bouton "Payer la commande" par **"RÉSERVER"**
2. **Le bouton RÉSERVER** redirige vers une conversation avec l'"organisateur chef" (un représentant YAFOY qui gère les réservations)
3. **Côté client**, afficher deux boutons d'action : **"APPELER"** et **"DISCUTER AVEC LE PERSONNEL"**

D'après l'image de référence :
- **Côté organisateur (gauche)** : Dashboard avec liste des conversations/réservations
- **Côté client (droite)** : Interface de chat avec l'interlocuteur (organisateur YAFOY)

---

## Architecture proposée

### Nouveau concept : "Organisateur YAFOY"

Un rôle spécial d'administrateur qui gère les réservations et peut :
- Voir toutes les demandes de réservation en attente
- Discuter avec les clients
- Valider les réservations avant de déclencher le paiement

### Flux utilisateur après réservation

```text
1. Client confirme la facture
2. Clique sur "RÉSERVER"
3. Une demande de réservation est créée (status: 'pending_contact')
4. Un chat est créé entre le client et l'équipe YAFOY
5. Le client voit la vue chat avec :
   - Bouton "APPELER" (déclenche un appel téléphonique)
   - Bouton "DISCUTER AVEC LE PERSONNEL" (ouvre le chat)
6. L'organisateur YAFOY voit la réservation dans son dashboard
7. Après discussion et validation, le paiement peut être déclenché
```

---

## Modifications à effectuer

### 1. Modifier `ClientEventPlanner.tsx`

**Actions :**
- Remplacer le bouton "Payer la commande" par "RÉSERVER"
- Le bouton RÉSERVER crée une réservation + chat room avec l'équipe YAFOY
- Après création, naviguer vers une nouvelle vue de réservation client

**Code concerné (lignes 832-844) :**
```typescript
// AVANT
<Button onClick={handleConfirmOrder}>
  <CreditCard className="mr-2" />
  Payer la commande
</Button>

// APRÈS
<Button onClick={handleReservation}>
  <Calendar className="mr-2" />
  RÉSERVER
</Button>
```

### 2. Créer un nouveau composant `ClientReservationChat.tsx`

Interface client après réservation avec :
- En-tête affichant les infos de la réservation
- Deux boutons d'action prominents :
  - **"APPELER"** : `<a href="tel:+221XXXXXXXX">` vers le numéro YAFOY
  - **"DISCUTER AVEC LE PERSONNEL"** : ouvre le chat en dessous
- Zone de chat intégrée pour discuter avec l'organisateur

**Emplacement :** `src/components/reservation/ClientReservationChat.tsx`

### 3. Créer une page `OrganizerDashboard.tsx`

Dashboard pour les organisateurs YAFOY (admins) pour gérer les réservations :
- Liste des réservations en attente de contact
- Filtrage par statut
- Clic sur une réservation → ouvre le chat avec le client
- Boutons d'action : Valider / Annuler la réservation

**Emplacement :** `src/pages/admin/OrganizerDashboard.tsx` ou nouvelle route `/organizer/dashboard`

### 4. Étendre la table `event_planning_requests`

Ajouter un nouveau statut pour le workflow de réservation :
- `pending_contact` : Réservation créée, en attente de contact avec l'organisateur
- `contacted` : Client contacté
- `confirmed` : Réservation confirmée, prêt pour paiement
- `payment_pending` : En attente de paiement (flux actuel)

### 5. Modifier la logique de chat

**Nouveau type de participant :**
- `role: 'yafoy_organizer'` pour identifier les membres de l'équipe YAFOY

**Adapter `useChatRoom.ts` :**
- Supporter le chat entre client et organisateur YAFOY (pas seulement client-prestataires)

### 6. Ajouter les routes

```typescript
// Dans App.tsx
<Route path="/client/reservation/:id" element={<ClientReservation />} />
<Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
```

---

## Détail de l'interface client post-réservation

D'après l'image de référence, côté client on voit :
- En haut : "Interlocuteur" (info de l'organisateur)
- Messages de chat
- Zone de saisie avec icônes (image, fichier, audio, texte, envoyer)
- **Boutons "APPELER" et "DISCUTER AVEC LE PERSONNEL"** seront ajoutés en haut

```text
┌──────────────────────────────────────┐
│  💚 Client    🔔    < Retour         │
├──────────────────────────────────────┤
│  👤 Interlocuteur (Équipe YAFOY)     │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐ ┌──────────────────┐ │
│  │ 📞 APPELER │ │ 💬 DISCUTER AVEC │ │
│  │            │ │   LE PERSONNEL   │ │
│  └────────────┘ └──────────────────┘ │
│                                      │
│  ─────────── Messages ─────────────  │
│                                      │
│  [Message 1]                         │
│  [Message 2]                         │
│  ...                                 │
│                                      │
├──────────────────────────────────────┤
│  📷  📎  🎤  [Message...]       ➤    │
└──────────────────────────────────────┘
```

---

## Fichiers à créer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/pages/client/ClientEventPlanner.tsx` | Modifier | Remplacer "Payer" par "RÉSERVER" + logique réservation |
| `src/components/reservation/ClientReservationChat.tsx` | Créer | Vue chat client avec boutons APPELER/DISCUTER |
| `src/components/reservation/index.ts` | Créer | Export du composant |
| `src/pages/client/ClientReservation.tsx` | Créer | Page de réservation client |
| `src/pages/admin/OrganizerDashboard.tsx` | Créer | Dashboard organisateur YAFOY |
| `src/App.tsx` | Modifier | Ajouter les nouvelles routes |

---

## Numéro de téléphone YAFOY

Pour le bouton "APPELER", je devrai utiliser un numéro de contact YAFOY. Options :
- Variable d'environnement `VITE_YAFOY_PHONE`
- Constante dans le code
- Récupérer depuis une table `settings` en base

**Note :** Tu pourras me préciser le numéro à utiliser lors de l'implémentation.

---

## Prochaines étapes après approbation

1. Modifier `ClientEventPlanner.tsx` pour le bouton RÉSERVER
2. Créer la fonction `handleReservation` qui crée la réservation + chat
3. Créer le composant `ClientReservationChat` avec les boutons d'action
4. Créer la page `ClientReservation` 
5. (Optionnel) Créer le dashboard organisateur si demandé

En dernier : jai deja creer les mail des organisateur pour la connection sa se trouve dans la base de donné et fait une assignation quant un organisateur est occupé avec un client le system redigee le second client vers un autre organisateur ainsi de suite . et coté client ajoute une signature electronique dans sa discution et ok mais linterface de lorganisateur doit afficher la discution et une autre parti catalogue avec formulaire et bare de recherche pour que lorsque le client faire une demande par exemple de gateau 3 etage 
lorganisateur puisse cherge a travers un formulaire pour avoir le prix de larticle directement 
voila ce que lorganisateur doit voir 
maintnenant le formulaire doit etre perforùanet pour receuillir tout type de demande et donné le prix en fonction du nom de personne d, du prix unitaire de larticle et calculer le taux 
un peut de tout 

