import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  Calendar, 
  Users, 
  MapPin,
  Package,
  Wallet,
  Sparkles,
  Store
} from 'lucide-react';

interface SelectedProduct {
  id: string;
  name: string;
  price_per_day: number;
  category_name?: string;
  quantity?: number;
  rental_days?: number;
  provider_id?: string;
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

interface InvoiceDisplayProps {
  eventData: EventData;
  selectedProducts: SelectedProduct[];
  rentalDays?: number;
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

export const InvoiceDisplay = ({ eventData, selectedProducts, rentalDays = 1 }: InvoiceDisplayProps) => {
  const subtotal = selectedProducts.reduce((sum, p) => sum + (p.price_per_day * (p.rental_days || rentalDays) * (p.quantity || 1)), 0);
  const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
  const total = subtotal + serviceFee;
  
  const today = new Date();
  const invoiceNumber = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Group products by provider
  const productsByProvider = selectedProducts.reduce((acc, product) => {
    const providerId = product.provider_id || 'unknown';
    if (!acc[providerId]) {
      acc[providerId] = {
        products: [],
        providerName: product.provider_name || `Prestataire`,
        subtotal: 0,
      };
    }
    const lineTotal = product.price_per_day * (product.rental_days || rentalDays) * (product.quantity || 1);
    acc[providerId].products.push(product);
    acc[providerId].subtotal += lineTotal;
    return acc;
  }, {} as Record<string, { products: SelectedProduct[]; providerName: string; subtotal: number }>);

  const providerCount = Object.keys(productsByProvider).length;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-6 w-6 text-primary" />
            Facture Pro Forma
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {invoiceNumber}
          </Badge>
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

        {/* Products List */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits sélectionnés ({selectedProducts.length})
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium">Produit</th>
                  <th className="text-center py-2 px-3 font-medium">Jours</th>
                  <th className="text-center py-2 px-3 font-medium">Qté</th>
                  <th className="text-right py-2 px-3 font-medium">Prix/jour</th>
                  <th className="text-right py-2 px-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((product, index) => {
                  const days = product.rental_days || rentalDays;
                  const qty = product.quantity || 1;
                  const lineTotal = product.price_per_day * days * qty;
                  return (
                    <tr key={product.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="py-2 px-3">
                        <p className="font-medium">{product.name}</p>
                        {product.category_name && (
                          <p className="text-xs text-muted-foreground">{product.category_name}</p>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">{days}</td>
                      <td className="py-2 px-3 text-center">{qty}</td>
                      <td className="py-2 px-3 text-right">{product.price_per_day.toLocaleString()} FCFA</td>
                      <td className="py-2 px-3 text-right font-medium">{lineTotal.toLocaleString()} FCFA</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Provider Breakdown */}
        {providerCount > 1 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Store className="h-4 w-4" />
              Détail par prestataire ({providerCount})
            </h3>
            <div className="space-y-3">
              {Object.entries(productsByProvider).map(([providerId, providerData], index) => (
                <div 
                  key={providerId} 
                  className="border rounded-lg p-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{providerData.providerName} #{index + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {providerData.products.length} produit(s)
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {providerData.subtotal.toLocaleString()} FCFA
                    </Badge>
                  </div>
                  <div className="ml-10 text-xs text-muted-foreground">
                    {providerData.products.map(p => p.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">
              💡 Une commande sera créée pour chaque prestataire
            </p>
          </div>
        )}

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
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
              : `⚠ Dépasse votre budget de ${(total - eventData.budgetMax).toLocaleString()} FCFA`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
