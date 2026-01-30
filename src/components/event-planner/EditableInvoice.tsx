import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProviderRating } from '@/components/reviews';
import { 
  Receipt, 
  Calendar, 
  Users, 
  MapPin,
  Wallet,
  Sparkles,
  Store,
  Trash2,
  Edit3,
  Package,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InvoiceProduct {
  id: string;
  name: string;
  price_per_day: number;
  category_name?: string;
  quantity: number;
  rental_days: number;
  provider_id: string;
  provider_name?: string;
}

interface EventData {
  eventType: string;
  eventName?: string;
  budgetMin: number;
  budgetMax: number;
  guestCount: number;
  eventDate?: string;
  eventLocation?: string;
}

interface EditableInvoiceProps {
  eventData: EventData;
  products: InvoiceProduct[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateRentalDays: (productId: string, days: number) => void;
  onRemoveProduct: (productId: string) => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  anniversaire: 'Anniversaire',
  fete_entreprise: "Fête d'entreprise",
  communion: 'Communion',
  fiancailles: 'Fiançailles',
  autre: 'Autre',
};

export const EditableInvoice = ({ 
  eventData, 
  products, 
  onUpdateQuantity, 
  onUpdateRentalDays, 
  onRemoveProduct 
}: EditableInvoiceProps) => {
  const subtotal = products.reduce((sum, p) => sum + (p.price_per_day * p.rental_days * p.quantity), 0);
  const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
  const total = subtotal + serviceFee;
  
  const today = new Date();
  const invoiceNumber = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Group products by provider
  const productsByProvider = products.reduce((acc, product) => {
    const providerId = product.provider_id;
    if (!acc[providerId]) {
      acc[providerId] = {
        products: [],
        providerName: product.provider_name || 'Prestataire',
        subtotal: 0,
      };
    }
    const lineTotal = product.price_per_day * product.rental_days * product.quantity;
    acc[providerId].products.push(product);
    acc[providerId].subtotal += lineTotal;
    return acc;
  }, {} as Record<string, { products: InvoiceProduct[]; providerName: string; subtotal: number }>);

  const providerCount = Object.keys(productsByProvider).length;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-6 w-6 text-primary" />
            Facture Pro Forma
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {invoiceNumber}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Vous pouvez modifier les quantités et jours de location. Cliquez sur la corbeille pour retirer un produit.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Date: {today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Event Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Événement</p>
              <p className="font-medium">{EVENT_TYPE_LABELS[eventData.eventType] || eventData.eventType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Invités</p>
              <p className="font-medium">{eventData.guestCount} personnes</p>
            </div>
          </div>
          {eventData.eventDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(eventData.eventDate).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          )}
          {eventData.eventLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Lieu</p>
                <p className="font-medium">{eventData.eventLocation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Edit3 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Cette facture est adaptée à votre budget. Modifiez les quantités ou retirez des produits selon vos besoins.
          </p>
        </div>

        {/* Products by Provider */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Store className="h-4 w-4" />
            Détail par prestataire ({providerCount})
          </h3>
          
          {Object.entries(productsByProvider).map(([providerId, providerData], providerIndex) => (
            <Card key={providerId} className="border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{providerData.providerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {providerData.products.length} produit(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="font-mono">
                      {providerData.subtotal.toLocaleString()} FCFA
                    </Badge>
                    <ProviderRating providerId={providerId} variant="badge" size="sm" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {providerData.products.map((product) => {
                    const lineTotal = product.price_per_day * product.rental_days * product.quantity;
                    return (
                      <div 
                        key={product.id} 
                        className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1 min-w-[150px]">
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.category_name && (
                            <p className="text-xs text-muted-foreground">{product.category_name}</p>
                          )}
                          <p className="text-xs text-primary">{product.price_per_day.toLocaleString()} FCFA/jour</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center gap-1">
                            <label className="text-xs text-muted-foreground">Qté</label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={product.quantity}
                              onChange={(e) => onUpdateQuantity(product.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-center text-sm"
                            />
                          </div>
                          
                          <div className="flex flex-col items-center gap-1">
                            <label className="text-xs text-muted-foreground">Jours</label>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              value={product.rental_days}
                              onChange={(e) => onUpdateRentalDays(product.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-center text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-sm min-w-[80px] text-right">
                            {lineTotal.toLocaleString()} FCFA
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onRemoveProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <p className="text-xs text-muted-foreground italic flex items-center gap-2">
            <Package className="h-4 w-4" />
            Une commande séparée sera envoyée à chaque prestataire
          </p>
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total ({products.length} produit(s))</span>
            <span>{subtotal.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de service (5%)</span>
            <span>{serviceFee.toLocaleString()} FCFA</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Total TTC
            </span>
            <span className="text-primary">{total.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Budget Check */}
        <div className={`p-3 rounded-lg ${total <= eventData.budgetMax ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
          <p className={`text-sm font-medium ${total <= eventData.budgetMax ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
            {total <= eventData.budgetMax 
              ? `✓ Dans votre budget (${eventData.budgetMax.toLocaleString()} FCFA)` 
              : `⚠ Dépasse votre budget de ${(total - eventData.budgetMax).toLocaleString()} FCFA - Retirez des produits ou réduisez les quantités`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
