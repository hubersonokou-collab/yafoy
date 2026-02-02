
# Plan : Sélection multiple des services dans le chatbot

## Problème actuel

Dans le composant `SimplifiedAIChat.tsx`, l'étape de sélection des services (step `service`) ne permet qu'une **sélection unique**. Quand l'utilisateur clique sur un service (Décoration, Mobilier, etc.), il passe immédiatement à l'étape suivante sans pouvoir sélectionner plusieurs services.

## Solution

Modifier la logique pour permettre une **sélection multiple** des services avec un bouton "Continuer" pour passer à l'étape suivante.

## Modifications dans SimplifiedAIChat.tsx

### 1. Ajouter un état pour les services sélectionnés

```typescript
const [selectedServices, setSelectedServices] = useState<string[]>([]);
```

### 2. Créer une fonction pour toggle les services

```typescript
const handleServiceToggle = (serviceId: string) => {
  setSelectedServices(prev => 
    prev.includes(serviceId) 
      ? prev.filter(id => id !== serviceId)
      : [...prev, serviceId]
  );
};
```

### 3. Créer une fonction pour confirmer les services sélectionnés

```typescript
const handleConfirmServices = () => {
  if (selectedServices.length === 0) return;
  
  const selectedLabels = SERVICE_ACTIONS
    .filter(a => selectedServices.includes(a.id))
    .map(a => a.label)
    .join(', ');
  
  setBotMessages(prev => [
    ...prev, 
    { text: selectedLabels, isBot: false },
    { text: 'Combien de jours pour l\'événement ?', isBot: true }
  ]);
  setChatStep('days');
  
  // Build message with all selected services
  const serviceMessages = SERVICE_ACTIONS
    .filter(a => selectedServices.includes(a.id))
    .map(a => a.message)
    .join('. ');
  
  sendMessage(`Je prépare un ${selectedEvent}. ${serviceMessages}.`);
};
```

### 4. Modifier l'affichage de l'étape 'service'

Remplacer le rendu actuel (lignes 387-405) par :

```text
Structure de l'interface :
- Grille de boutons de services avec style toggle (sélectionné/non sélectionné)
- Chaque bouton affiche une coche quand sélectionné
- Bouton "Continuer" en bas pour valider la sélection
- Le bouton "Continuer" est désactivé si aucun service n'est sélectionné
```

```tsx
{chatStep === 'service' && (
  <div className="space-y-3 mt-4">
    <div className="grid grid-cols-2 gap-2">
      {SERVICE_ACTIONS.map((action) => {
        const Icon = action.icon;
        const isSelected = selectedServices.includes(action.id);
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className={cn(
              "h-auto py-3 flex flex-col items-center gap-2 rounded-xl transition-all relative",
              isSelected && "border-primary bg-primary/10"
            )}
            onClick={() => handleServiceToggle(action.id)}
          >
            {isSelected && (
              <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
            )}
            <Icon className="h-5 w-5" />
            <span className="text-xs">{action.label}</span>
          </Button>
        );
      })}
    </div>
    <Button
      className="w-full"
      disabled={selectedServices.length === 0}
      onClick={handleConfirmServices}
    >
      Continuer ({selectedServices.length} service{selectedServices.length > 1 ? 's' : ''})
    </Button>
  </div>
)}
```

### 5. Ajouter plus de services à la liste

Actuellement, seuls 4 services sont disponibles dans `SERVICE_ACTIONS`. Mettre à jour la liste pour inclure tous les 8 services :

```typescript
const SERVICE_ACTIONS: QuickAction[] = [
  { id: 'decoration', label: 'Décoration', icon: Sparkles, message: 'Je cherche de la décoration' },
  { id: 'mobilier', label: 'Mobilier', icon: ShoppingCart, message: 'Je cherche du mobilier (tables, chaises)' },
  { id: 'sonorisation', label: 'Sonorisation', icon: Music, message: 'Je cherche de la sonorisation' },
  { id: 'eclairage', label: 'Éclairage', icon: Lightbulb, message: 'Je cherche de l\'éclairage' },
  { id: 'vaisselle', label: 'Vaisselle', icon: UtensilsCrossed, message: 'Je cherche de la vaisselle' },
  { id: 'transport', label: 'Transport', icon: Truck, message: 'Je cherche du transport' },
  { id: 'photo', label: 'Photographie', icon: Camera, message: 'Je cherche un photographe' },
  { id: 'traiteur', label: 'Traiteur', icon: ChefHat, message: 'Je cherche un traiteur' },
];
```

---

## Fichier à modifier

| Fichier | Modifications |
|---------|--------------|
| `src/components/event-planner/SimplifiedAIChat.tsx` | Ajouter sélection multiple des services |

---

## Résumé des changements

| Avant | Après |
|-------|-------|
| Clic sur un service → passe directement à l'étape suivante | Clic sur un service → toggle la sélection |
| Un seul service sélectionnable | Plusieurs services sélectionnables |
| 4 services disponibles | 8 services disponibles |
| Pas de bouton de confirmation | Bouton "Continuer (X services)" pour valider |

---

## Résultat attendu

1. L'utilisateur peut cliquer sur plusieurs services (ex: Décoration + Mobilier + Sonorisation)
2. Les services sélectionnés affichent une coche et un style distinctif
3. Un bouton "Continuer" apparaît en bas avec le nombre de services sélectionnés
4. Au clic sur "Continuer", l'IA recherche des produits pour TOUS les services sélectionnés
