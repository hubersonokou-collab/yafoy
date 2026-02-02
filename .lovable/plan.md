
## Diagnostic (ce qui se passe réellement)

D’après le code actuel, le problème vient d’une **double navigation** au moment où tu cliques “Oui, confirmer” dans le bot :

1) `SimplifiedAIChat.handleFinalConfirm()` fait bien :
- `navigate('/client/event-planner', { state: { fromBot: true, selectedProductIds, ... } })`

2) Mais juste après, il exécute aussi :
- `onReserve?.(selectedProducts)`

Et dans `ClientDashboard.tsx`, le `onReserve` fait :
- `navigate('/client/event-planner')` **sans state**

Résultat : la 2ème navigation **écrase** la 1ère (avec state).  
Donc dans `/client/event-planner`, `location.state?.fromBot` est vide → la page reste sur l’étape **Planifier un événement** (form) au lieu d’aller à la facture.

---

## Objectif

Après confirmation dans le bot, l’utilisateur doit arriver sur `/client/event-planner` avec `state.fromBot=true` et voir **directement la facture**.

---

## Changements à faire (solution robuste)

### A) Corriger la source du “state écrasé” (ClientDashboard)
**Fichier :** `src/pages/client/ClientDashboard.tsx`

- Modifier le `onReserve` passé à `SimplifiedAIChat` pour qu’il **ne navigue plus** vers `/client/event-planner`.
- À la place, il peut :
  - simplement **fermer le widget** (`setShowChat(false)`)
  - éventuellement afficher un toast (“Redirection vers la facture…”), mais optionnel.

Ce point à lui seul évite d’écraser le `state` envoyé par le bot.

---

### B) Rendre `SimplifiedAIChat` “anti-conflit” (même si un parent navigue)
**Fichier :** `src/components/event-planner/SimplifiedAIChat.tsx`

Actuellement : `navigate(...)` puis `onReserve(...)`  
On va inverser l’ordre pour que **la navigation avec state soit toujours la dernière action** (donc gagnante).

- Nouveau flux recommandé :
  1. `onReserve?.(selectedProducts)` (ex: fermer le chat dans le dashboard)
  2. `navigate('/client/event-planner', { state: {...} })` (avec `fromBot` + payload)

Cela rend le bot robuste même si, plus tard, quelqu’un rebranche un `onReserve` qui fait une navigation.

---

### C) Ajout de logs de validation (temporaire, pour vérifier “à mon niveau”)
**Fichiers :**
- `src/components/event-planner/SimplifiedAIChat.tsx`
- `src/pages/client/ClientEventPlanner.tsx`

Ajouter des `console.log` temporaires pour confirmer :
- Au clic “Oui, confirmer” : afficher le payload envoyé à `navigate`.
- Dans `ClientEventPlanner` : afficher `location.state` au montage + lors des changements, et afficher `selectedProductIds`.

But : si ça ne marche toujours pas, on saura immédiatement si :
- le state n’arrive pas,
- ou il arrive mais la requête produits échoue (RLS, ids vides, etc.).

---

## Tests (end-to-end) à faire après correction

1) Depuis **Dashboard > Discuter** :
   - sélectionner événement → services → jours → produits → confirmer
   - vérifier que l’écran qui s’ouvre est **la facture** (step = invoice), pas “Quel événement ?”

2) Vérifier que la facture contient bien :
   - les produits sélectionnés
   - les prix et la durée (rental_days)
   - et que le bouton paiement/commande fonctionne (si eventPlanningId est créé)

3) Test mobile (important) : même flux, car l’utilisateur est sur mobile.

---

## Fichiers impactés

- `src/pages/client/ClientDashboard.tsx`
  - Retirer la navigation `navigate('/client/event-planner')` du `onReserve` (ne garder que fermeture du chat / actions UI)

- `src/components/event-planner/SimplifiedAIChat.tsx`
  - Inverser l’ordre : `onReserve` d’abord, puis `navigate` avec `state`

- (Optionnel temporaire) logs
  - `src/components/event-planner/SimplifiedAIChat.tsx`
  - `src/pages/client/ClientEventPlanner.tsx`

---

## Critères de réussite

- Après “Oui, confirmer” dans le bot, l’utilisateur arrive sur `/client/event-planner` et voit **directement la facture**, sans repasser par “Planifier un événement”.
- Le comportement fonctionne depuis le dashboard (où le bot est intégré), et reste compatible avec d’autres intégrations futures.
