import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/products/ImageUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft, Package, Camera, DollarSign, MapPin, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductForm {
  name: string;
  description: string;
  price_per_day: string;
  deposit_amount: string;
  quantity_available: string;
  category_id: string;
  location: string;
  is_active: boolean;
  images: string[];
}

const initialFormState: ProductForm = {
  name: '',
  description: '',
  price_per_day: '',
  deposit_amount: '0',
  quantity_available: '1',
  category_id: '',
  location: '',
  is_active: true,
  images: [],
};

const ProviderProductNew = () => {
  const { user, loading: authLoading, isProvider } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProductForm>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isProvider()) {
      navigate('/');
      return;
    }

    if (user && isProvider()) {
      fetchCategories();
    }
  }, [user, authLoading, navigate]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('categories').select('*');
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.name.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Veuillez entrer le nom du produit.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.price_per_day || parseFloat(form.price_per_day) <= 0) {
      toast({
        title: 'Prix requis',
        description: 'Veuillez entrer un prix valide.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const productData = {
        provider_id: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_per_day: parseFloat(form.price_per_day),
        deposit_amount: parseFloat(form.deposit_amount) || 0,
        quantity_available: parseInt(form.quantity_available) || 1,
        category_id: form.category_id || null,
        location: form.location.trim() || null,
        is_active: form.is_active,
        images: form.images,
      };

      const { error } = await supabase.from('products').insert(productData);

      if (error) throw error;

      toast({
        title: '✅ Produit créé avec succès',
        description: 'Votre produit est maintenant visible dans le catalogue.',
        className: 'bg-emerald-50 border-emerald-200',
      });

      navigate('/provider/products');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/provider/products')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-secondary">Ajouter un produit</h1>
            <p className="text-muted-foreground">
              Renseignez les informations de votre équipement ou service
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-primary" />
                Photos du produit
              </CardTitle>
              <CardDescription>
                Ajoutez jusqu'à 5 photos de qualité pour attirer plus de clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && (
                <ImageUpload
                  userId={user.id}
                  images={form.images}
                  onImagesChange={(images) => setForm({ ...form, images })}
                  maxImages={5}
                />
              )}
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">
                  Nom du produit <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Tente de réception 10x20m"
                  className="h-12 text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Description détaillée
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez votre produit en détail : caractéristiques, état, conditions d'utilisation..."
                  rows={4}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-base font-medium">
                  Catégorie
                </Label>
                <Select
                  value={form.category_id}
                  onValueChange={(value) => setForm({ ...form, category_id: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
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

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                Tarification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-base font-medium">
                    Prix par jour (FCFA) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="100"
                    value={form.price_per_day}
                    onChange={(e) => setForm({ ...form, price_per_day: e.target.value })}
                    placeholder="25000"
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit" className="text-base font-medium">
                    Caution (FCFA)
                  </Label>
                  <Input
                    id="deposit"
                    type="number"
                    min="0"
                    step="100"
                    value={form.deposit_amount}
                    onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                    placeholder="50000"
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-base font-medium">
                  Quantité disponible
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={form.quantity_available}
                  onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
                  placeholder="1"
                  className="h-12 text-base w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Localisation et disponibilité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-medium">
                  Zone de service
                </Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Ex: Abidjan, Cocody"
                  className="h-12 text-base"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="is_active" className="text-base font-medium">
                    Produit actif
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Désactivez pour masquer temporairement ce produit du catalogue
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/provider/products')}
              className="h-12 px-8"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="h-12 px-8 flex-1 sm:flex-none gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Créer le produit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProviderProductNew;
