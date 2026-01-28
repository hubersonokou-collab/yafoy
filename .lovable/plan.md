

# Plan d'Alignement avec le Cahier des Charges YAFOY

Apres analyse du cahier des charges que vous avez uploade et de l'etat actuel du projet, voici un plan complet pour aligner l'application avec les specifications techniques et fonctionnelles.

---

## Etat Actuel vs Cahier des Charges

### Ce qui est deja implemente

| Fonctionnalite | Statut | Details |
|----------------|--------|---------|
| Authentification multi-roles | Partiel | Email/telephone/invite - SMS Twilio a configurer |
| Structure base de donnees | Complet | Tables categories, products, orders, profiles, user_roles |
| Dashboard Super Admin | Complet | Statistiques, gestion utilisateurs/produits/commandes |
| Dashboard Prestataire | Complet | Gestion produits avec upload images, stats |
| Dashboard Client | Complet | Catalogue, commandes, recherche |
| Stockage images | Complet | Bucket product-images avec RLS |

### Ce qui manque (selon le cahier des charges)

| Fonctionnalite | Priorite | Section CDC |
|----------------|----------|-------------|
| Interface "Voice-First" et assistant vocal | Haute | Section 3.9 |
| Messagerie interne avec notes vocales | Haute | Section 3.6 |
| Systeme d'avis et notations | Haute | Section 3.7 |
| Paiement securise avec sequestre | Haute | Section 3.4 |
| Notifications (email/SMS/in-app) | Moyenne | Section 3.8 |
| Workflow complet des commandes | Moyenne | Section 3.5 |
| Profil prestataire public enrichi | Moyenne | Section 3.2 |
| Geolocalisation et recherche avancee | Basse | Section 3.3 |

---

## Plan d'Implementation en Phases

### Phase 1: Accessibilite et Interface Vocale (Pierre Angulaire)

Selon le cahier des charges, l'accessibilite est **la pierre angulaire du projet** pour les utilisateurs analphabetes ou a faible litteratie numerique.

**1.1 Interface "Icon-First"**
- Refonte de la navigation avec des icones universelles grandes et explicites
- Utilisation d'images reelles pour les categories et produits
- Texte minimaliste avec icones predominantes
- Boutons d'action visuels avec retour tactile

**1.2 Assistant Vocal Omniprésent**
- Integration Web Speech API pour la reconnaissance vocale
- Synthese vocale (Text-to-Speech) pour lire les informations
- Bouton microphone flottant sur toutes les pages
- Commandes vocales: "Rechercher", "Reserver", "Confirmer", "Annuler"
- Guidage vocal etape par etape

**1.3 Saisie Vocale**
- Champ de recherche avec dictee vocale
- Formulaires avec alternative vocale
- Transcription temps reel

**Fichiers a creer:**
```text
src/hooks/useVoice.tsx          - Hook pour reconnaissance/synthese vocale
src/components/voice/
  VoiceButton.tsx               - Bouton microphone flottant
  VoiceSearch.tsx               - Recherche vocale
  VoiceAssistant.tsx            - Assistant vocal contextuel
  VoiceInput.tsx                - Champ de saisie vocale
```

---

### Phase 2: Messagerie Interne avec Notes Vocales

**2.1 Tables de base de donnees**
```text
conversations      - id, client_id, provider_id, order_id, created_at
messages           - id, conversation_id, sender_id, content_type (text/voice), 
                     content, audio_url, transcription, created_at
```

**2.2 Fonctionnalites**
- Enregistrement et envoi de notes vocales
- Transcription automatique (via API IA)
- Lecture vocale des messages texte recus
- Historique des conversations lie aux commandes
- Bucket de stockage "voice-messages"

**Fichiers a creer:**
```text
src/components/messaging/
  ConversationList.tsx          - Liste des conversations
  ChatWindow.tsx                - Fenetre de chat
  VoiceRecorder.tsx             - Enregistrement audio
  MessageBubble.tsx             - Bulle de message
src/pages/messages/
  Messages.tsx                  - Page messagerie
```

---

### Phase 3: Systeme d'Avis et Notations

**3.1 Tables de base de donnees**
```text
reviews            - id, order_id, client_id, provider_id, rating (1-5),
                     quality_rating, professionalism_rating, value_rating,
                     comment, audio_url, provider_response, created_at
```

**3.2 Fonctionnalites**
- Notation multi-criteres (Qualite, Professionnalisme, Rapport Qualite/Prix)
- Avis texte ou vocal
- Reponse du prestataire
- Calcul de note moyenne par prestataire
- Affichage des avis sur les profils publics

**Fichiers a creer:**
```text
src/components/reviews/
  ReviewForm.tsx                - Formulaire d'avis (texte/vocal)
  StarRating.tsx                - Composant de notation etoiles
  ReviewCard.tsx                - Carte d'avis
  ProviderRating.tsx            - Resume notation prestataire
```

