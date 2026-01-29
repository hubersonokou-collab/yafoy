import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useVoice } from '@/hooks/useVoice';
import { 
  Heart, 
  Cake, 
  Baby, 
  Church, 
  Building2, 
  PartyPopper,
  HelpCircle,
  Users,
  Wallet,
  Calendar,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Check,
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// Import category images
import decorationImg from '@/assets/categories/decoration.jpg';
import mobilierImg from '@/assets/categories/mobilier.jpg';
import sonorisationImg from '@/assets/categories/sonorisation.jpg';
import eclairageImg from '@/assets/categories/eclairage.jpg';
import vaisselleImg from '@/assets/categories/vaisselle.jpg';
import transportImg from '@/assets/categories/transport.jpg';
import photographieImg from '@/assets/categories/photographie.jpg';
import traiteurImg from '@/assets/categories/traiteur.jpg';

interface EventFormData {
  eventType: string;
  eventName: string;
  budgetMin: number;
  budgetMax: number;
  guestCount: number;
  eventDate: string;
  eventLocation: string;
  servicesNeeded: string[];
  additionalNotes: string;
}

interface AccessibleEventPlannerProps {
  onSubmit: (data: EventFormData) => void;
  initialData?: Partial<EventFormData>;
}

const EVENT_TYPES = [
  { id: 'mariage', label: 'Mariage', icon: Heart, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', voiceLabel: 'Mariage, pour une cérémonie de mariage' },
  { id: 'anniversaire', label: 'Anniversaire', icon: Cake, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', voiceLabel: 'Anniversaire, pour une fête d\'anniversaire' },
  { id: 'bapteme', label: 'Baptême', icon: Baby, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', voiceLabel: 'Baptême, pour une cérémonie de baptême' },
  { id: 'communion', label: 'Communion', icon: Church, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', voiceLabel: 'Communion, pour une cérémonie de communion' },
  { id: 'fete_entreprise', label: 'Entreprise', icon: Building2, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', voiceLabel: 'Fête d\'entreprise, pour un événement professionnel' },
  { id: 'fiancailles', label: 'Fiançailles', icon: PartyPopper, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', voiceLabel: 'Fiançailles, pour une cérémonie de fiançailles' },
];

const SERVICES = [
  { id: 'decoration', label: 'Décoration', image: decorationImg, voiceLabel: 'Décoration pour embellir votre événement' },
  { id: 'mobilier', label: 'Mobilier', image: mobilierImg, voiceLabel: 'Mobilier, tables et chaises' },
  { id: 'sonorisation', label: 'Son', image: sonorisationImg, voiceLabel: 'Sonorisation et musique' },
  { id: 'eclairage', label: 'Lumière', image: eclairageImg, voiceLabel: 'Éclairage et lumières' },
  { id: 'vaisselle', label: 'Vaisselle', image: vaisselleImg, voiceLabel: 'Vaisselle et couverts' },
  { id: 'transport', label: 'Transport', image: transportImg, voiceLabel: 'Transport de personnes ou matériel' },
  { id: 'photographie', label: 'Photo', image: photographieImg, voiceLabel: 'Photographie et vidéo' },
  { id: 'traiteur', label: 'Repas', image: traiteurImg, voiceLabel: 'Traiteur et restauration' },
];

const GUEST_PRESETS = [
  { value: 50, label: '50', icon: '👥' },
  { value: 100, label: '100', icon: '👥👥' },
  { value: 200, label: '200', icon: '👥👥👥' },
  { value: 500, label: '500+', icon: '🎉' },
];

const BUDGET_PRESETS = [
  { min: 100000, max: 500000, label: '100K - 500K', icon: '💰' },
  { min: 500000, max: 1000000, label: '500K - 1M', icon: '💰💰' },
  { min: 1000000, max: 3000000, label: '1M - 3M', icon: '💰💰💰' },
  { min: 3000000, max: 10000000, label: '3M+', icon: '💎' },
];

const STEPS = [
  { id: 'event', label: 'Événement', icon: Sparkles, voiceIntro: 'Étape 1: Choisissez le type d\'événement. Appuyez sur l\'icône qui correspond à votre événement.' },
  { id: 'guests', label: 'Invités', icon: Users, voiceIntro: 'Étape 2: Combien d\'invités attendez-vous? Appuyez sur le nombre approximatif.' },
  { id: 'budget', label: 'Budget', icon: Wallet, voiceIntro: 'Étape 3: Quel est votre budget? Appuyez sur la gamme de prix qui vous convient.' },
  { id: 'services', label: 'Services', icon: HelpCircle, voiceIntro: 'Étape 4: De quoi avez-vous besoin? Appuyez sur les images des services souhaités.' },
];

export const AccessibleEventPlanner = ({ onSubmit, initialData }: AccessibleEventPlannerProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EventFormData>({
    eventType: initialData?.eventType || '',
    eventName: initialData?.eventName || '',
    budgetMin: initialData?.budgetMin || 0,
    budgetMax: initialData?.budgetMax || 0,
    guestCount: initialData?.guestCount || 0,
    eventDate: initialData?.eventDate || '',
    eventLocation: initialData?.eventLocation || '',
    servicesNeeded: initialData?.servicesNeeded || [],
    additionalNotes: initialData?.additionalNotes || '',
  });
  const [audioEnabled, setAudioEnabled] = useState(true);

  const { speak, stopSpeaking, isSpeaking, isTTSSupported, isListening, startListening, stopListening, isSupported: isVoiceSupported } = useVoice({
    language: 'fr-FR',
    onResult: (text, isFinal) => {
      if (isFinal) {
        handleVoiceCommand(text);
      }
    },
  });

  // Announce step on change
  useEffect(() => {
    if (audioEnabled && isTTSSupported) {
      const step = STEPS[currentStep];
      speak(step.voiceIntro);
    }
  }, [currentStep, audioEnabled, isTTSSupported]);

  const handleVoiceCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    
    // Navigation commands
    if (lowerText.includes('suivant') || lowerText.includes('continuer')) {
      handleNext();
      return;
    }
    if (lowerText.includes('retour') || lowerText.includes('précédent')) {
      handleBack();
      return;
    }
    
    // Step-specific commands
    if (currentStep === 0) {
      // Event type selection
      const matchedEvent = EVENT_TYPES.find(e => 
        lowerText.includes(e.label.toLowerCase())
      );
      if (matchedEvent) {
        setFormData(prev => ({ ...prev, eventType: matchedEvent.id }));
        if (audioEnabled && isTTSSupported) {
          speak(`${matchedEvent.label} sélectionné. Dites suivant pour continuer.`);
        }
      }
    } else if (currentStep === 1) {
      // Guest count
      const numbers = text.match(/\d+/);
      if (numbers) {
        const count = parseInt(numbers[0]);
        setFormData(prev => ({ ...prev, guestCount: count }));
        if (audioEnabled && isTTSSupported) {
          speak(`${count} invités. Dites suivant pour continuer.`);
        }
      }
    } else if (currentStep === 3) {
      // Services selection
      const matchedService = SERVICES.find(s => 
        lowerText.includes(s.label.toLowerCase())
      );
      if (matchedService) {
        handleServiceToggle(matchedService.id);
      }
    }
  }, [currentStep, audioEnabled, isTTSSupported]);

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      servicesNeeded: prev.servicesNeeded.includes(serviceId)
        ? prev.servicesNeeded.filter(s => s !== serviceId)
        : [...prev.servicesNeeded, serviceId],
    }));
    
    const service = SERVICES.find(s => s.id === serviceId);
    if (audioEnabled && isTTSSupported && service) {
      const isSelected = !formData.servicesNeeded.includes(serviceId);
      speak(isSelected ? `${service.label} ajouté` : `${service.label} retiré`);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit
      if (audioEnabled && isTTSSupported) {
        speak('Parfait! Nous allons maintenant vous proposer des recommandations personnalisées.');
      }
      onSubmit(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleAudio = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setAudioEnabled(!audioEnabled);
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      if (audioEnabled && isTTSSupported) {
        speak('Je vous écoute');
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!formData.eventType;
      case 1: return formData.guestCount > 0;
      case 2: return formData.budgetMax > 0;
      case 3: return formData.servicesNeeded.length > 0;
      default: return true;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress and Controls */}
      <div className="flex items-center justify-between">
        {/* Step Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full transition-all',
                  isActive && 'bg-primary text-primary-foreground scale-110 shadow-lg',
                  isCompleted && 'bg-green-500 text-white',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}
                aria-label={step.label}
              >
                {isCompleted ? <Check className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
              </div>
            );
          })}
        </div>

        {/* Audio/Voice Controls */}
        <div className="flex items-center gap-2">
          {isVoiceSupported && (
            <Button
              variant={isListening ? 'default' : 'outline'}
              size="icon"
              className={cn('h-12 w-12 rounded-full', isListening && 'animate-pulse')}
              onClick={toggleVoice}
              aria-label={isListening ? 'Arrêter l\'écoute' : 'Commande vocale'}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          )}
          {isTTSSupported && (
            <Button
              variant={audioEnabled ? 'default' : 'outline'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleAudio}
              aria-label={audioEnabled ? 'Désactiver le son' : 'Activer le son'}
            >
              {audioEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
          )}
        </div>
      </div>

      {/* Step Content */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {/* Step 1: Event Type */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold text-secondary">Quel événement?</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {EVENT_TYPES.map((event) => {
                  const Icon = event.icon;
                  const isSelected = formData.eventType === event.id;
                  return (
                    <button
                      key={event.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, eventType: event.id }));
                        if (audioEnabled && isTTSSupported) {
                          speak(`${event.label} sélectionné`);
                        }
                      }}
                      className={cn(
                        'flex flex-col items-center gap-3 p-6 rounded-2xl border-3 transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/50',
                        isSelected 
                          ? 'border-primary bg-primary/10 shadow-xl ring-2 ring-primary' 
                          : 'border-border hover:border-primary/50 bg-card'
                      )}
                      aria-pressed={isSelected}
                      aria-label={event.label}
                    >
                      <div className={cn('p-4 rounded-full', event.color)}>
                        <Icon className="h-10 w-10" />
                      </div>
                      <span className={cn('text-lg font-semibold', isSelected && 'text-primary')}>
                        {event.label}
                      </span>
                      {isSelected && <Check className="h-6 w-6 text-green-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Guest Count */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold text-secondary">Combien d'invités?</h2>
              </div>
              
              {/* Manual Input Field */}
              <div className="flex flex-col items-center gap-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Entrez le nombre exact ou choisissez ci-dessous
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.guestCount || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, guestCount: value }));
                  }}
                  placeholder="Nombre d'invités"
                  className="w-48 h-16 text-3xl font-bold text-center border-2 border-primary/30 rounded-xl bg-background focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
                  aria-label="Nombre d'invités"
                />
              </div>
              
              {/* Preset buttons */}
              <div className="grid grid-cols-2 gap-4">
                {GUEST_PRESETS.map((preset) => {
                  const isSelected = formData.guestCount === preset.value;
                  return (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, guestCount: preset.value }));
                        if (audioEnabled && isTTSSupported) {
                          speak(`${preset.label} invités`);
                        }
                      }}
                      className={cn(
                        'flex flex-col items-center gap-3 p-6 rounded-2xl border-3 transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/50',
                        isSelected 
                          ? 'border-primary bg-primary/10 shadow-xl' 
                          : 'border-border hover:border-primary/50 bg-card'
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="text-3xl">{preset.icon}</span>
                      <span className={cn('text-xl font-bold', isSelected && 'text-primary')}>
                        {preset.label}
                      </span>
                      {isSelected && <Check className="h-6 w-6 text-green-500" />}
                    </button>
                  );
                })}
              </div>
              
              {/* Fine-tune controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setFormData(prev => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 10) }))}
                >
                  <ChevronDown className="h-6 w-6" />
                </Button>
                <span className="text-2xl font-bold text-primary w-24 text-center">{formData.guestCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setFormData(prev => ({ ...prev, guestCount: prev.guestCount + 10 }))}
                >
                  <ChevronUp className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Wallet className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold text-secondary">Votre budget?</h2>
              </div>
              
              {/* Manual Input Fields */}
              <div className="flex flex-col items-center gap-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Entrez votre budget en FCFA ou choisissez une gamme
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">Minimum</span>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={formData.budgetMin || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, budgetMin: value }));
                      }}
                      placeholder="Min"
                      className="w-40 h-14 text-xl font-bold text-center border-2 border-border rounded-xl bg-background focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
                      aria-label="Budget minimum"
                    />
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground">—</span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">Maximum *</span>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={formData.budgetMax || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, budgetMax: value }));
                      }}
                      placeholder="Max"
                      className="w-40 h-14 text-xl font-bold text-center border-2 border-primary/30 rounded-xl bg-background focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
                      aria-label="Budget maximum"
                    />
                  </div>
                </div>
                {formData.budgetMax > 0 && (
                  <span className="text-lg font-semibold text-primary">
                    {formData.budgetMin.toLocaleString()} - {formData.budgetMax.toLocaleString()} FCFA
                  </span>
                )}
              </div>
              
              {/* Preset buttons */}
              <div className="grid grid-cols-2 gap-4">
                {BUDGET_PRESETS.map((preset) => {
                  const isSelected = formData.budgetMax === preset.max && formData.budgetMin === preset.min;
                  return (
                    <button
                      key={preset.max}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, budgetMin: preset.min, budgetMax: preset.max }));
                        if (audioEnabled && isTTSSupported) {
                          speak(`Budget ${preset.label} francs`);
                        }
                      }}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-2xl border-3 transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/50',
                        isSelected 
                          ? 'border-primary bg-primary/10 shadow-xl' 
                          : 'border-border hover:border-primary/50 bg-card'
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="text-2xl">{preset.icon}</span>
                      <span className={cn('text-base font-bold', isSelected && 'text-primary')}>
                        {preset.label}
                      </span>
                      <span className="text-xs text-muted-foreground">FCFA</span>
                      {isSelected && <Check className="h-5 w-5 text-green-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Services */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <HelpCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold text-secondary">De quoi avez-vous besoin?</h2>
                <p className="text-muted-foreground mt-2">Appuyez sur les images pour sélectionner</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {SERVICES.map((service) => {
                  const isSelected = formData.servicesNeeded.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleServiceToggle(service.id)}
                      className={cn(
                        'relative overflow-hidden rounded-2xl border-3 transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/50 aspect-square',
                        isSelected 
                          ? 'border-primary shadow-xl ring-2 ring-primary' 
                          : 'border-border hover:border-primary/50'
                      )}
                      aria-pressed={isSelected}
                      aria-label={service.label}
                    >
                      <img 
                        src={service.image} 
                        alt={service.label}
                        className="w-full h-full object-cover"
                      />
                      <div className={cn(
                        'absolute inset-0 flex flex-col items-center justify-center transition-all',
                        isSelected ? 'bg-primary/80' : 'bg-black/40 hover:bg-black/50'
                      )}>
                        <span className="text-white font-bold text-lg drop-shadow-lg">
                          {service.label}
                        </span>
                        {isSelected && <Check className="h-8 w-8 text-white mt-2" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {formData.servicesNeeded.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center pt-4">
                  {formData.servicesNeeded.map(id => {
                    const service = SERVICES.find(s => s.id === id);
                    return service ? (
                      <span key={id} className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        {service.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        {currentStep > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-16 text-lg rounded-xl"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-6 w-6" />
            Retour
          </Button>
        )}
        <Button
          size="lg"
          className={cn('flex-1 h-16 text-lg rounded-xl', !canProceed() && 'opacity-50')}
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {currentStep === STEPS.length - 1 ? (
            <>
              <Sparkles className="mr-2 h-6 w-6" />
              Voir les recommandations
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="ml-2 h-6 w-6" />
            </>
          )}
        </Button>
      </div>

      {/* Voice listening indicator */}
      {isListening && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-xl animate-pulse flex items-center gap-2">
          <Mic className="h-5 w-5" />
          <span className="font-medium">Je vous écoute...</span>
        </div>
      )}
    </div>
  );
};
