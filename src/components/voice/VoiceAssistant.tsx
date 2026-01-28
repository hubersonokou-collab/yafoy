import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Volume2, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useVoice } from '@/hooks/useVoice';
import { toast } from 'sonner';

interface VoiceAssistantProps {
  onSearch?: (query: string) => void;
  className?: string;
}

interface VoiceCommand {
  action: string;
  value: string | null;
}

const VOICE_COMMANDS = [
  { pattern: /rechercher?\s+(.+)/i, action: 'search', extract: 1 },
  { pattern: /chercher?\s+(.+)/i, action: 'search', extract: 1 },
  { pattern: /trouver?\s+(.+)/i, action: 'search', extract: 1 },
  { pattern: /aller?\s+(?:à|au|aux)?\s*(.+)/i, action: 'navigate', extract: 1 },
  { pattern: /ouvrir?\s+(.+)/i, action: 'navigate', extract: 1 },
  { pattern: /réserver?\s+(.+)/i, action: 'reserve', extract: 1 },
  { pattern: /commander?\s+(.+)/i, action: 'order', extract: 1 },
  { pattern: /confirmer/i, action: 'confirm', extract: null },
  { pattern: /valider/i, action: 'confirm', extract: null },
  { pattern: /annuler/i, action: 'cancel', extract: null },
  { pattern: /retour/i, action: 'back', extract: null },
  { pattern: /accueil/i, action: 'home', extract: null },
  { pattern: /aide/i, action: 'help', extract: null },
  { pattern: /stop/i, action: 'stop', extract: null },
  { pattern: /arrêter?/i, action: 'stop', extract: null },
  { pattern: /catalogue/i, action: 'catalog', extract: null },
  { pattern: /mes commandes/i, action: 'orders', extract: null },
  { pattern: /mon compte/i, action: 'account', extract: null },
  { pattern: /connexion/i, action: 'login', extract: null },
  { pattern: /déconnexion/i, action: 'logout', extract: null },
  { pattern: /comment ça marche/i, action: 'how-it-works', extract: null },
  { pattern: /devenir prestataire/i, action: 'become-provider', extract: null },
  { pattern: /prestataire/i, action: 'become-provider', extract: null },
  // Provider-specific commands
  { pattern: /ajouter\s+(?:un\s+)?produit/i, action: 'add-product', extract: null },
  { pattern: /nouveau\s+produit/i, action: 'add-product', extract: null },
  { pattern: /mes\s+produits/i, action: 'my-products', extract: null },
  { pattern: /gérer\s+(?:mes\s+)?produits/i, action: 'my-products', extract: null },
  { pattern: /commandes\s+(?:en\s+)?attente/i, action: 'provider-orders', extract: null },
  { pattern: /paramètres/i, action: 'settings', extract: null },
  { pattern: /tableau\s+de\s+bord/i, action: 'dashboard', extract: null },
  // Auth commands
  { pattern: /(?:je\s+veux\s+)?(?:m[''])?inscrire/i, action: 'signup', extract: null },
  { pattern: /créer\s+(?:un\s+)?compte/i, action: 'signup', extract: null },
  { pattern: /(?:me\s+)?connecter/i, action: 'login', extract: null },
];

const NAVIGATION_MAP: Record<string, string> = {
  accueil: '/',
  home: '/',
  catalogue: '/client/catalog',
  produits: '/client/catalog',
  commandes: '/client/orders',
  'mes commandes': '/client/orders',
  favoris: '/client/favorites',
  compte: '/client/settings',
  paramètres: '/client/settings',
  connexion: '/auth',
  login: '/auth',
  'comment ça marche': '/comment-ca-marche',
  'devenir prestataire': '/devenir-prestataire',
  prestataire: '/devenir-prestataire',
  // Provider navigation
  'mes produits': '/provider/products',
  'ajouter produit': '/provider/products',
  'tableau de bord': '/provider',
  dashboard: '/provider',
};

const HELP_MESSAGES = [
  'Dites "Rechercher" suivi de ce que vous cherchez',
  'Dites "Catalogue" pour voir les produits',
  'Dites "Comment ça marche" pour comprendre le fonctionnement',
  'Dites "Devenir prestataire" pour en savoir plus',
  'Dites "Mes commandes" pour voir vos commandes',
  'Dites "Ajouter produit" pour créer un nouveau produit',
  'Dites "Retour" pour revenir en arrière',
  'Dites "Aide" pour entendre ces instructions',
];

