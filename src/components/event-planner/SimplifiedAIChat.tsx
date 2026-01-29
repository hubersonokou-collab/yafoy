import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useEventPlannerAI } from '@/hooks/useEventPlannerAI';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Mic, 
  MicOff, 
  Sparkles, 
  MapPin, 
  Star, 
  Check,
  Heart,
  Cake,
  Baby,
  Church,
  Building2,
  PartyPopper,
  ShoppingCart,
  Calculator,
  Calendar,
  Plus,
  CheckCircle2,
  X
} from 'lucide-react';

interface SimplifiedAIChatProps {
  onProductSelect?: (productId: string) => void;
  onReserve?: (productIds: string[]) => void;
  standalone?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  message: string;
}

interface EventType {
  id: string;
  label: string;
  icon: React.ElementType;
}

const EVENT_TYPES: EventType[] = [
  { id: 'mariage', label: 'Mariage', icon: Heart },
  { id: 'anniversaire', label: 'Anniversaire', icon: Cake },
  { id: 'bapteme', label: 'Baptême', icon: Baby },
  { id: 'communion', label: 'Communion', icon: Church },
  { id: 'fete_entreprise', label: 'Entreprise', icon: Building2 },
  { id: 'fiancailles', label: 'Fiançailles', icon: PartyPopper },
];

const SERVICE_ACTIONS: QuickAction[] = [
  { id: 'decoration', label: 'Décoration', icon: Sparkles, message: 'Je cherche de la décoration' },
  { id: 'mobilier', label: 'Mobilier', icon: ShoppingCart, message: 'Je cherche du mobilier (tables, chaises)' },
  { id: 'photo', label: 'Photographe', icon: Star, message: 'Je cherche un photographe' },
  { id: 'son', label: 'Sonorisation', icon: Sparkles, message: 'Je cherche de la sonorisation' },
];

