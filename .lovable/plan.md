

# Plan : Afficher la facture directement après validation dans le bot

## Problème actuel

Quand l'utilisateur confirme la réservation dans le chatbot (`SimplifiedAIChat`), la fonction `handleFinalConfirm` :
1. Appelle `onReserve?.(selectedProducts)` 
2. Si `standalone` est true, redirige vers `/client/event-planner`

Cette redirection réinitialise la page au lieu d'afficher la facture avec les produits sélectionnés.

## Solution

Modifier la navigation pour passer les produits sélectionnés et les données de l'événement via l'état de navigation (state), puis dans `ClientEventPlanner`, détecter ces données et afficher directement la facture.

## Modifications

### 1. SimplifiedAIChat.tsx

Modifier `handleFinalConfirm` pour passer les données via l'état de navigation :

```typescript
const handleFinalConfirm = () => {
  if (standalone) {
    // Passer les produits sélectionnés et les données de l'événement via le state
    navigate('/client/event-planner', {
      state: {
        fromBot: true,
        selectedProducts: selectedProducts,
        recommendedProducts: recommendedProducts.filter(p => selectedProducts.includes(p.id)),
        eventType: selectedEvent,
        rentalDays: rentalDays,
        servicesNeeded: selectedServices,
      }
    });
  } else {
    onReserve?.(selectedProducts);
  }
};
```

### 2. ClientEventPlanner.tsx

Ajouter la logique pour détecter les données venant du bot et afficher la facture :

```typescript
import { useLocation } from 'react-router-dom';

// Dans le composant
const location = useLocation();

// Détecter si on vient du bot
useEffect(() => {
  if (location.state?.fromBot) {
    const botData = location.state;
    
    // Créer les données d'événement
    const eventFormData: EventFormData = {
      eventType: botData.eventType || 'autre',
      eventName: '',
      budgetMin: 0,
      budgetMax: 10000000,
      guestCount: 50,
      eventDate: '',
      eventLocation: '',
      servicesNeeded: botData.servicesNeeded || [],
      additionalNotes: '',
    };
    
    setEventData(eventFormData);
    
    // Convertir les produits recommandés au format attendu
    const products: RecommendedProduct[] = botData.recommendedProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      price_per_day: p.price_per_day,
      location: p.location,
      images: p.images,
      is_verified: p.is_verified,
      category_name: p.category_name,
      category_id: null,
      provider_id: '', // À récupérer
      provider_name: 'Prestataire',
      quantity: 1,
      rental_days: botData.rentalDays || 1,
    }));
    
    setInvoiceProducts(products);
    setStep('invoice');
    
    // Nettoyer le state
    window.history.replaceState({}, document.title);
  }
}, [location.state]);
```

### 3. Récupérer les infos manquantes des produits

Comme le bot n'a pas toutes les infos (provider_id), ajouter une fonction pour les récupérer :

```typescript
const fetchProductsDetails = async (productIds: string[], rentalDays: number) => {
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price_per_day,
      location,
      images,
      is_verified,
      category_id,
      provider_id,
      categories:category_id(name)
    `)
    .in('id', productIds);
  
  if (!products) return [];
  
  // Récupérer les noms des prestataires
  const providerIds = [...new Set(products.map(p => p.provider_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', providerIds);
  
  const providerNameMap: Record<string, string> = {};
  (profiles || []).forEach(profile => {
    providerNameMap[profile.user_id] = profile.full_name || 'Prestataire';
  });
  
  return products.map(p => ({
    id: p.id,
    name: p.name,
    price_per_day: p.price_per_day,
    location: p.location,
    images: p.images,
    is_verified: p.is_verified,
    category_name: (p.categories as any)?.name,
    category_id: p.category_id,
    provider_id: p.provider_id,
    provider_name: providerNameMap[p.provider_id] || 'Prestataire',
    quantity: 1,
    rental_days: rentalDays,
  }));
};
```

---

## Fichiers à modifier

| Fichier | Modifications |
|---------|--------------|
| `src/components/event-planner/SimplifiedAIChat.tsx` | Modifier `handleFinalConfirm` pour passer les données via le state de navigation |
| `src/pages/client/ClientEventPlanner.tsx` | Ajouter la détection des données du bot et affichage de la facture |

---

## Résumé du flux après modification

```text
1. Utilisateur utilise le bot → sélectionne événement, services, jours
2. Bot recommande des produits → utilisateur sélectionne
3. Utilisateur confirme → "Oui, confirmer"
4. Navigation vers /client/event-planner avec state contenant:
   - fromBot: true
   - selectedProducts (IDs)
   - eventType
   - rentalDays
   - servicesNeeded
5. ClientEventPlanner détecte state.fromBot
6. Récupère les détails complets des produits
7. Affiche directement la facture (step='invoice')
```

---

## Résultat attendu

1. L'utilisateur confirme sa réservation dans le bot
2. La page affiche directement la facture pro-forma avec les produits sélectionnés
3. L'utilisateur peut modifier les quantités/durées si nécessaire
4. L'utilisateur peut procéder au paiement

