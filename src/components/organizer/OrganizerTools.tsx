import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Calculator,
  Package,
  Search,
  Loader2,
  Plus,
  FileText,
  Send,
  Trash2,
  ShoppingCart,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price_per_day: number;
  category_name: string | null;
  images: string[] | null;
}

interface Category {
  id: string;
  name: string;
}

export interface QuoteItem {
  id: string;
  category: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  rentalDays: number;
  persons: number;
  total: number;
}

interface Props {
  chatRoomId: string | null;
  onSendQuote: (quoteMessage: string) => Promise<void>;
}

export const OrganizerTools = ({ chatRoomId, onSendQuote }: Props) => {
  const { toast } = useToast();
  const [rightTab, setRightTab] = useState<'calcul' | 'catalogue' | 'devis'>('calcul');

  // Catalog state
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogCategory, setCatalogCategory] = useState('all');

  // Calculator state
  const [calcCategory, setCalcCategory] = useState('');
  const [calcProductName, setCalcProductName] = useState('');
  const [calcQuantity, setCalcQuantity] = useState(1);
  const [calcUnitPrice, setCalcUnitPrice] = useState(0);
  const [calcRentalDays, setCalcRentalDays] = useState(1);
  const [calcPersons, setCalcPersons] = useState(1);

  // Quote items state
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  const calculatedTotal = calcQuantity * calcUnitPrice * calcRentalDays * calcPersons;

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
    // Auto-load products
    fetchProducts();
  }, []);

  const fetchProducts = async (query?: string, catId?: string) => {
    setLoadingProducts(true);
    try {
      let q = supabase
        .from('products')
        .select(`id, name, price_per_day, images, categories:category_id(name)`)
        .eq('is_active', true)
        .limit(50);

      if (query && query.trim()) {
        q = q.ilike('name', `%${query}%`);
      }
      if (catId && catId !== 'all') {
        q = q.eq('category_id', catId);
      }

      const { data } = await q;
      setProducts(
        (data || []).map((p) => ({
          id: p.id,
          name: p.name,
          price_per_day: p.price_per_day,
          category_name: (p.categories as any)?.name || null,
          images: p.images,
        }))
      );
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSearchProducts = () => {
    fetchProducts(searchQuery, catalogCategory);
  };

  const handleCategoryChange = (catId: string) => {
    setCatalogCategory(catId);
    fetchProducts(searchQuery, catId);
  };

  const selectProductForCalc = (product: Product) => {
    setCalcProductName(product.name);
    setCalcUnitPrice(product.price_per_day);
    setCalcCategory(product.category_name || '');
    setRightTab('calcul');
    toast({
      title: 'Produit sélectionné',
      description: `${product.name} ajouté au calculateur`,
    });
  };

  const addToQuote = () => {
    if (!calcProductName || calculatedTotal === 0) return;

    const newItem: QuoteItem = {
      id: Date.now().toString(),
      category: calcCategory,
      productName: calcProductName,
      quantity: calcQuantity,
      unitPrice: calcUnitPrice,
      rentalDays: calcRentalDays,
      persons: calcPersons,
      total: calculatedTotal,
    };

    setQuoteItems((prev) => [...prev, newItem]);
    toast({
      title: 'Ajouté au devis',
      description: `${calcProductName} - ${calculatedTotal.toLocaleString()} FCFA`,
    });

    // Reset calculator
    setCalcProductName('');
    setCalcQuantity(1);
    setCalcUnitPrice(0);
    setCalcRentalDays(1);
    setCalcPersons(1);
    setCalcCategory('');
  };

  const removeFromQuote = (id: string) => {
    setQuoteItems((prev) => prev.filter((item) => item.id !== id));
  };

  const quoteSubtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
  const serviceFee = Math.round(quoteSubtotal * 0.05);
  const quoteGrandTotal = quoteSubtotal + serviceFee;

  const handleSendQuote = async () => {
    if (quoteItems.length === 0 || !chatRoomId) return;

    const itemLines = quoteItems
      .map(
        (item, i) =>
          `${i + 1}. ${item.productName}\n   📁 ${item.category || 'N/A'} | Qté: ${item.quantity} | ${item.unitPrice.toLocaleString()} FCFA/j × ${item.rentalDays}j${item.persons > 1 ? ` × ${item.persons} pers.` : ''}\n   → ${item.total.toLocaleString()} FCFA`
      )
      .join('\n\n');

    const quoteMessage = `📋 **DEVIS YAFOY**\n${'─'.repeat(30)}\n\n${itemLines}\n\n${'─'.repeat(30)}\n💰 Sous-total: ${quoteSubtotal.toLocaleString()} FCFA\n🏷️ Frais de service (5%): ${serviceFee.toLocaleString()} FCFA\n\n✅ **TOTAL: ${quoteGrandTotal.toLocaleString()} FCFA**`;

    await onSendQuote(quoteMessage);
    setQuoteItems([]);
    toast({
      title: 'Devis envoyé',
      description: `Devis de ${quoteGrandTotal.toLocaleString()} FCFA envoyé au client`,
    });
  };

  return (
    <Card className="lg:col-span-4 flex flex-col">
      <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as any)} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3 m-2 mr-4">
          <TabsTrigger value="calcul" className="text-sm">
            <Calculator className="h-4 w-4 mr-1" />
            Calcul
          </TabsTrigger>
          <TabsTrigger value="catalogue" className="text-sm">
            <Package className="h-4 w-4 mr-1" />
            Catalogue
          </TabsTrigger>
          <TabsTrigger value="devis" className="text-sm relative">
            <FileText className="h-4 w-4 mr-1" />
            Devis
            {quoteItems.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {quoteItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calcul" className="flex-1 p-4 pt-0 overflow-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Calculateur de Prix</h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Catégorie</Label>
                <Select value={calcCategory} onValueChange={setCalcCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Article</Label>
                <Input
                  value={calcProductName}
                  onChange={(e) => setCalcProductName(e.target.value)}
                  placeholder="Ex: Chaises en plastique"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Quantité</Label>
                  <Input
                    type="number"
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value)))}
                    min={1}
                  />
                </div>
                <div>
                  <Label className="text-sm">Prix unitaire (FCFA)</Label>
                  <Input
                    type="number"
                    value={calcUnitPrice}
                    onChange={(e) => setCalcUnitPrice(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Nombre de jours</Label>
                  <Input
                    type="number"
                    value={calcRentalDays}
                    onChange={(e) => setCalcRentalDays(Math.max(1, Number(e.target.value)))}
                    min={1}
                  />
                </div>
                <div>
                  <Label className="text-sm">Nb de personnes</Label>
                  <Input
                    type="number"
                    value={calcPersons}
                    onChange={(e) => setCalcPersons(Math.max(1, Number(e.target.value)))}
                    min={1}
                  />
                </div>
              </div>
            </div>

            {calculatedTotal > 0 && (
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total ligne:</span>
                  <span className="font-bold text-primary text-lg">
                    {calculatedTotal.toLocaleString()} FCFA
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {calcQuantity} × {calcUnitPrice.toLocaleString()} FCFA × {calcRentalDays}j{calcPersons > 1 ? ` × ${calcPersons} pers.` : ''}
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={addToQuote}
              disabled={!calcProductName || calculatedTotal === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter au devis
            </Button>

            {quoteItems.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setRightTab('devis')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Voir le devis ({quoteItems.length} article{quoteItems.length > 1 ? 's' : ''})
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalogue" className="flex-1 p-4 pt-0 overflow-auto">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchProducts()}
              />
              <Button onClick={handleSearchProducts} disabled={loadingProducts} size="icon">
                {loadingProducts ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <Select value={catalogCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
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

            <ScrollArea className="h-[calc(100vh-450px)]">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                      onClick={() => selectProductForCalc(product)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category_name}</p>
                        </div>
                        <p className="text-sm font-semibold text-primary whitespace-nowrap">
                          {product.price_per_day.toLocaleString()} F/j
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Quote Tab */}
        <TabsContent value="devis" className="flex-1 p-4 pt-0 overflow-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Devis en cours</h3>
            </div>

            {quoteItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun article dans le devis</p>
                <p className="text-xs mt-1">Utilisez le calculateur pour ajouter des articles</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setRightTab('calcul')}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Ouvrir le calculateur
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[calc(100vh-520px)]">
                  <div className="space-y-2">
                    {quoteItems.map((item, index) => (
                      <Card key={item.id} className="border">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{index + 1}. {item.productName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.category && `${item.category} · `}
                                {item.quantity} × {item.unitPrice.toLocaleString()} F × {item.rentalDays}j
                                {item.persons > 1 && ` × ${item.persons} pers.`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-primary whitespace-nowrap">
                                {item.total.toLocaleString()} F
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => removeFromQuote(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {/* Quote totals */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{quoteSubtotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Frais de service (5%)</span>
                    <span>{serviceFee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">{quoteGrandTotal.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSendQuote}
                  disabled={!chatRoomId}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le devis au client
                </Button>

                {!chatRoomId && (
                  <p className="text-xs text-destructive text-center">
                    Sélectionnez une conversation pour envoyer le devis
                  </p>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
