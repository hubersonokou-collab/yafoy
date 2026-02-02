import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EventPlannerChat } from '@/components/event-planner';
import { AccessibleEventPlanner } from '@/components/event-planner/AccessibleEventPlanner';
import { EditableInvoice } from '@/components/event-planner/EditableInvoice';
import { GlobalPaymentDialog } from '@/components/payment/GlobalPaymentDialog';
import { ProviderTabbedChat } from '@/components/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  MessageSquare, 
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
  Receipt,
  CreditCard,
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
  provider_name?: string;
  quantity: number;
  rental_days: number;
}

interface OrderSummary {
  orderId: string;
  providerId: string;
  providerName: string;
  amount: number;
  items: {
    name: string;
    quantity: number;
    rentalDays: number;
    pricePerDay: number;
    subtotal: number;
  }[];
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Initialiser à 'invoice' si on vient du bot, sinon 'form' - évite le flash du formulaire
  const [step, setStep] = useState<'form' | 'invoice' | 'chat' | 'room'>(
    location.state?.fromBot ? 'invoice' : 'form'
  );
  const [eventData, setEventData] = useState<EventFormData | null>(null);
  const [eventPlanningId, setEventPlanningId] = useState<string | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [invoiceProducts, setInvoiceProducts] = useState<RecommendedProduct[]>([]);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);
  
  // Payment state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);

  // Détection des données venant du bot
  useEffect(() => {
    const handleBotData = async () => {
      if (location.state?.fromBot && user) {
        const botData = location.state as {
          fromBot: boolean;
          selectedProductIds: string[];
          recommendedProducts: any[];
          eventType: string;
          rentalDays: number;
          servicesNeeded: string[];
        };
        
        setLoadingInvoice(true);
        
        try {
          // Créer les données d'événement par défaut
          const eventFormData: EventFormData = {
            eventType: botData.eventType || 'autre',
            eventName: '',
            budgetMin: 0,
            budgetMax: 10000000,
            guestCount: 50,
            eventDate: '',
            eventLocation: '',
            servicesNeeded: botData.servicesNeeded || [],
            additionalNotes: 'Réservation via assistant IA',
          };
          
          setEventData(eventFormData);
          
          // Récupérer les détails complets des produits depuis la base de données
          const productIds = botData.selectedProductIds;
          
          const { data: products } = await supabase
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
            .in('id', productIds);
          
          if (products && products.length > 0) {
            // Récupérer les noms des prestataires
            const providerIds = [...new Set(products.map(p => p.provider_id))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name')
              .in('user_id', providerIds);
            
            const providerNameMap: Record<string, string> = {};
            (profiles || []).forEach(profile => {
              providerNameMap[profile.user_id] = profile.full_name || 'Prestataire';
            });
            
            // Convertir en RecommendedProduct
            const invoiceData: RecommendedProduct[] = products.map(p => ({
              id: p.id,
              name: p.name,
              price_per_day: p.price_per_day,
              location: p.location,
              images: p.images,
              is_verified: p.is_verified,
              category_name: (p.categories as any)?.name,
              category_id: p.category_id,
              provider_id: p.provider_id,
              provider_name: providerNameMap[p.provider_id] || 'Prestataire',
              quantity: 1,
              rental_days: botData.rentalDays || 1,
            }));
            
            // Sauvegarder la demande d'événement
            const { data: eventPlanning, error } = await supabase
              .from('event_planning_requests')
              .insert({
                user_id: user.id,
                event_type: (eventFormData.eventType as any) || 'autre',
                event_name: eventFormData.eventName || null,
                budget_min: eventFormData.budgetMin,
                budget_max: eventFormData.budgetMax,
                guest_count: eventFormData.guestCount,
                event_date: eventFormData.eventDate || null,
                event_location: eventFormData.eventLocation || null,
                services_needed: eventFormData.servicesNeeded,
                additional_notes: eventFormData.additionalNotes || null,
                status: 'draft',
              })
              .select()
              .single();
            
            if (!error && eventPlanning) {
              setEventPlanningId(eventPlanning.id);
            }
            
            setInvoiceProducts(invoiceData);
            setStep('invoice');
          }
        } catch (error) {
          console.error('Error loading bot data:', error);
          toast({
            title: 'Erreur',
            description: "Impossible de charger les données du bot",
            variant: 'destructive',
          });
        } finally {
          setLoadingInvoice(false);
          // Nettoyer le state
          window.history.replaceState({}, document.title);
        }
      }
    };
    
    handleBotData();
  }, [location.state, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Handle payment callback
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (reference) {
      verifyGroupPayment(reference);
    }
  }, [searchParams]);

  const verifyGroupPayment = async (reference: string) => {
    setIsCreatingOrder(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Session non valide');
      }

      const { data, error } = await supabase.functions.invoke('paystack/verify-group', {
        body: { reference },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Paiement réussi !',
          description: `${data.ordersUpdated} commande(s) envoyée(s) aux prestataires`,
          className: 'bg-green-600 text-white',
        });

        // Clear URL params and redirect
        window.history.replaceState({}, '', window.location.pathname);
        navigate('/client/orders');
      } else {
        toast({
          title: 'Paiement échoué',
          description: 'Le paiement n\'a pas été validé. Veuillez réessayer.',
          variant: 'destructive',
        });
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Erreur de vérification',
        description: "Impossible de vérifier le paiement",
        variant: 'destructive',
      });
      window.history.replaceState({}, '', window.location.pathname);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const generateInvoice = async (data: EventFormData) => {
    setLoadingInvoice(true);
    try {
      // Fetch products matching services needed and budget (without profile join)
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

      // Filter products by matching services and select the best ones within budget
      const matchedProducts = (products || []).filter(product => {
        const categoryName = (product.categories as any)?.name?.toLowerCase() || '';
        return data.servicesNeeded.some(service => {
          const keywords = SERVICE_CATEGORY_MAP[service] || [service];
          return keywords.some(keyword => categoryName.includes(keyword.toLowerCase()));
        });
      });

      // Get unique provider IDs to fetch their profiles
      const providerIds = [...new Set(matchedProducts.map(p => p.provider_id))];
      
      // Fetch provider profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', providerIds);

      // Create a map of provider_id to name
      const providerNameMap: Record<string, string> = {};
      (profiles || []).forEach(profile => {
        providerNameMap[profile.user_id] = profile.full_name || 'Prestataire';
      });

      // Group by category and select best option per category within budget
      const productsByCategory: Record<string, any[]> = {};
      matchedProducts.forEach(p => {
        const category = (p.categories as any)?.name || 'Autres';
        if (!productsByCategory[category]) productsByCategory[category] = [];
        productsByCategory[category].push(p);
      });

      // Select the best (verified first, then cheapest) product per category
      let selectedProducts: RecommendedProduct[] = [];
      let runningTotal = 0;
      
      for (const category of Object.keys(productsByCategory)) {
        // Sort by verified first, then by price
        const categoryProducts = productsByCategory[category].sort((a, b) => {
          if (a.is_verified && !b.is_verified) return -1;
          if (!a.is_verified && b.is_verified) return 1;
          return a.price_per_day - b.price_per_day;
        });

        // Pick the first product that fits in budget
        for (const product of categoryProducts) {
          if (runningTotal + product.price_per_day <= data.budgetMax) {
            selectedProducts.push({
              id: product.id,
              name: product.name,
              price_per_day: product.price_per_day,
              location: product.location,
              images: product.images,
              is_verified: product.is_verified,
              category_name: (product.categories as any)?.name,
              category_id: product.category_id,
              provider_id: product.provider_id,
              provider_name: providerNameMap[product.provider_id] || 'Prestataire',
              quantity: 1,
              rental_days: 1,
            });
            runningTotal += product.price_per_day;
            break;
          }
        }
      }

      setInvoiceProducts(selectedProducts);
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de générer la facture",
        variant: 'destructive',
      });
    } finally {
      setLoadingInvoice(false);
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
      
      // Generate invoice directly after form submission
      await generateInvoice(data);
      setStep('invoice');
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de sauvegarder votre événement",
        variant: 'destructive',
      });
    }
  };

  const handleUpdateProducts = (updatedProducts: RecommendedProduct[]) => {
    setInvoiceProducts(updatedProducts);
  };

  const handleRemoveProduct = (productId: string) => {
    setInvoiceProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setInvoiceProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ));
  };

  const handleUpdateRentalDays = (productId: string, days: number) => {
    setInvoiceProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, rental_days: Math.max(1, days) } : p
    ));
  };

  const handleConfirmOrder = async () => {
    if (!user || !eventPlanningId || invoiceProducts.length === 0) return;

    setIsCreatingOrder(true);
    try {
      // Generate a unique group ID for this set of orders
      const newGroupId = crypto.randomUUID();
      
      // Group products by provider
      const productsByProvider = invoiceProducts.reduce((acc, product) => {
        if (!acc[product.provider_id]) {
          acc[product.provider_id] = {
            products: [],
            providerName: product.provider_name || 'Prestataire',
          };
        }
        acc[product.provider_id].products.push(product);
        return acc;
      }, {} as Record<string, { products: RecommendedProduct[]; providerName: string }>);

      const createdOrders: OrderSummary[] = [];

      // Create an order for each provider with the shared group_id
      for (const [providerId, { products, providerName }] of Object.entries(productsByProvider)) {
        const subtotal = products.reduce((sum, p) => sum + (p.price_per_day * p.rental_days * p.quantity), 0);
        
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
            group_id: newGroupId,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems: OrderSummary['items'] = [];
        for (const product of products) {
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              product_id: product.id,
              quantity: product.quantity,
              price_per_day: product.price_per_day,
              rental_days: product.rental_days,
              subtotal: product.price_per_day * product.rental_days * product.quantity,
            });

          if (itemError) throw itemError;

          orderItems.push({
            name: product.name,
            quantity: product.quantity,
            rentalDays: product.rental_days,
            pricePerDay: product.price_per_day,
            subtotal: product.price_per_day * product.rental_days * product.quantity,
          });
        }

        createdOrders.push({
          orderId: order.id,
          providerId,
          providerName,
          amount: subtotal,
          items: orderItems,
        });
      }

      // Update event planning status
      await supabase
        .from('event_planning_requests')
        .update({
          ai_recommendations: invoiceProducts.map(p => p.id),
          status: 'pending_payment',
        })
        .eq('id', eventPlanningId);

      // Set state and show payment dialog
      setGroupId(newGroupId);
      setOrderSummaries(createdOrders);
      setShowPaymentDialog(true);

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
    if (!user || !eventPlanningId || invoiceProducts.length === 0) return;

    setIsCreatingRoom(true);
    try {
      const productIds = invoiceProducts.map(p => p.id);
      
      // Get provider IDs from selected products
      const { data: products } = await supabase
        .from('products')
        .select('id, provider_id')
        .in('id', productIds);

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

      // Add providers as participants
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

      // Update event planning
      await supabase
        .from('event_planning_requests')
        .update({
          ai_recommendations: productIds,
          status: 'pending',
        })
        .eq('id', eventPlanningId);

      // Fetch participants info
      const { data: participantsData } = await supabase
        .from('chat_room_participants')
        .select('user_id, role')
        .eq('room_id', room.id);

      if (participantsData && participantsData.length > 0) {
        // Fetch profiles separately to avoid join issues
        const participantIds = participantsData.map(p => p.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', participantIds);

        const profilesMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);

        setParticipants(participantsData.map(p => ({
          id: p.user_id,
          full_name: profilesMap[p.user_id]?.full_name || null,
          avatar_url: profilesMap[p.user_id]?.avatar_url || null,
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
                else if (step === 'invoice') setStep('form');
                else if (step === 'chat') setStep('invoice');
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
              {step === 'invoice' && (
                <>
                  <Receipt className="h-8 w-8 text-primary" />
                  Facture Pro Forma
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

        {/* Invoice Step */}
        {step === 'invoice' && (
          <div className="space-y-6">
            {loadingInvoice || !eventData ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Chargement de votre facture...</p>
              </div>
            ) : invoiceProducts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">Aucun produit disponible</p>
                  <p className="text-sm text-muted-foreground/70 text-center max-w-sm mb-4">
                    Aucun produit ne correspond à votre budget et services demandés
                  </p>
                  <Button variant="outline" onClick={() => setStep('form')}>
                    Modifier les critères
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <EditableInvoice
                  eventData={eventData}
                  products={invoiceProducts}
                  onUpdateQuantity={handleUpdateQuantity}
                  onUpdateRentalDays={handleUpdateRentalDays}
                  onRemoveProduct={handleRemoveProduct}
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
                    onClick={handleConfirmOrder}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="mr-2 h-5 w-5" />
                    )}
                    Payer la commande
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'chat' && eventData && (
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
            onSelectProducts={() => {}}
            selectedProductIds={invoiceProducts.map(p => p.id)}
          />
        )}

        {step === 'room' && chatRoomId && (
          <div className="h-[650px] rounded-xl overflow-hidden border">
            <ProviderTabbedChat roomId={chatRoomId} participants={participants} />
          </div>
        )}

        {/* Global Payment Dialog */}
        {groupId && (
          <GlobalPaymentDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            orders={orderSummaries}
            groupId={groupId}
            eventType={eventData?.eventType}
            eventDate={eventData?.eventDate}
            eventLocation={eventData?.eventLocation}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientEventPlanner;
