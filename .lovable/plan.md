

# Plan : Rendre l'interface organisateur fonctionnelle

## Problemes identifies

Apres analyse approfondie du code et des politiques de securite (RLS), voici les blocages actuels :

### 1. Le role "organizer" n'est pas reconnu dans le systeme d'authentification
- `useAuth.tsx` definit les roles comme `'client' | 'provider' | 'admin' | ... | 'support'` -- **"organizer" est absent**
- Pas de fonction `isOrganizer()` disponible
- Le `DashboardLayout` ne propose aucune navigation pour les organisateurs

### 2. Les politiques RLS bloquent l'acces organisateur
- **`event_planning_requests`** : Seul `user_id = auth.uid()` peut lire. L'organisateur ne peut donc **pas voir** les reservations des clients qui lui sont assignes
- **`chat_room_participants`** INSERT : Seul le createur du chat room peut ajouter des participants -- cela fonctionne car c'est le client qui cree la room, mais l'organisateur ne pourrait pas ajouter d'autres participants plus tard

### 3. L'organisateur ne peut pas acceder au dashboard
- Quand un organisateur se connecte, `useAuth` ne reconnait pas son role
- La navigation dans `DashboardLayout` ne contient pas de menu pour les organisateurs
- Le dashboard existe (`/organizer`) mais l'utilisateur n'est pas guide vers cette page

---

## Modifications prevues

### Etape 1 : Ajouter le role "organizer" dans useAuth

**Fichier** : `src/hooks/useAuth.tsx`

- Ajouter `'organizer'` au type `UserRole`
- Ajouter la methode `isOrganizer()` dans le contexte
- Exporter cette methode

### Etape 2 : Ajouter la navigation organisateur dans DashboardLayout

**Fichier** : `src/components/dashboard/DashboardLayout.tsx`

- Creer un tableau de navigation `organizerNav` avec :
  - Tableau de bord (`/organizer`)
  - Parametres (`/organizer/settings`)
- Detecter le role organisateur et les routes `/organizer` pour afficher cette navigation
- Ajouter le titre "Organisateur" avec une icone dediee

### Etape 3 : Corriger les politiques RLS (Migration SQL)

**Nouvelles politiques a creer :**

1. **`event_planning_requests`** -- Permettre aux organisateurs de lire les evenements de leurs clients assignes :
```text
CREATE POLICY "Organizers can view assigned client events"
  ON event_planning_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_organizer_assignments
      WHERE organizer_id = auth.uid()
        AND client_id = event_planning_requests.user_id
        AND status = 'active'
    )
  );
```

2. **`chat_room_participants`** -- Permettre aux participants d'ajouter dans les rooms ou ils sont deja membres :
```text
CREATE POLICY "Participants can add to their rooms"
  ON chat_room_participants FOR INSERT
  WITH CHECK (
    is_chat_room_participant(room_id, auth.uid())
  );
```

3. **`chat_messages`** -- Verifier que les organisateurs peuvent envoyer des messages (deja couvert par la politique existante basee sur `chat_room_participants`)

### Etape 4 : Ameliorer le OrganizerDashboard existant

**Fichier** : `src/pages/organizer/OrganizerDashboard.tsx`

Corrections et ameliorations :
- Afficher le nom du client dans les messages (actuellement affiche "Utilisateur" en dur)
- Utiliser `sender.full_name` du profil pour afficher le vrai nom
- S'assurer que le realtime fonctionne pour les nouveaux messages
- Afficher le nom du client dans la liste des conversations (deja fait via `clientName`)

### Etape 5 : Redirection automatique apres login

**Fichier** : `src/pages/Auth.tsx`

- Ajouter une redirection vers `/organizer` quand un utilisateur avec le role `organizer` se connecte (comme c'est deja fait pour admin, provider, etc.)

---

## Resume des fichiers a modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/hooks/useAuth.tsx` | Modifier | Ajouter le role "organizer" et isOrganizer() |
| `src/components/dashboard/DashboardLayout.tsx` | Modifier | Ajouter la navigation organisateur |
| `src/pages/Auth.tsx` | Modifier | Redirection post-login pour organisateurs |
| `src/pages/organizer/OrganizerDashboard.tsx` | Modifier | Afficher les vrais noms des clients dans le chat |
| Migration SQL | Creer | Politiques RLS pour l'acces organisateur |

---

## Section technique : Details RLS

Les politiques RLS actuelles sont strictement limitees par `user_id = auth.uid()` sur `event_planning_requests`. L'organisateur etant un utilisateur different du client, il ne peut pas acceder aux donnees. La solution est d'ajouter une politique basee sur la table pivot `client_organizer_assignments` qui lie les deux.

La chaine d'acces sera :
```text
Organisateur se connecte
  -> client_organizer_assignments (organizer_id = auth.uid())
    -> event_planning_requests (user_id = assignment.client_id)
      -> chat_rooms (event_planning_id = event.id)
        -> chat_messages (room_id = room.id, via chat_room_participants)
```