const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `https://dvbgytmkysaztbdqosup.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
};

type ChatStep = 'greeting' | 'event_type' | 'service' | 'days' | 'product_select' | 'confirm' | 'chat';

export const SimplifiedAIChat = ({ onProductSelect, onReserve, standalone = false }: SimplifiedAIChatProps) => {
  const navigate = useNavigate();
  const { messages, isLoading, recommendedProducts, sendMessage, clearMessages } = useEventPlannerAI();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [chatStep, setChatStep] = useState<ChatStep>('greeting');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [rentalDays, setRentalDays] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Greeting message based on step
  const [botMessages, setBotMessages] = useState<Array<{text: string; isBot: boolean}>>([
    { text: 'Bonjour ! 👋 Comment puis-je vous aider aujourd\'hui ?', isBot: true }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [botMessages, messages, recommendedProducts]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleUserMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleUserMessage = (text: string) => {
    setBotMessages(prev => [...prev, { text, isBot: false }]);
    
    // Process based on current step
    if (chatStep === 'greeting' || chatStep === 'chat') {
      // Send to AI for processing
      sendMessage(text);
      setChatStep('chat');
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
    const eventLabel = EVENT_TYPES.find(e => e.id === eventId)?.label || eventId;
    setBotMessages(prev => [
      ...prev, 
      { text: eventLabel, isBot: false },
      { text: `Super ! Pour votre ${eventLabel}, quel type de service recherchez-vous ?`, isBot: true }
    ]);
    setChatStep('service');
  };

  const handleServiceSelect = (action: QuickAction) => {
    setBotMessages(prev => [
      ...prev, 
      { text: action.label, isBot: false },
      { text: 'Combien de jours pour l\'événement ?', isBot: true }
    ]);
    setChatStep('days');
    // Trigger AI search with context
    sendMessage(`Je prépare un ${selectedEvent}. ${action.message}.`);
  };

  const handleDaysSelect = (days: number) => {
    setRentalDays(days);
    setBotMessages(prev => [
      ...prev, 
      { text: `${days} jour${days > 1 ? 's' : ''}`, isBot: false },
      { text: 'Voici les meilleures options pour vous. Sélectionnez ce qui vous intéresse !', isBot: true }
    ]);
    setChatStep('product_select');
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    onProductSelect?.(productId);
  };

  const handleConfirmSelection = () => {
    if (selectedProducts.length === 0) return;
    
    const selected = recommendedProducts.filter(p => selectedProducts.includes(p.id));
    const total = selected.reduce((sum, p) => sum + (p.price_per_day * rentalDays), 0);
    
    setBotMessages(prev => [
      ...prev,
      { text: `Réservation: ${selectedProducts.length} service(s)`, isBot: false },
      { text: `Total pour ${rentalDays} jour(s) : ${total.toLocaleString()} FCFA. Voulez-vous confirmer la réservation ?`, isBot: true }
    ]);
    setChatStep('confirm');
  };

  const handleFinalConfirm = () => {
    onReserve?.(selectedProducts);
    if (standalone) {
      navigate('/client/event-planner');
    }
  };

  const handleQuickReply = (reply: string) => {
    if (reply === 'yes') {
      handleFinalConfirm();
    } else {
      setBotMessages(prev => [
        ...prev,
        { text: 'Non', isBot: false },
        { text: 'Pas de problème ! Voulez-vous modifier votre sélection ou chercher autre chose ?', isBot: true }
      ]);
      setChatStep('product_select');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleUserMessage(input.trim());
    setInput('');
  };

  const startPlanning = () => {
    setBotMessages(prev => [
      ...prev,
      { text: 'Planifier un événement', isBot: false },
      { text: 'Parfait ! Quel type d\'événement organisez-vous ?', isBot: true }
    ]);
    setChatStep('event_type');
  };

  const cleanContent = (content: string) => {
    return content.replace(/\[RECOMMENDATIONS:\s*{.*?}\]/s, '').trim();
  };

  return (
    <Card className={cn("flex flex-col", standalone ? "h-[600px]" : "h-full")}>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-full">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary">Assistant YAFOY</h3>
              <p className="text-xs text-muted-foreground">Disponible 24/7</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {/* Bot/User Messages */}
            {botMessages.map((msg, idx) => (
              <div
                key={`local-${idx}`}
                className={cn(
                  'flex gap-3',
                  msg.isBot ? 'justify-start' : 'justify-end'
                )}
              >
                {msg.isBot && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2',
                    msg.isBot
                      ? 'bg-muted rounded-tl-sm'
                      : 'bg-primary text-primary-foreground rounded-tr-sm'
                  )}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
                {!msg.isBot && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* AI Streaming Messages */}
            {messages.map((msg, idx) => (
              <div
                key={`ai-${idx}`}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{cleanContent(msg.content)}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Reply Buttons based on step */}
            {chatStep === 'greeting' && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={startPlanning}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Planifier un événement
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => {
                    setChatStep('chat');
                    setBotMessages(prev => [...prev, { text: 'Posez-moi votre question, je suis là pour vous aider !', isBot: true }]);
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Autre question
                </Button>
              </div>
            )}

            {chatStep === 'event_type' && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {EVENT_TYPES.map((event) => {
                  const Icon = event.icon;
                  return (
                    <Button
                      key={event.id}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-auto py-3 flex flex-col items-center gap-2 rounded-xl transition-all",
                        selectedEvent === event.id && "border-primary bg-primary/10"
                      )}
                      onClick={() => handleEventSelect(event.id)}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{event.label}</span>
                    </Button>
                  );
                })}
              </div>
            )}

            {chatStep === 'service' && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {SERVICE_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl"
                      onClick={() => handleServiceSelect(action)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            )}

            {chatStep === 'days' && (
              <div className="flex flex-wrap gap-2 mt-4">
                {[1, 2, 3, 5].map((days) => (
                  <Button
                    key={days}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleDaysSelect(days)}
                  >
                    {days} jour{days > 1 ? 's' : ''}
                  </Button>
                ))}
              </div>
            )}

            {/* Product Recommendations */}
            {chatStep === 'product_select' && recommendedProducts.length > 0 && (
              <div className="space-y-3 mt-4">
                {recommendedProducts.slice(0, 4).map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : null;
                  const totalPrice = product.price_per_day * rentalDays;
                  
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => handleProductToggle(product.id)}
                    >
                      <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">{product.category_name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm font-bold text-primary">
                            {totalPrice.toLocaleString()} FCFA
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                              ({rentalDays}j)
                            </span>
                          </p>
                          {product.is_verified && (
                            <Badge className="bg-gold text-gold-foreground text-xs px-1">
                              <Star className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                      </div>
                    </div>
                  );
                })}

                {selectedProducts.length > 0 && (
                  <Button 
                    className="w-full mt-3 h-12 text-base"
                    onClick={handleConfirmSelection}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Réserver ({selectedProducts.length})
                  </Button>
                )}
              </div>
            )}

            {chatStep === 'confirm' && (
              <div className="flex gap-3 mt-4">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleQuickReply('yes')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Oui, confirmer
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleQuickReply('no')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Non
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isListening ? 'destructive' : 'outline'}
              size="icon"
              className="h-11 w-11 rounded-full shrink-0"
              onClick={toggleListening}
              disabled={!recognitionRef.current}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              disabled={isLoading}
              className="flex-1 h-11 rounded-full px-4"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()} 
              size="icon"
              className="h-11 w-11 rounded-full shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
