import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EventPlannerChat } from '@/components/event-planner';
import { AccessibleEventPlanner } from '@/components/event-planner/AccessibleEventPlanner';
import { InvoiceDisplay } from '@/components/event-planner/InvoiceDisplay';
import { ChatRoomView } from '@/components/chat';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  MessageSquare, 
  Check, 
  Users,
  Calendar,
  Wallet,
  Sparkles,
  Heart,
  Cake,
  Baby,
  Church,
  Building2,
  PartyPopper,
  Package,
  ShoppingCart,
  Edit3,
  Receipt,
  CreditCard,
  CheckCircle2,
  X
} from 'lucide-react';

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

interface RecommendedProduct {
  id: string;
  name: string;
  price_per_day: number;
  location: string | null;
  images: string[] | null;
  is_verified: boolean;
  category_name?: string;
  category_id: string | null;
  provider_id: string;
  quantity?: number;
  rental_days?: number;
}

const EVENT_TYPE_ICONS: Record<string, React.ElementType> = {
  mariage: Heart,
  bapteme: Baby,
  anniversaire: Cake,
  fete_entreprise: Building2,
  communion: Church,
  fiancailles: PartyPopper,
  autre: Sparkles,
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  anniversaire: 'Anniversaire',
  fete_entreprise: "Fête d'entreprise",
  communion: 'Communion',
  fiancailles: 'Fiançailles',
  autre: 'Autre',
};

const SERVICE_CATEGORY_MAP: Record<string, string[]> = {
  decoration: ['décoration', 'decoration'],
  mobilier: ['mobilier', 'meubles', 'tables', 'chaises'],
  sonorisation: ['sonorisation', 'son', 'audio', 'musique'],
  eclairage: ['éclairage', 'eclairage', 'lumière', 'lumiere'],
  vaisselle: ['vaisselle', 'couverts', 'assiettes'],
  transport: ['transport', 'véhicule', 'vehicule'],
  photographie: ['photographie', 'photo', 'vidéo', 'video'],
  traiteur: ['traiteur', 'repas', 'restauration', 'cuisine'],
};

