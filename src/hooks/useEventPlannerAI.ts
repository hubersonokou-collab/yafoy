import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface EventContext {
  eventType?: string;
  budgetMin?: number;
  budgetMax?: number;
  guestCount?: number;
  eventDate?: string;
  eventLocation?: string;
  servicesNeeded?: string[];
}

interface RecommendedProduct {
  id: string;
  name: string;
  price_per_day: number;
  location: string | null;
  images: string[] | null;
  is_verified: boolean;
  category_name?: string;
}

export const useEventPlannerAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);

  const extractRecommendations = (content: string): string[] => {
    const match = content.match(/\[RECOMMENDATIONS:\s*({.*?})\]/s);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        return parsed.products || [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const fetchProductDetails = async (productIds: string[]) => {
    if (productIds.length === 0) return;

    const { data } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price_per_day,
        location,
        images,
        is_verified,
        categories:category_id(name)
      `)
      .in('id', productIds);

    if (data) {
      const products = data.map(p => ({
        id: p.id,
        name: p.name,
        price_per_day: p.price_per_day,
        location: p.location,
        images: p.images,
        is_verified: p.is_verified,
        category_name: (p.categories as any)?.name,
      }));
      setRecommendedProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = products.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
    }
  };

  const sendMessage = useCallback(async (
    input: string,
    eventContext?: EventContext
  ) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';
    
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://dvbgytmkysaztbdqosup.supabase.co/functions/v1/event-planner-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            eventContext,
          }),
        }
      );

      if (!response.ok || !response.body) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur de communication avec l\'IA');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Extract and fetch recommended products
      const productIds = extractRecommendations(assistantContent);
      if (productIds.length > 0) {
        await fetchProductDetails(productIds);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Désolé, une erreur s'est produite: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearRecommendations = () => setRecommendedProducts([]);
  const clearMessages = () => {
    setMessages([]);
    setRecommendedProducts([]);
  };

  return {
    messages,
    isLoading,
    recommendedProducts,
    sendMessage,
    clearRecommendations,
    clearMessages,
  };
};
