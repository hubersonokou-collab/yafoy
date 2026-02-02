import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Package, 
  Search, 
  Calendar, 
  Mic, 
  MicOff,
  Heart,
  PartyPopper,
  Baby,
  Cake,
  Building2,
  Church,
  Sparkles,
  HelpCircle,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVoice } from '@/hooks/useVoice';

// Category to event types mapping
const CATEGORY_EVENTS: Record<string, { events: string[], description: string }> = {
  'Décoration': {
    events: ['Mariage', 'Anniversaire', 'Baptême', 'Communion', 'Fiançailles'],
    description: 'Idéal pour embellir vos cérémonies'
  },
  'Mobilier': {
    events: ['Mariage', 'Anniversaire', 'Baptême', 'Communion', 'Entreprise', 'Fiançailles'],
    description: 'Tables, chaises et accessoires pour tous vos événements'
  },
  'Sonorisation': {
    events: ['Mariage', 'Anniversaire', 'Entreprise'],
    description: 'Animation musicale pour vos fêtes'
  },
  'Éclairage': {
    events: ['Mariage', 'Anniversaire', 'Entreprise'],
    description: 'Créez une ambiance unique'
  },
  'Vaisselle': {
    events: ['Mariage', 'Anniversaire', 'Baptême', 'Communion', 'Entreprise', 'Fiançailles'],
    description: 'Service de table élégant'
  },
  'Transport': {
    events: ['Mariage', 'Entreprise'],
    description: 'Déplacement des invités et du matériel'
  },
  'Photographie': {
    events: ['Mariage', 'Anniversaire', 'Baptême', 'Communion', 'Fiançailles'],
    description: 'Immortalisez vos moments précieux'
  },
  'Traiteur': {
    events: ['Mariage', 'Anniversaire', 'Baptême', 'Communion', 'Entreprise', 'Fiançailles'],
    description: 'Restauration de qualité'
  },
};

// Event types with icons and suitable categories
const EVENT_TYPES = [
  { 
    id: 'all', 
    label: 'Tous', 
    icon: Sparkles,
    color: 'bg-primary/10 text-primary',
    categories: [] 
  },
  { 
    id: 'mariage', 
    label: 'Mariage', 
    icon: Heart,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    categories: ['decoration', 'mobilier', 'sonorisation', 'eclairage', 'vaisselle', 'photographie', 'traiteur', 'transport']
  },
  { 
    id: 'anniversaire', 
    label: 'Anniversaire', 
    icon: Cake,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    categories: ['decoration', 'mobilier', 'sonorisation', 'eclairage', 'vaisselle', 'photographie', 'traiteur']
  },
  { 
    id: 'bapteme', 
    label: 'Baptême', 
    icon: Baby,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    categories: ['decoration', 'mobilier', 'vaisselle', 'photographie', 'traiteur']
  },
  { 
    id: 'communion', 
    label: 'Communion', 
    icon: Church,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    categories: ['decoration', 'mobilier', 'vaisselle', 'photographie', 'traiteur']
  },
  { 
    id: 'fete_entreprise', 
    label: 'Entreprise', 
    icon: Building2,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    categories: ['mobilier', 'sonorisation', 'eclairage', 'vaisselle', 'traiteur', 'transport']
  },
  { 
    id: 'fiancailles', 
    label: 'Fiançailles', 
    icon: PartyPopper,
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    categories: ['decoration', 'mobilier', 'vaisselle', 'photographie', 'traiteur']
  },
  { 
    id: 'autre', 
    label: 'Autre', 
    icon: HelpCircle,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    categories: ['decoration', 'mobilier', 'sonorisation', 'eclairage', 'vaisselle', 'photographie', 'traiteur', 'transport']
  },
];

