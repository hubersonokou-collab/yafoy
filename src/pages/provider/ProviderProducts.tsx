import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/products/ImageUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Package, Edit, Trash2, Search } from 'lucide-react';
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

const ProviderProducts = () => {
  const { user, loading: authLoading, isProvider } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
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
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('provider_id', user.id)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate numeric inputs
    const pricePerDay = parseFloat(form.price_per_day);
    const depositAmount = parseFloat(form.deposit_amount) || 0;
    const quantityAvailable = parseInt(form.quantity_available) || 1;

    if (!form.price_per_day || isNaN(pricePerDay) || pricePerDay <= 0) {
      toast({
        title: 'Erreur de validation',
        description: 'Le prix par jour doit être supérieur à 0.',
        variant: 'destructive',
      });
      return;
    }

    if (pricePerDay > 100000000) {
      toast({
        title: 'Erreur de validation',
        description: 'Le prix par jour est trop élevé.',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(depositAmount) || depositAmount < 0) {
      toast({
        title: 'Erreur de validation',
        description: 'La caution ne peut pas être négative.',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(quantityAvailable) || quantityAvailable <= 0) {
      toast({
        title: 'Erreur de validation',
        description: 'La quantité doit être au moins 1.',
        variant: 'destructive',
      });
      return;
    }

    if (quantityAvailable > 100000) {
      toast({
        title: 'Erreur de validation',
        description: 'La quantité est trop élevée.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const productData = {
        provider_id: user.id,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price_per_day: pricePerDay,
        deposit_amount: depositAmount,
        quantity_available: quantityAvailable,
        category_id: form.category_id || null,
        location: form.location?.trim() || null,
        is_active: form.is_active,
        images: form.images,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: 'Produit mis à jour',
          description: 'Votre produit a été modifié avec succès.',
        });
      } else {
        const { error } = await supabase.from('products').insert(productData);

        if (error) throw error;

        toast({
          title: 'Produit créé',
          description: 'Votre produit a été ajouté avec succès.',
        });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      setForm(initialFormState);
      fetchData();
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

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price_per_day: product.price_per_day.toString(),
      deposit_amount: product.deposit_amount?.toString() || '0',
      quantity_available: product.quantity_available.toString(),
      category_id: product.category_id || '',
      location: product.location || '',
      is_active: product.is_active,
      images: product.images || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès.',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le produit.',
        variant: 'destructive',
      });
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Non catégorisé';
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold text-secondary">Mes produits</h1>
            <p className="text-muted-foreground">Gérez vos équipements et services</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingProduct(null);
              setForm(initialFormState);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix/jour (FCFA) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={form.price_per_day}
                      onChange={(e) => setForm({ ...form, price_per_day: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Caution (FCFA)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      min="0"
                      value={form.deposit_amount}
                      onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité disponible</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={form.quantity_available}
                      onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select
                      value={form.category_id}
                      onValueChange={(value) => setForm({ ...form, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ex: Abidjan, Cocody"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Produit actif</Label>
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                </div>

                {user && (
                  <div className="space-y-2">
                    <Label>Images du produit</Label>
                    <ImageUpload
                      userId={user.id}
                      images={form.images}
                      onImagesChange={(images) => setForm({ ...form, images })}
                      maxImages={5}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingProduct ? (
                    'Mettre à jour'
                  ) : (
                    'Créer le produit'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des produits ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix/Jour</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Package className="mx-auto mb-2 h-12 w-12" />
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.location && (
                              <p className="text-xs text-muted-foreground">{product.location}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryName(product.category_id)}</TableCell>
                      <TableCell>{Number(product.price_per_day).toLocaleString()} FCFA</TableCell>
                      <TableCell>{product.quantity_available}</TableCell>
                      <TableCell>
                        {product.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProviderProducts;
