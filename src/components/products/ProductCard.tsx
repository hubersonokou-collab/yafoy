import { Link } from 'react-router-dom';
import { Package, MapPin, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { StarRating } from '@/components/reviews/StarRating';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price_per_day: number;
    deposit_amount?: number | null;
    location?: string | null;
    images?: string[] | null;
    is_verified?: boolean;
    category?: {
      name: string;
    } | null;
    averageRating?: number;
    reviewCount?: number;
  };
  showFavoriteButton?: boolean;
  onReserve?: () => void;
}

// Helper function to get full image URL
const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Otherwise construct Supabase storage URL
  return `https://dvbgytmkysaztbdqosup.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
};

export const ProductCard = ({ product, showFavoriteButton = true, onReserve }: ProductCardProps) => {
  const mainImage = product.images && product.images.length > 0 ? getImageUrl(product.images[0]) : null;

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      {/* Image */}
      <Link to={`/client/product/${product.id}`}>
        <div className="relative aspect-video bg-muted">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Verified badge */}
          {product.is_verified && (
            <Badge className="absolute top-2 left-2 bg-gold text-gold-foreground">
              <Star className="mr-1 h-3 w-3" />
              Vérifié
            </Badge>
          )}

          {/* Favorite button */}
          {showFavoriteButton && (
            <div className="absolute top-2 right-2">
              <FavoriteButton productId={product.id} size="md" />
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/client/product/${product.id}`}>
          <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="text-xs text-muted-foreground mt-1">{product.category.name}</p>
        )}

        {product.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {product.location}
          </p>
        )}

        {/* Rating */}
        {product.averageRating !== undefined && product.averageRating > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={Math.round(product.averageRating)} size="sm" />
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount || 0} avis)
            </span>
          </div>
        )}

        {product.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary">
              {Number(product.price_per_day).toLocaleString()} FCFA
            </p>
            <p className="text-xs text-muted-foreground">par jour</p>
          </div>
          {onReserve && (
            <Button size="sm" onClick={onReserve}>
              Réserver
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