const ClientEventPlanner = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'form' | 'recommendations' | 'invoice' | 'chat' | 'room'>('form');
  const [eventData, setEventData] = useState<EventFormData | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [eventPlanningId, setEventPlanningId] = useState<string | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);
  const [isEditingSelection, setIsEditingSelection] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchRecommendations = async (data: EventFormData) => {
    setLoadingRecommendations(true);
    try {
      // Fetch products matching services needed and budget
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price_per_day,
          location,
          images,
          is_verified,
          category_id,
          provider_id,
          categories:category_id(name)
        `)
        .eq('is_active', true)
        .lte('price_per_day', data.budgetMax)
        .order('is_verified', { ascending: false })
        .order('price_per_day', { ascending: true });

      if (error) throw error;

      // Filter products by matching services
      const matchedProducts = (products || []).filter(product => {
        const categoryName = (product.categories as any)?.name?.toLowerCase() || '';
        return data.servicesNeeded.some(service => {
          const keywords = SERVICE_CATEGORY_MAP[service] || [service];
          return keywords.some(keyword => categoryName.includes(keyword.toLowerCase()));
        });
      }).map(p => ({
        id: p.id,
        name: p.name,
        price_per_day: p.price_per_day,
        location: p.location,
        images: p.images,
        is_verified: p.is_verified,
        category_name: (p.categories as any)?.name,
        category_id: p.category_id,
        provider_id: p.provider_id,
      }));

      setRecommendedProducts(matchedProducts);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleFormSubmit = async (data: EventFormData) => {
    if (!user) return;

    try {
      // Save event planning request
      const { data: eventPlanning, error } = await supabase
        .from('event_planning_requests')
        .insert({
          user_id: user.id,
          event_type: data.eventType as any,
          event_name: data.eventName || null,
          budget_min: data.budgetMin,
          budget_max: data.budgetMax,
          guest_count: data.guestCount,
          event_date: data.eventDate || null,
          event_location: data.eventLocation || null,
          services_needed: data.servicesNeeded,
          additional_notes: data.additionalNotes || null,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      setEventPlanningId(eventPlanning.id);
      setEventData(data);
      
      // Fetch recommendations directly after form submission
      await fetchRecommendations(data);
      setStep('recommendations');
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de sauvegarder votre événement",
        variant: 'destructive',
      });
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleValidateRecommendations = () => {
    if (selectedProductIds.length === 0) {
      toast({
        title: 'Sélection requise',
        description: 'Veuillez sélectionner au moins un produit',
        variant: 'destructive',
      });
      return;
    }
    setStep('invoice');
  };

  const handleCreateGlobalOrder = async () => {
    if (!user || !eventPlanningId || selectedProductIds.length === 0) return;

    setIsCreatingOrder(true);
    try {
      const selectedProducts = recommendedProducts.filter(p => selectedProductIds.includes(p.id));
      
      // Group products by provider
      const productsByProvider = selectedProducts.reduce((acc, product) => {
        if (!acc[product.provider_id]) acc[product.provider_id] = [];
        acc[product.provider_id].push(product);
        return acc;
      }, {} as Record<string, RecommendedProduct[]>);

      // Create an order for each provider
      for (const [providerId, products] of Object.entries(productsByProvider)) {
        const subtotal = products.reduce((sum, p) => sum + (p.price_per_day * rentalDays * (p.quantity || 1)), 0);
        
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            client_id: user.id,
            provider_id: providerId,
            status: 'pending',
            total_amount: subtotal,
            deposit_paid: 0,
            event_date: eventData?.eventDate || null,
            event_location: eventData?.eventLocation || null,
            notes: `Commande groupée - ${EVENT_TYPE_LABELS[eventData?.eventType || 'autre']}${eventData?.eventName ? ` - ${eventData.eventName}` : ''}`,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        for (const product of products) {
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              product_id: product.id,
              quantity: product.quantity || 1,
              price_per_day: product.price_per_day,
              rental_days: rentalDays,
              subtotal: product.price_per_day * rentalDays * (product.quantity || 1),
            });

          if (itemError) throw itemError;
        }
      }

      // Update event planning status
      await supabase
        .from('event_planning_requests')
        .update({
          ai_recommendations: selectedProductIds,
          status: 'confirmed',
        })
        .eq('id', eventPlanningId);

      toast({
        title: 'Commandes créées',
        description: `${Object.keys(productsByProvider).length} commande(s) envoyée(s) aux prestataires`,
        className: 'bg-success text-success-foreground',
      });

      navigate('/client/orders');
    } catch (error) {
      console.error('Error creating orders:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de créer les commandes",
        variant: 'destructive',
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleCreateChatRoom = async () => {
    if (!user || !eventPlanningId || selectedProductIds.length === 0) return;

    setIsCreatingRoom(true);
    try {
      // Get provider IDs from selected products
      const { data: products } = await supabase
        .from('products')
        .select('id, provider_id')
        .in('id', selectedProductIds);

      if (!products || products.length === 0) throw new Error('Aucun produit sélectionné');

      // Create chat room
      const roomName = eventData?.eventName || `Événement ${EVENT_TYPE_LABELS[eventData?.eventType || 'autre']}`;
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          event_planning_id: eventPlanningId,
          name: roomName,
          created_by: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add organizer as participant
      await supabase.from('chat_room_participants').insert({
        room_id: room.id,
        user_id: user.id,
        role: 'organizer',
      });

      // Add providers as participants and save selected providers
      const providerIds = [...new Set(products.map(p => p.provider_id))];
      
      for (const providerId of providerIds) {
        await supabase.from('chat_room_participants').insert({
          room_id: room.id,
          user_id: providerId,
          role: 'provider',
        });
      }

      // Save selected providers
      for (const product of products) {
        await supabase.from('event_selected_providers').insert({
          event_planning_id: eventPlanningId,
          provider_id: product.provider_id,
          product_id: product.id,
          status: 'pending',
        });
      }

      // Update event planning with recommendations
      await supabase
        .from('event_planning_requests')
        .update({
          ai_recommendations: selectedProductIds,
          status: 'pending',
        })
        .eq('id', eventPlanningId);

      // Fetch participants info
      const { data: participantsData } = await supabase
        .from('chat_room_participants')
        .select(`
          user_id,
          role,
          profiles:user_id(full_name, avatar_url)
        `)
        .eq('room_id', room.id);

      if (participantsData) {
        setParticipants(participantsData.map(p => ({
          id: p.user_id,
          full_name: (p.profiles as any)?.full_name,
          avatar_url: (p.profiles as any)?.avatar_url,
          role: p.role,
        })));
      }

      setChatRoomId(room.id);
      setStep('room');

      toast({
        title: 'Groupe créé',
        description: `${providerIds.length} prestataire(s) ajouté(s) au groupe`,
      });
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de créer le groupe de chat",
        variant: 'destructive',
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const getSelectedProductsWithDetails = () => {
    return recommendedProducts
      .filter(p => selectedProductIds.includes(p.id))
      .map(p => ({
        ...p,
        rental_days: rentalDays,
        quantity: p.quantity || 1,
      }));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const EventIcon = eventData ? EVENT_TYPE_ICONS[eventData.eventType] || Sparkles : Sparkles;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
        {step !== 'form' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => {
                if (step === 'room') setStep('invoice');
                else if (step === 'invoice') setStep('recommendations');
                else if (step === 'chat') setStep('recommendations');
                else if (step === 'recommendations') setStep('form');
              }}
              aria-label="Retour"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-secondary flex items-center gap-3">
              {step === 'form' && (
                <>
                  <Sparkles className="h-8 w-8 text-primary" />
                  Planifier un événement
                </>
              )}
              {step === 'recommendations' && (
                <>
                  <ShoppingCart className="h-8 w-8 text-primary" />
                  Recommandations
                </>
              )}
              {step === 'invoice' && (
                <>
                  <Receipt className="h-8 w-8 text-primary" />
                  Facture & Commande
                </>
              )}
              {step === 'chat' && (
                <>
                  <MessageSquare className="h-8 w-8 text-primary" />
                  Assistant IA
                </>
              )}
              {step === 'room' && (
                <>
                  <Users className="h-8 w-8 text-primary" />
                  Groupe de discussion
                </>
              )}
            </h1>
            {eventData && step !== 'form' && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1 text-sm py-1 px-3">
                  <EventIcon className="h-4 w-4" />
                  {EVENT_TYPE_LABELS[eventData.eventType]}
                </Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {eventData.guestCount} invités
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  {eventData.budgetMax.toLocaleString()} FCFA
                </span>
                {eventData.eventDate && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(eventData.eventDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step Content */}
        {step === 'form' && (
          <AccessibleEventPlanner onSubmit={handleFormSubmit} />
        )}

        {step === 'recommendations' && eventData && (
          <div className="space-y-6">
            {/* Recommendations Header */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold">Recommandations pour votre {EVENT_TYPE_LABELS[eventData.eventType]}</h2>
                    <p className="text-sm text-muted-foreground">
                      {recommendedProducts.length} produit(s) trouvé(s) dans votre budget • Sélectionnez ceux qui vous intéressent
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loadingRecommendations ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Recherche des meilleurs prestataires...</p>
              </div>
            ) : recommendedProducts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">Aucun produit trouvé</p>
                  <p className="text-sm text-muted-foreground/70 text-center max-w-sm mb-4">
                    Essayez d'augmenter votre budget ou de modifier les services recherchés
                  </p>
                  <Button variant="outline" onClick={() => setStep('form')}>
                    Modifier les critères
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Group by category */}
                {Object.entries(
                  recommendedProducts.reduce((acc, product) => {
                    const category = product.category_name || 'Autres';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(product);
                    return acc;
                  }, {} as Record<string, RecommendedProduct[]>)
                ).map(([category, products]) => (
                  <section key={category} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-secondary">{category}</h3>
                      <Badge variant="secondary">{products.length} option(s)</Badge>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {products.map((product) => (
                          <div key={product.id} className="min-w-[280px] max-w-[300px]">
                            <div 
                              className={`relative rounded-xl border-2 transition-all cursor-pointer ${
                                selectedProductIds.includes(product.id) 
                                  ? 'border-primary ring-2 ring-primary/30 shadow-lg' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => handleProductSelect(product.id)}
                            >
                              {selectedProductIds.includes(product.id) && (
                                <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground rounded-full p-1">
                                  <Check className="h-4 w-4" />
                                </div>
                              )}
                              <ProductCard
                                product={{
                                  ...product,
                                  category: product.category_name ? { name: product.category_name } : undefined,
                                }}
                                showFavoriteButton
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </section>
                ))}
              </>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1 h-14"
                onClick={() => setStep('chat')}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Discuter avec l'assistant IA
              </Button>
              
              {selectedProductIds.length > 0 && (
                <Button 
                  size="lg" 
                  className="flex-1 h-14 bg-primary"
                  onClick={handleValidateRecommendations}
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Valider la sélection ({selectedProductIds.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Invoice Step */}
        {step === 'invoice' && eventData && (
          <div className="space-y-6">
            {/* Selection Summary */}
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
                        {selectedProductIds.length} produit(s) sélectionné(s)
                      </h2>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Votre sélection est prête pour la commande
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsEditingSelection(true);
                      setStep('recommendations');
                    }}
                    className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-400"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rental Days Setting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Durée de location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label htmlFor="rental-days" className="whitespace-nowrap">Nombre de jours :</Label>
                  <Input
                    id="rental-days"
                    type="number"
                    min="1"
                    max="30"
                    value={rentalDays}
                    onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">jour(s)</span>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Display */}
            <InvoiceDisplay
              eventData={eventData}
              selectedProducts={getSelectedProductsWithDetails()}
              rentalDays={rentalDays}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1 h-14"
                onClick={handleCreateChatRoom}
                disabled={isCreatingRoom}
              >
                {isCreatingRoom ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="mr-2 h-5 w-5" />
                )}
                Discuter avec les prestataires
              </Button>
              
              <Button 
                size="lg" 
                className="flex-1 h-14 bg-green-600 hover:bg-green-700"
                onClick={handleCreateGlobalOrder}
                disabled={isCreatingOrder}
              >
                {isCreatingOrder ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                Commander tout
              </Button>
            </div>
          </div>
        )}

        {step === 'chat' && eventData && (
          <div className="space-y-4">
            <EventPlannerChat
              eventContext={{
                eventType: eventData.eventType,
                budgetMin: eventData.budgetMin,
                budgetMax: eventData.budgetMax,
                guestCount: eventData.guestCount,
                eventDate: eventData.eventDate,
                eventLocation: eventData.eventLocation,
                servicesNeeded: eventData.servicesNeeded,
              }}
              onSelectProducts={setSelectedProductIds}
              selectedProductIds={selectedProductIds}
            />

            {selectedProductIds.length > 0 && (
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="font-semibold text-lg">
                        {selectedProductIds.length} prestataire(s) sélectionné(s)
                      </span>
                    </div>
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto h-12 text-base"
                      onClick={handleCreateChatRoom} 
                      disabled={isCreatingRoom}
                    >
                      {isCreatingRoom ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <MessageSquare className="h-5 w-5 mr-2" />
                      )}
                      Créer le groupe de discussion
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 'room' && chatRoomId && (
          <div className="h-[600px] rounded-xl overflow-hidden border">
            <ChatRoomView roomId={chatRoomId} participants={participants} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientEventPlanner;