---

### Phase 4: Workflow Complet des Commandes

**4.1 Etats de commande enrichis**
```text
draft -> pending -> quoted -> confirmed -> deposit_paid -> in_progress -> completed -> reviewed
```

**4.2 Fonctionnalites**
- Demande de devis avec message vocal
- Acceptation/Refus par le prestataire
- Gestion des acomptes
- Validation post-prestation par le client
- Declenchement automatique de l'evaluation

**Fichiers a modifier:**
```text
src/pages/client/ClientOrders.tsx    - Ajouter workflow complet
src/pages/provider/ProviderOrders.tsx - Creer page commandes prestataire
src/components/orders/
  OrderTimeline.tsx                   - Timeline visuelle du workflow
  QuoteDialog.tsx                     - Dialog de creation de devis
  DepositPayment.tsx                  - Composant paiement acompte
```

---

### Phase 5: Systeme de Paiement Securise

**5.1 Integration Stripe Connect (recommande)**
- Compte connecte par prestataire
- Paiement client -> Sequestre plateforme
- Liberation fonds apres validation
- Commission automatique

**5.2 Tables de base de donnees**
```text
payments           - id, order_id, amount, type (deposit/full), status,
                     stripe_payment_id, created_at
provider_accounts  - id, provider_id, stripe_account_id, is_verified
```

**Fichiers a creer:**
```text
supabase/functions/
  create-payment-intent/        - Creation intention de paiement
  webhook-stripe/               - Webhook Stripe
src/components/payments/
  PaymentForm.tsx               - Formulaire de paiement
  PaymentStatus.tsx             - Statut du paiement
```

---

### Phase 6: Notifications Multi-Canal

**6.1 Tables de base de donnees**
```text
notifications      - id, user_id, type, title, body, read, data, created_at
```

**6.2 Types de notifications**
- In-app: Nouvelles demandes, messages, avis
- Email: Confirmations, rappels (via Supabase Edge Functions)
- SMS: Confirmations critiques (via Twilio)

**Fichiers a creer:**
```text
supabase/functions/
  send-notification/            - Envoi notifications multi-canal
src/components/notifications/
  NotificationBell.tsx          - Icone cloche avec badge
  NotificationCenter.tsx        - Centre de notifications
```

---

### Phase 7: Profil Prestataire Public Enrichi

**Fonctionnalites**
- Galerie photo/video
- Description des services
- Conditions generales de vente
- Calendrier de disponibilites
- Statistiques publiques (note moyenne, nombre de prestations)
- Badge "Verifie" pour prestataires valides

**Fichiers a creer:**
```text
src/pages/provider/
  ProviderPublicProfile.tsx     - Page profil public
  ProviderCalendar.tsx          - Calendrier disponibilites
src/components/provider/
  ServiceGallery.tsx            - Galerie images/videos
  AvailabilityCalendar.tsx      - Calendrier interactif
```

---

## Details Techniques

### Technologies Utilisees (conformes au CDC)

| Couche | Technologie | Statut |
|--------|-------------|--------|
| Front-end | React + Vite + TypeScript | En place |
| Styling | Tailwind CSS | En place |
| Backend | Supabase (PostgreSQL) | En place |
| Stockage | Supabase Storage | En place |
| Auth | Supabase Auth | En place |
| Edge Functions | Supabase Edge Functions | A utiliser |
| Paiement | Stripe Connect | A integrer |
| Voix | Web Speech API | A integrer |
| Transcription | Lovable AI | A integrer |

### Nouvelles Migrations Base de Donnees

```sql
-- Tables a creer
CREATE TABLE conversations (...)
CREATE TABLE messages (...)
CREATE TABLE reviews (...)
CREATE TABLE notifications (...)
CREATE TABLE payments (...)
CREATE TABLE provider_accounts (...)
CREATE TABLE provider_availability (...)
```

---

## Ordre de Priorite Recommande

1. **Phase 1: Interface Vocale** - Differenciateur cle du projet
2. **Phase 3: Systeme d'Avis** - Essentiel pour la confiance
3. **Phase 2: Messagerie** - Communication client-prestataire
4. **Phase 4: Workflow Commandes** - Processus complet
5. **Phase 5: Paiements** - Monetisation
6. **Phase 6: Notifications** - Engagement utilisateur
7. **Phase 7: Profils Enrichis** - Optimisation

---

## Prochaine Etape

Pour commencer, je recommande de demarrer par la **Phase 1: Interface Vocale** car c'est la "pierre angulaire" du projet selon le cahier des charges. Cela inclut:

1. Creation du hook `useVoice` pour la reconnaissance et synthese vocale
2. Composant `VoiceButton` flottant omnipresent
3. Integration de la recherche vocale
4. Refonte progressive vers une interface "Icon-First"

Souhaitez-vous que je commence par cette phase ou une autre priorite ?

