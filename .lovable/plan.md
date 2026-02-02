

# Plan : Corriger l'affichage de la facture après validation du bot

## Problème identifié

Quand l'utilisateur confirme la réservation dans le chatbot, la fonction `handleFinalConfirm` dans `SimplifiedAIChat.tsx` fonctionne différemment selon le contexte :

- **Standalone mode (page event-planner)** : Navigue avec les données via le state - fonctionne
- **Non-standalone mode (dashboard)** : Appelle `onReserve(selectedProducts)` qui ne passe pas toutes les données nécessaires

Dans `ClientDashboard.tsx`, le callback `onReserve` fait simplement :
```typescript
onReserve={(productIds) => {
  navigate('/client/event-planner'); // ← Pas de données passées !
}}
```

## Solution

Modifier la fonction `handleFinalConfirm` pour toujours naviguer avec les données complètes, quel que soit le mode (standalone ou non).

## Modifications

### 1. SimplifiedAIChat.tsx - Modifier handleFinalConfirm

Avant (ligne 239-255) :
```typescript
const handleFinalConfirm = () => {
  if (standalone) {
    navigate('/client/event-planner', {
      state: { fromBot: true, ... }
    });
  } else {
    onReserve?.(selectedProducts);
  }
};
```

Après :
```typescript
const handleFinalConfirm = () => {
  // Toujours naviguer avec les données, peu importe le mode
  navigate('/client/event-planner', {
    state: {
      fromBot: true,
      selectedProductIds: selectedProducts,
      recommendedProducts: recommendedProducts.filter(p => selectedProducts.includes(p.id)),
      eventType: selectedEvent,
      rentalDays: rentalDays,
      servicesNeeded: selectedServices,
    }
  });
  
  // Appeler également le callback si fourni
  onReserve?.(selectedProducts);
};
```

### 2. ClientDashboard.tsx - Simplifier le callback (optionnel)

Le callback `onReserve` dans ClientDashboard peut être simplifié ou supprimé car la navigation est gérée par `SimplifiedAIChat`.

---

## Fichiers à modifier

| Fichier | Modifications |
|---------|--------------|
| `src/components/event-planner/SimplifiedAIChat.tsx` | Modifier `handleFinalConfirm` pour toujours naviguer avec les données complètes |

---

## Résumé du flux après correction

```text
1. Utilisateur utilise le bot (dashboard ou page event-planner)
2. Sélectionne événement, services, produits, confirme
3. handleFinalConfirm() s'exécute
4. TOUJOURS navigue vers /client/event-planner avec state contenant :
   - fromBot: true
   - selectedProductIds
   - recommendedProducts
   - eventType
   - rentalDays
   - servicesNeeded
5. ClientEventPlanner détecte state.fromBot
6. Récupère les détails complets des produits
7. Affiche directement la facture (step='invoice')
```

