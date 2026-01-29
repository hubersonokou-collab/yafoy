import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ExternalLink, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price_per_day: number;
  images: string[] | null;
  is_active: boolean;
  is_verified: boolean;
  category?: {
    name: string;
  } | null;
}

interface ProviderProductsListProps {
  products: Product[];
  loading?: boolean;
}

export const ProviderProductsList = ({ products, loading }: ProviderProductsListProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucun produit</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          {/* Product Image */}
          <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
            {product.images && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{product.name}</p>
              {product.is_verified && (
                <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {product.price_per_day.toLocaleString('fr-FR')} FCFA/jour
              </span>
              {product.category?.name && (
                <Badge variant="secondary" className="text-xs py-0 h-5">
                  {product.category.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Status & Action */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant={product.is_active ? 'default' : 'secondary'}
              className={product.is_active ? 'bg-green-100 text-green-800' : ''}
            >
              {product.is_active ? 'Actif' : 'Inactif'}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to={`/client/catalog/${product.id}`} target="_blank">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
