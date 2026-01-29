import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useEventPlannerAI } from '@/hooks/useEventPlannerAI';
import { Send, Bot, User, Loader2, Mic, MicOff, Sparkles, MapPin, Star, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventContext {
  eventType?: string;
  budgetMin?: number;
  budgetMax?: number;
  guestCount?: number;
  eventDate?: string;
  eventLocation?: string;
  servicesNeeded?: string[];
}

interface EventPlannerChatProps {
  eventContext: EventContext;
  onSelectProducts: (productIds: string[]) => void;
  selectedProductIds: string[];
}

const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `https://dvbgytmkysaztbdqosup.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
};

export const EventPlannerChat = ({ eventContext, onSelectProducts, selectedProductIds }: EventPlannerChatProps) => {
  const { messages, isLoading, recommendedProducts, sendMessage } = useEventPlannerAI();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage(input.trim(), eventContext);
    setInput('');
  };

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

  const toggleProductSelection = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onSelectProducts(selectedProductIds.filter(id => id !== productId));
    } else {
      onSelectProducts([...selectedProductIds, productId]);
    }
  };

  const cleanContent = (content: string) => {
    return content.replace(/\[RECOMMENDATIONS:\s*{.*?}\]/s, '').trim();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Chat Section */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistant YAFOY
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Bonjour ! Je suis votre assistant pour planifier votre événement. 
                    Décrivez-moi votre projet et je vous recommanderai les meilleurs prestataires.
                  </p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
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
                      'max-w-[80%] rounded-lg px-4 py-2',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{cleanContent(msg.content)}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                onClick={toggleListening}
                disabled={!recognitionRef.current}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Décrivez votre événement..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      {recommendedProducts.length > 0 && (
        <Card className="lg:w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recommandations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {recommendedProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : null;
                  
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        'border rounded-lg p-3 cursor-pointer transition-all',
                        isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      )}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                          {imageUrl ? (
                            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Sparkles className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          {product.category_name && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {product.category_name}
                            </Badge>
                          )}
                          {product.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {product.location}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm font-semibold text-primary">
                              {Number(product.price_per_day).toLocaleString()} FCFA/j
                            </p>
                            {product.is_verified && (
                              <Badge className="bg-gold text-gold-foreground text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Vérifié
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            {selectedProductIds.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedProductIds.length} prestataire(s) sélectionné(s)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
