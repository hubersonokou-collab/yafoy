import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoice } from '@/hooks/useVoice';
import { toast } from 'sonner';

interface VoiceButtonProps {
  onTranscript?: (transcript: string) => void;
  onCommand?: (command: string) => void;
  className?: string;
  floating?: boolean;
  showStatus?: boolean;
}

// Voice command patterns
const VOICE_COMMANDS = [
  { pattern: /rechercher?\s+(.+)/i, action: 'search', extract: 1 },
  { pattern: /chercher?\s+(.+)/i, action: 'search', extract: 1 },
  { pattern: /trouver?\s+(.+)/i, action: 'search', extract: 1 },
  { pattern: /réserver?\s+(.+)/i, action: 'reserve', extract: 1 },
  { pattern: /commander?\s+(.+)/i, action: 'order', extract: 1 },
  { pattern: /confirmer/i, action: 'confirm', extract: null },
  { pattern: /annuler/i, action: 'cancel', extract: null },
  { pattern: /retour/i, action: 'back', extract: null },
  { pattern: /accueil/i, action: 'home', extract: null },
  { pattern: /aide/i, action: 'help', extract: null },
  { pattern: /stop/i, action: 'stop', extract: null },
];

export const VoiceButton = ({
  onTranscript,
  onCommand,
  className,
  floating = true,
  showStatus = true,
}: VoiceButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSpeaking,
    stopSpeaking,
    isSupported,
    isTTSSupported,
  } = useVoice({
    language: 'fr-FR',
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (onTranscript) {
        onTranscript(text);
      }
      
      if (isFinal && onCommand) {
        // Parse for voice commands
        for (const cmd of VOICE_COMMANDS) {
          const match = text.match(cmd.pattern);
          if (match) {
            const value = cmd.extract !== null ? match[cmd.extract] : null;
            onCommand(JSON.stringify({ action: cmd.action, value }));
            return;
          }
        }
        // No command matched, send raw transcript
        onCommand(JSON.stringify({ action: 'raw', value: text }));
      }
    },
    onError: (error) => {
      toast.error(error);
    },
    onEnd: () => {
      // Auto-collapse after listening ends
      setTimeout(() => setIsExpanded(false), 2000);
    },
  });

  // Update expanded state when listening
  useEffect(() => {
    if (isListening) {
      setIsExpanded(true);
    }
  }, [isListening]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!isSupported) {
        toast.error('La reconnaissance vocale n\'est pas supportée par votre navigateur');
        return;
      }
      startListening();
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  if (!isSupported && !isTTSSupported) {
    return null;
  }

  const buttonClasses = floating
    ? 'fixed bottom-6 right-6 z-50 shadow-lg'
    : '';

  return (
    <div className={cn(buttonClasses, className)}>
      {/* Expanded panel showing transcript */}
      {isExpanded && showStatus && (
        <div className="absolute bottom-16 right-0 mb-2 w-72 rounded-lg border border-border bg-card p-4 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary">
              {isListening ? 'Écoute en cours...' : 'Résultat'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="min-h-[60px] rounded-md bg-muted p-3">
            {transcript ? (
              <p className="text-sm text-foreground">{transcript}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {isListening ? 'Parlez maintenant...' : 'Aucune transcription'}
              </p>
            )}
          </div>

          {isListening && (
            <div className="mt-2 flex justify-center">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 w-1 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-muted-foreground">
            <p>Commandes: "Rechercher...", "Réserver...", "Confirmer", "Annuler"</p>
          </div>
        </div>
      )}

      {/* Main voice button */}
      <div className="flex gap-2">
        {isSpeaking && isTTSSupported && (
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full bg-destructive/10 hover:bg-destructive/20 border-destructive"
            onClick={handleStopSpeaking}
          >
            <VolumeX className="h-6 w-6 text-destructive" />
          </Button>
        )}
        
        <Button
          size="icon"
          className={cn(
            'h-14 w-14 rounded-full transition-all duration-300',
            isListening
              ? 'bg-primary animate-pulse ring-4 ring-primary/30'
              : 'bg-primary hover:bg-primary/90'
          )}
          onClick={handleToggleListening}
        >
          {isListening ? (
            <MicOff className="h-6 w-6 text-primary-foreground" />
          ) : (
            <Mic className="h-6 w-6 text-primary-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};
