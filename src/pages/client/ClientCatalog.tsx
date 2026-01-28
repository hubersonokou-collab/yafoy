import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { Loader2, Package, Search, Calendar, Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVoice } from '@/hooks/useVoice';

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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderForm, setOrderForm] = useState({
    event_date: '',
    event_location: '',
    rental_days: '1',
    quantity: '1',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Voice search
  const { isListening, startListening, stopListening, isSupported } = useVoice({
    language: 'fr-FR',
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      setSearchQuery(text);
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
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            category:categories(name)
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
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
        <div>
          <h1 className="text-2xl font-bold text-secondary">Catalogue</h1>
          <p className="text-muted-foreground">Parcourez tous les équipements disponibles</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-12 ${isListening ? 'ring-2 ring-primary animate-pulse' : ''}`}
                />
                {isSupported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={toggleVoiceSearch}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 text-primary" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
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

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun produit trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  category: product.category,
                }}
                showFavoriteButton
                onReserve={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}

        {/* Order Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Réserver ce produit</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <form onSubmit={handleOrder} className="space-y-4">
                <div className="rounded-lg border p-3">
                  <p className="font-semibold">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {Number(selectedProduct.price_per_day).toLocaleString()} FCFA/jour
                  </p>
                  {selectedProduct.deposit_amount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Caution: {Number(selectedProduct.deposit_amount).toLocaleString()} FCFA
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Date de l'événement</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={orderForm.event_date}
                      onChange={(e) => setOrderForm({ ...orderForm, event_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rental_days">Nombre de jours</Label>
                    <Input
                      id="rental_days"
                      type="number"
                      min="1"
                      value={orderForm.rental_days}
                      onChange={(e) => setOrderForm({ ...orderForm, rental_days: e.target.value })}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_location">Lieu</Label>
                    <Input
                      id="event_location"
                      placeholder="Ex: Abidjan"
                      value={orderForm.event_location}
                      onChange={(e) => setOrderForm({ ...orderForm, event_location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informations supplémentaires..."
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Total */}
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>
                      {(
                        selectedProduct.price_per_day *
                        (parseInt(orderForm.rental_days) || 1) *
                        (parseInt(orderForm.quantity) || 1)
                      ).toLocaleString()}{' '}
                      FCFA
                    </span>
                  </div>
                  {selectedProduct.deposit_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Caution</span>
                      <span>
                        {(
                          selectedProduct.deposit_amount * (parseInt(orderForm.quantity) || 1)
                        ).toLocaleString()}{' '}
                        FCFA
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">
                      {(
                        (selectedProduct.price_per_day *
                          (parseInt(orderForm.rental_days) || 1) +
                          (selectedProduct.deposit_amount || 0)) *
                        (parseInt(orderForm.quantity) || 1)
                      ).toLocaleString()}{' '}
                      FCFA
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Confirmer la réservation
                    </>
                  )}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClientCatalog;
