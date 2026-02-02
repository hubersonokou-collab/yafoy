

# Plan : Afficher la facture instantanément après validation du bot

## Problème actuel

Le composant `ClientEventPlanner` :
1. S'initialise avec `step = 'form'` (ligne 112)
2. Affiche le formulaire de planification
3. Puis le `useEffect` (ligne 129) détecte `location.state?.fromBot`
4. Charge les données et change `step` en `'invoice'`

Ce délai entre le rendu initial et le `useEffect` crée le "flash" de 2 secondes où on voit le formulaire avant la facture.

## Solution

Initialiser intelligemment le `step` en détectant `location.state?.fromBot` **dès le premier rendu**, avant même que le `useEffect` ne s'exécute.

## Modification

### Fichier : `src/pages/client/ClientEventPlanner.tsx`

**Avant (ligne 112)** :
```typescript
const [step, setStep] = useState<'form' | 'invoice' | 'chat' | 'room'>('form');
```

**Après** :
```typescript
// Initialiser à 'invoice' si on vient du bot, sinon 'form'
const [step, setStep] = useState<'form' | 'invoice' | 'chat' | 'room'>(
  location.state?.fromBot ? 'invoice' : 'form'
);
```

Cela garantit que :
- Si l'utilisateur vient du bot → la facture s'affiche **immédiatement** (pendant que les données se chargent en arrière-plan)
- Si l'utilisateur arrive normalement → le formulaire s'affiche comme avant

### Afficher un loader pendant le chargement

Ajouter un état de chargement pour afficher un loader au lieu d'une facture vide pendant que les données se chargent.

**Dans le rendu du step 'invoice'** : vérifier `loadingInvoice` et afficher un spinner si les données ne sont pas encore prêtes.

---

## Fichier impacté

| Fichier | Modification |
|---------|--------------|
| `src/pages/client/ClientEventPlanner.tsx` | Initialiser `step` en fonction de `location.state?.fromBot` + afficher un loader pendant le chargement |

---

## Résultat attendu

1. L'utilisateur clique "Oui, confirmer" dans le bot
2. Navigation vers `/client/event-planner` avec `state.fromBot=true`
3. **Instantanément** : la page affiche un loader (ou la facture)
4. Les données se chargent en arrière-plan
5. La facture avec les produits s'affiche

Plus de "flash" du formulaire de planification !

