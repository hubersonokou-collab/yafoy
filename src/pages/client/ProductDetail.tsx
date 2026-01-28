import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ImageGallery } from '@/components/products/ImageGallery';
import { ProviderCard } from '@/components/provider/ProviderCard';
import { ReviewList } from '@/components/reviews';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Star,
  MapPin,
  ShoppingCart,
  Calendar,
  ArrowLeft,
  Volume2,
  Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderForm, setOrderForm] = useState({
    event_date: '',
    event_location: '',
    rental_days: '1',
    quantity: '1',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (productError) throw productError;
      if (!productData) {
        navigate('/client/catalog');
        return;
      }

      setProduct(productData);

      // Fetch provider profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', productData.provider_id)
        .maybeSingle();

      if (profileData) {
        setProvider({
          id: productData.provider_id,
          ...profileData,
          is_verified: productData.is_verified,
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le produit.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;

    setSubmitting(true);

    try {
      const rentalDays = parseInt(orderForm.rental_days) || 1;
      const quantity = parseInt(orderForm.quantity) || 1;
      const subtotal = product.price_per_day * rentalDays * quantity;
      const depositAmount = (product.deposit_amount || 0) * quantity;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: user.id,
          provider_id: product.provider_id,
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

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        quantity,
        price_per_day: product.price_per_day,
        rental_days: rentalDays,
        subtotal,
      });

      if (itemError) throw itemError;

      toast({
        title: 'Commande créée',
        description: 'Votre demande de réservation a été envoyée au prestataire.',
        className: 'bg-success text-success-foreground',
      });

      setShowOrderDialog(false);
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

  const speakDescription = () => {
    if (!product?.description) return;
    const utterance = new SpeechSynthesisUtterance(product.description);
    utterance.lang = 'fr-FR';
    speechSynthesis.speak(utterance);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Produit non trouvé</p>
          <Link to="/client/catalog">
            <Button variant="link" className="mt-2">
              Retour au catalogue
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Image Gallery */}
          <div>
            <ImageGallery
              images={product.images || []}
              productName={product.name}
            />
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-secondary">
                    {product.name}
                  </h1>
                  {product.is_verified && (
                    <Badge className="bg-gold text-gold-foreground">
                      <Star className="mr-1 h-3 w-3" />
                      Vérifié
                    </Badge>
                  )}
                </div>
                {product.category && (
                  <p className="text-muted-foreground mt-1">
                    {product.category.name}
                  </p>
                )}
                {product.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {product.location}
                  </p>
                )}
              </div>
              <FavoriteButton productId={product.id} size="lg" />
            </div>

            {/* Price */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      {Number(product.price_per_day).toLocaleString()} FCFA
                    </p>
                    <p className="text-sm text-muted-foreground">par jour</p>
                  </div>
                  {product.deposit_amount > 0 && (
                    <div className="text-right">
                      <p className="text-lg font-medium">
                        {Number(product.deposit_amount).toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground">caution</p>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-success">
                    {product.quantity_available}
                  </span>{' '}
                  disponible(s)
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {product.description && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Description</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={speakDescription}
                      className="gap-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      Écouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Reserve button */}
            <Button
              size="lg"
              className="w-full text-lg"
              onClick={() =>
                user ? setShowOrderDialog(true) : navigate('/auth')
              }
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Réserver maintenant
            </Button>
          </div>
        </div>

        {/* Provider card */}
        {provider && (
          <Card>
            <CardHeader>
              <CardTitle>Prestataire</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderCard provider={provider} compact />
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Avis clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewList providerId={product.provider_id} limit={5} />
          </CardContent>
        </Card>
      </div>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réserver ce produit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOrder} className="space-y-4">
            <div className="rounded-lg border p-3">
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {Number(product.price_per_day).toLocaleString()} FCFA/jour
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Date de l'événement</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={orderForm.event_date}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, event_date: e.target.value })
                  }
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
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, rental_days: e.target.value })
                  }
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
                  max={product.quantity_available}
                  value={orderForm.quantity}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, quantity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_location">Lieu</Label>
                <Input
                  id="event_location"
                  placeholder="Ex: Abidjan"
                  value={orderForm.event_location}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, event_location: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Informations supplémentaires..."
                value={orderForm.notes}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, notes: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Total */}
            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between text-sm">
                <span>Sous-total</span>
                <span>
                  {(
                    product.price_per_day *
                    (parseInt(orderForm.rental_days) || 1) *
                    (parseInt(orderForm.quantity) || 1)
                  ).toLocaleString()}{' '}
                  FCFA
                </span>
              </div>
              {product.deposit_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Caution</span>
                  <span>
                    {(
                      product.deposit_amount * (parseInt(orderForm.quantity) || 1)
                    ).toLocaleString()}{' '}
                    FCFA
                  </span>
                </div>
              )}
              <div className="mt-2 flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-primary">
                  {(
                    (product.price_per_day *
                      (parseInt(orderForm.rental_days) || 1) +
                      (product.deposit_amount || 0)) *
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
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ProductDetail;