const ClientCatalog = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [eventFilter, setEventFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategoryForEvents, setSelectedCategoryForEvents] = useState<string | null>(null);
  const [showCustomNeedsDialog, setShowCustomNeedsDialog] = useState(false);
  const [customNeeds, setCustomNeeds] = useState('');
  const [orderForm, setOrderForm] = useState({
    event_date: '',
    event_location: '',
    rental_days: '1',
    quantity: '1',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Voice search
  const { isListening, startListening, stopListening, isSupported, speak, isTTSSupported } = useVoice({
    language: 'fr-FR',
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      setSearchQuery(text);
      if (isFinal && isTTSSupported) {
        speak(`Recherche de ${text}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Erreur vocale',
        description: error,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            category:categories(id, name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*'),
      ]);

      setProducts(productsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct) return;

    setSubmitting(true);

    try {
      const rentalDays = parseInt(orderForm.rental_days) || 1;
      const quantity = parseInt(orderForm.quantity) || 1;
      const subtotal = selectedProduct.price_per_day * rentalDays * quantity;
      const depositAmount = (selectedProduct.deposit_amount || 0) * quantity;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: user.id,
          provider_id: selectedProduct.provider_id,
          status: 'pending',
          total_amount: subtotal + depositAmount,
          deposit_paid: 0,
          event_date: orderForm.event_date || null,
          event_location: orderForm.event_location || null,
          notes: orderForm.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: selectedProduct.id,
          quantity,
          price_per_day: selectedProduct.price_per_day,
          rental_days: rentalDays,
          subtotal,
        });

      if (itemError) throw itemError;

      toast({
        title: 'Commande créée',
        description: 'Votre demande de réservation a été envoyée au prestataire.',
        className: 'bg-success text-success-foreground',
      });

      setSelectedProduct(null);
      setOrderForm({
        event_date: '',
        event_location: '',
        rental_days: '1',
        quantity: '1',
        notes: '',
      });

      navigate('/client/orders');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la commande.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      if (isTTSSupported) {
        speak('Dites ce que vous recherchez');
      }
    }
  };

  // Get categories for selected event type
  const selectedEventType = EVENT_TYPES.find(e => e.id === eventFilter);
  const eventCategories = selectedEventType?.categories || [];

  // Filter products based on search, category, and event type
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    
    // If an event type is selected, only show products from suitable categories
    let matchesEvent = true;
    if (eventFilter !== 'all' && eventCategories.length > 0) {
      const categoryName = p.category?.name?.toLowerCase().replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a');
      matchesEvent = eventCategories.some(cat => 
        categoryName?.includes(cat.toLowerCase())
      );
    }
    
    return matchesSearch && matchesCategory && matchesEvent;
  });

  // Group products by category (only categories with products)
  const categoriesWithProducts = categories
    .map((cat) => {
      const catProducts = filteredProducts.filter((p) => p.category_id === cat.id);
      return catProducts.length > 0 ? { category: cat, products: catProducts } : null;
    })
    .filter((item): item is { category: any; products: any[] } => item !== null);

  // Pagination by groups of 2 categories
  const CATEGORIES_PER_PAGE = 2;
  const [categoryPage, setCategoryPage] = useState(1);
  const totalCategoryPages = Math.ceil(categoriesWithProducts.length / CATEGORIES_PER_PAGE);
  
  const startCatIndex = (categoryPage - 1) * CATEGORIES_PER_PAGE;
  const endCatIndex = startCatIndex + CATEGORIES_PER_PAGE;
  const paginatedCategoryGroups = categoriesWithProducts.slice(startCatIndex, endCatIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCategoryPage(1);
  }, [searchQuery, categoryFilter, eventFilter]);

  // Calculate display info for pagination
  const displayedCategoryNames = paginatedCategoryGroups.map((g) => g.category.name).join(' + ');
  const totalProductsOnPage = paginatedCategoryGroups.reduce((sum, g) => sum + g.products.length, 0);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary">Catalogue</h1>
            <p className="text-muted-foreground">Trouvez l'équipement parfait pour votre événement</p>
          </div>
          <Badge variant="outline" className="w-fit text-sm">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Event Type Filter - Large visual buttons */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Type d'événement</span>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-3">
              {EVENT_TYPES.map((event) => {
                const Icon = event.icon;
                const isSelected = eventFilter === event.id;
                return (
                  <button
                    key={event.id}
                    onClick={() => {
                      if (event.id === 'autre') {
                        setShowCustomNeedsDialog(true);
                      }
                      setEventFilter(event.id);
                    }}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                      min-w-[100px] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary
                      ${isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border hover:border-primary/50 bg-card'
                      }
                    `}
                    aria-pressed={isSelected}
                    aria-label={event.label}
                  >
                    <div className={`p-3 rounded-full ${event.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {event.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          
          {/* Custom needs display when "Autre" is selected */}
          {eventFilter === 'autre' && customNeeds && (
            <Card className="mt-3 border-primary/30 bg-primary/5 animate-in slide-in-from-top-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Vos besoins personnalisés:</p>
                      <p className="text-sm text-muted-foreground mt-1">{customNeeds}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowCustomNeedsDialog(true)}
                  >
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search and Category Filter */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un équipement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-11 pr-14 h-12 text-base ${isListening ? 'ring-2 ring-primary animate-pulse' : ''}`}
                  aria-label="Rechercher"
                />
                {isSupported && (
                  <Button
                    variant={isListening ? 'default' : 'ghost'}
                    size="icon"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full ${isListening ? 'animate-pulse' : ''}`}
                    onClick={toggleVoiceSearch}
                    aria-label={isListening ? 'Arrêter l\'écoute' : 'Recherche vocale'}
                  >
                    {isListening ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-56 h-12">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg z-50">
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clickable Categories with Event Proposals */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Cliquez sur une catégorie pour voir les événements proposés</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat) => {
              const categoryEvents = CATEGORY_EVENTS[cat.name];
              const isSelected = selectedCategoryForEvents === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryForEvents(isSelected ? null : cat.name);
                    setCategoryFilter(cat.id);
                  }}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary
                    ${isSelected 
                      ? 'border-primary bg-primary/10 shadow-lg' 
                      : 'border-border hover:border-primary/50 bg-card'
                    }
                  `}
                >
                  <Package className="h-6 w-6 text-primary" />
                  <span className={`text-sm font-medium text-center ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Event Proposals Popup */}
          {selectedCategoryForEvents && CATEGORY_EVENTS[selectedCategoryForEvents] && (
            <Card className="border-2 border-primary/30 bg-primary/5 animate-in slide-in-from-top-2 duration-300">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-primary">
                      {selectedCategoryForEvents}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedCategoryForEvents(null)}
                    >
                      Fermer
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_EVENTS[selectedCategoryForEvents].description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-foreground">Événements proposés:</span>
                    {CATEGORY_EVENTS[selectedCategoryForEvents].events.map((event) => {
                      const eventType = EVENT_TYPES.find(e => e.label === event);
                      const Icon = eventType?.icon || Sparkles;
                      return (
                        <Badge 
                          key={event} 
                          variant="secondary" 
                          className={`flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform ${eventType?.color || ''}`}
                          onClick={() => {
                            const matchedEvent = EVENT_TYPES.find(e => e.label === event);
                            if (matchedEvent) {
                              setEventFilter(matchedEvent.id);
                              setSelectedCategoryForEvents(null);
                            }
                          }}
                        >
                          <Icon className="h-3 w-3" />
                          {event}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Products by Category Sections */}
        {filteredProducts.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">Aucun produit trouvé</p>
              <p className="text-sm text-muted-foreground/70 text-center max-w-sm">
                Essayez de modifier vos filtres ou d'utiliser la recherche vocale
              </p>
              {isSupported && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={toggleVoiceSearch}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Recherche vocale
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {paginatedCategoryGroups.map(({ category, products: catProducts }) => (
              <section key={category.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-secondary">{category.name}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {catProducts.length} article{catProducts.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {catProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        ...product,
                        category: product.category,
                      }}
                      showFavoriteButton
                      onReserve={() => {
                        if (!user) {
                          navigate('/auth');
                          return;
                        }
                        setSelectedProduct(product);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
            
            {/* Pagination by Categories */}
            {totalCategoryPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {categoryPage} sur {totalCategoryPages} — {displayedCategoryNames} ({totalProductsOnPage} produit{totalProductsOnPage > 1 ? 's' : ''})
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCategoryPage((prev) => Math.max(1, prev - 1))}
                    disabled={categoryPage <= 1}
                    className="gap-1"
                  >
                    Précédent
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: totalCategoryPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={categoryPage === page ? 'default' : 'outline'}
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => setCategoryPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCategoryPage((prev) => Math.min(totalCategoryPages, prev + 1))}
                    disabled={categoryPage >= totalCategoryPages}
                    className="gap-1"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Réserver ce produit
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <form onSubmit={handleOrder} className="space-y-4">
                <div className="rounded-xl border-2 border-primary/20 p-4 bg-primary/5">
                  <p className="font-semibold text-lg">{selectedProduct.name}</p>
                  <p className="text-primary font-bold text-xl mt-1">
                    {Number(selectedProduct.price_per_day).toLocaleString()} FCFA
                    <span className="text-sm font-normal text-muted-foreground">/jour</span>
                  </p>
                  {selectedProduct.deposit_amount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Caution: {Number(selectedProduct.deposit_amount).toLocaleString()} FCFA
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Date</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={orderForm.event_date}
                      onChange={(e) => setOrderForm({ ...orderForm, event_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rental_days">Jours</Label>
                    <Input
                      id="rental_days"
                      type="number"
                      min="1"
                      value={orderForm.rental_days}
                      onChange={(e) => setOrderForm({ ...orderForm, rental_days: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProduct.quantity_available}
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_location">Lieu</Label>
                    <Input
                      id="event_location"
                      placeholder="Ville"
                      value={orderForm.event_location}
                      onChange={(e) => setOrderForm({ ...orderForm, event_location: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informations supplémentaires..."
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Total */}
                <div className="rounded-xl bg-muted p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Location</span>
                    <span>
                      {(
                        selectedProduct.price_per_day *
                        (parseInt(orderForm.rental_days) || 1) *
                        (parseInt(orderForm.quantity) || 1)
                      ).toLocaleString()} FCFA
                    </span>
                  </div>
                  {selectedProduct.deposit_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Caution</span>
                      <span>
                        {(
                          selectedProduct.deposit_amount * (parseInt(orderForm.quantity) || 1)
                        ).toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">
                      {(
                        (selectedProduct.price_per_day *
                          (parseInt(orderForm.rental_days) || 1) +
                          (selectedProduct.deposit_amount || 0)) *
                        (parseInt(orderForm.quantity) || 1)
                      ).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="mr-2 h-5 w-5" />
                      Confirmer la réservation
                    </>
                  )}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Custom Needs Dialog for "Autre" event type */}
        <Dialog open={showCustomNeedsDialog} onOpenChange={setShowCustomNeedsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Décrivez votre événement
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Décrivez votre événement et ce dont vous avez besoin. Nous afficherons tous les produits disponibles.
              </p>
              <div className="space-y-2">
                <Label htmlFor="custom-needs">Vos besoins</Label>
                <Textarea
                  id="custom-needs"
                  value={customNeeds}
                  onChange={(e) => setCustomNeeds(e.target.value)}
                  placeholder="Ex: Je prépare une cérémonie traditionnelle et j'ai besoin de chaises, tables, et décoration..."
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowCustomNeedsDialog(false);
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setShowCustomNeedsDialog(false);
                    // Apply search with custom needs as filter
                    if (customNeeds) {
                      setSearchQuery(customNeeds.split(' ').slice(0, 3).join(' '));
                    }
                    toast({
                      title: 'Besoins enregistrés',
                      description: 'Tous les produits sont affichés. Utilisez la recherche pour affiner.',
                    });
                  }}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClientCatalog;
