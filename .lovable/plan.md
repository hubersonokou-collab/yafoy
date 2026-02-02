

# Plan : Boutons Agrandir/Réduire pour le Chatbot

## Objectif

Ajouter des boutons dans l'en-tête du chatbot pour permettre à l'utilisateur de basculer entre :
- **Vue normale** : Taille par défaut du chat
- **Vue agrandie** : Chat en plein écran ou presque plein écran pour une meilleure lisibilité

## Modifications dans SimplifiedAIChat.tsx

### 1. Ajouter un état pour gérer la taille

```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

### 2. Importer les icônes nécessaires

Ajouter `Maximize2` et `Minimize2` aux imports de Lucide :
```typescript
import { 
  // ... autres icônes existantes
  Maximize2,
  Minimize2
} from 'lucide-react';
```

### 3. Modifier le container principal

Ajouter des classes conditionnelles pour gérer l'expansion :

```typescript
<Card className={cn(
  "flex flex-col transition-all duration-300",
  standalone ? "h-[600px]" : "h-full",
  isExpanded && "fixed inset-4 z-50 h-auto"
)}>
```

### 4. Ajouter les boutons dans l'en-tête

Dans la section "Chat Header" (ligne 280), ajouter les boutons à droite :

```text
Structure de l'en-tête mise à jour :
┌────────────────────────────────────────────────┐
│ [Avatar] Assistant YAFOY          [⬜] [✕]    │
│          Disponible 24/7                       │
└────────────────────────────────────────────────┘

- Bouton Agrandir (Maximize2) : visible quand chat est réduit
- Bouton Réduire (Minimize2) : visible quand chat est agrandi
```

Code à ajouter dans l'en-tête :
```tsx
<div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary rounded-full">
        <Bot className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <h3 className="font-semibold text-secondary">Assistant YAFOY</h3>
        <p className="text-xs text-muted-foreground">Disponible 24/7</p>
      </div>
    </div>
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? "Réduire" : "Agrandir"}
      >
        {isExpanded ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>
</div>
```

### 5. Ajouter un overlay de fond (mode agrandi)

Pour créer un effet modal quand le chat est agrandi :

```tsx
{isExpanded && (
  <div 
    className="fixed inset-0 bg-black/50 z-40"
    onClick={() => setIsExpanded(false)}
  />
)}
```

---

## Résumé des changements

| Élément | Description |
|---------|-------------|
| État `isExpanded` | Gère si le chat est agrandi ou non |
| Bouton Agrandir | Icône `Maximize2`, agrandit le chat en quasi plein écran |
| Bouton Réduire | Icône `Minimize2`, remet le chat à sa taille normale |
| Overlay | Fond semi-transparent quand agrandi (clic pour fermer) |
| Animation | Transition fluide lors du changement de taille |

---

## Fichier à modifier

| Fichier | Modifications |
|---------|--------------|
| `src/components/event-planner/SimplifiedAIChat.tsx` | Ajouter état, boutons, et styles conditionnels |