export const VoiceAssistant = ({ onSearch, className }: VoiceAssistantProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    isSpeaking,
    stopSpeaking,
    isSupported,
    isTTSSupported,
  } = useVoice({
    language: 'fr-FR',
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal) {
        processCommand(text);
      }
    },
    onError: (error) => {
      toast.error(error);
      setFeedback(error);
    },
  });

  const processCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim();
    
    // Try to match voice commands
    for (const cmd of VOICE_COMMANDS) {
      const match = lowerText.match(cmd.pattern);
      if (match) {
        const value = cmd.extract !== null ? match[cmd.extract] : null;
        const command: VoiceCommand = { action: cmd.action, value };
        setLastCommand(command);
        executeCommand(command);
        return;
      }
    }

    // Try navigation by keyword
    for (const [keyword, path] of Object.entries(NAVIGATION_MAP)) {
      if (lowerText.includes(keyword)) {
        executeCommand({ action: 'navigate', value: path });
        return;
      }
    }

    // No command matched
    setFeedback(`Commande non reconnue: "${text}"`);
    if (isTTSSupported) {
      speak('Je n\'ai pas compris. Dites "Aide" pour les commandes disponibles.');
    }
  }, [isTTSSupported, speak]);

  const executeCommand = useCallback((command: VoiceCommand) => {
    switch (command.action) {
      case 'search':
        if (command.value && onSearch) {
          setFeedback(`Recherche: ${command.value}`);
          onSearch(command.value);
          if (isTTSSupported) {
            speak(`Recherche de ${command.value}`);
          }
        }
        break;

      case 'navigate':
        if (command.value) {
          const path = NAVIGATION_MAP[command.value.toLowerCase()] || command.value;
          setFeedback(`Navigation vers: ${path}`);
          navigate(path);
          if (isTTSSupported) {
            speak(`Navigation vers ${command.value}`);
          }
        }
        break;

      case 'back':
        setFeedback('Retour');
        navigate(-1);
        if (isTTSSupported) {
          speak('Retour à la page précédente');
        }
        break;

      case 'home':
        setFeedback('Accueil');
        navigate('/');
        if (isTTSSupported) {
          speak('Retour à l\'accueil');
        }
        break;

      case 'catalog':
        setFeedback('Catalogue');
        navigate('/client/catalog');
        if (isTTSSupported) {
          speak('Ouverture du catalogue');
        }
        break;

      case 'orders':
        setFeedback('Mes commandes');
        navigate('/client/orders');
        if (isTTSSupported) {
          speak('Ouverture de vos commandes');
        }
        break;

      case 'help':
        setShowHelp(true);
        if (isTTSSupported) {
          speak(HELP_MESSAGES.join('. '));
        }
        break;

      case 'stop':
        stopSpeaking();
        setFeedback('Arrêté');
        break;

      case 'confirm':
        setFeedback('Confirmation');
        if (isTTSSupported) {
          speak('Confirmation');
        }
        // Trigger any pending confirmation action
        document.querySelector<HTMLButtonElement>('[data-voice-confirm]')?.click();
        break;

      case 'cancel':
        setFeedback('Annulation');
        if (isTTSSupported) {
          speak('Annulation');
        }
        // Trigger any pending cancel action
        document.querySelector<HTMLButtonElement>('[data-voice-cancel]')?.click();
        break;

      case 'login':
        navigate('/auth');
        if (isTTSSupported) {
          speak('Page de connexion');
        }
        break;

      case 'how-it-works':
        setFeedback('Comment ça marche');
        navigate('/comment-ca-marche');
        if (isTTSSupported) {
          speak('Voici comment fonctionne YAFOY');
        }
        break;

      case 'become-provider':
        setFeedback('Devenir prestataire');
        navigate('/devenir-prestataire');
        if (isTTSSupported) {
          speak('Page pour devenir prestataire');
        }
        break;

      case 'add-product':
        setFeedback('Ajouter un produit');
        navigate('/provider/products');
        if (isTTSSupported) {
          speak('Ouverture de la gestion des produits. Cliquez sur Ajouter un produit.');
        }
        break;

      case 'my-products':
        setFeedback('Mes produits');
        navigate('/provider/products');
        if (isTTSSupported) {
          speak('Voici vos produits');
        }
        break;

      case 'provider-orders':
        setFeedback('Commandes prestataire');
        navigate('/provider/orders');
        if (isTTSSupported) {
          speak('Voici vos commandes en attente');
        }
        break;

      case 'settings':
        setFeedback('Paramètres');
        navigate('/provider/settings');
        if (isTTSSupported) {
          speak('Ouverture des paramètres');
        }
        break;

      case 'dashboard':
        setFeedback('Tableau de bord');
        navigate('/provider');
        if (isTTSSupported) {
          speak('Voici votre tableau de bord');
        }
        break;

      case 'signup':
        setFeedback('Inscription');
        navigate('/auth');
        if (isTTSSupported) {
          speak('Page d\'inscription. Choisissez votre méthode d\'inscription.');
        }
        break;

      default:
        setFeedback(`Action: ${command.action}`);
    }
  }, [navigate, onSearch, isTTSSupported, speak, stopSpeaking]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!isSupported) {
        toast.error('La reconnaissance vocale n\'est pas supportée');
        return;
      }
      setFeedback('');
      startListening();
      if (isTTSSupported) {
        speak('Je vous écoute');
      }
    }
  };

  // Clear feedback after delay
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Help panel */}
      {showHelp && (
        <Card className="absolute bottom-20 right-0 w-80 p-4 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-secondary flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Commandes vocales
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowHelp(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {HELP_MESSAGES.map((msg, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {msg}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Transcript/feedback display */}
      {(isListening || feedback) && (
        <Card className="absolute bottom-20 right-0 w-72 p-4 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary">
              {isListening ? 'Écoute...' : 'Résultat'}
            </span>
            {isListening && (
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-3 w-1 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-foreground">
            {isListening ? (transcript || 'Parlez maintenant...') : feedback}
          </p>
        </Card>
      )}

      {/* Control buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setShowHelp(!showHelp)}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        {isSpeaking && (
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg border-destructive bg-destructive/10"
            onClick={stopSpeaking}
          >
            <Volume2 className="h-5 w-5 text-destructive" />
          </Button>
        )}

        <Button
          size="icon"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg transition-all',
            isListening && 'ring-4 ring-primary/30 animate-pulse'
          )}
          onClick={handleToggleListening}
        >
          {isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
};
