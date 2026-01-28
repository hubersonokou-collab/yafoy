import { Link } from 'react-router-dom';
import { User, Star, MapPin, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/reviews/StarRating';

interface ProviderCardProps {
  provider: {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
    location?: string | null;
    is_verified?: boolean;
    averageRating?: number;
    reviewCount?: number;
    productCount?: number;
  };
  compact?: boolean;
}

export const ProviderCard = ({ provider, compact = false }: ProviderCardProps) => {
  if (compact) {
    return (
      <Link
        to={`/provider/${provider.id}`}
        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={provider.avatar_url || ''} />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">
              {provider.full_name || 'Prestataire'}
            </p>
            {provider.is_verified && (
              <Badge className="bg-gold text-gold-foreground shrink-0" variant="secondary">
                <Star className="h-3 w-3" />
              </Badge>
            )}
          </div>
          {provider.averageRating !== undefined && provider.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(provider.averageRating)} size="sm" />
              <span className="text-xs text-muted-foreground">
                ({provider.reviewCount || 0})
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={provider.avatar_url || ''} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">
                {provider.full_name || 'Prestataire'}
              </h3>
              {provider.is_verified && (
                <Badge className="bg-gold text-gold-foreground shrink-0">
                  <Star className="mr-1 h-3 w-3" />
                  Vérifié
                </Badge>
              )}
            </div>

            {provider.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {provider.location}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2">
              {provider.averageRating !== undefined && provider.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <StarRating rating={Math.round(provider.averageRating)} size="sm" />
                  <span className="text-sm text-muted-foreground">
                    ({provider.reviewCount || 0} avis)
                  </span>
                </div>
              )}
              {provider.productCount !== undefined && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span>{provider.productCount} produits</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Link to={`/provider/${provider.id}`}>
            <Button variant="outline" className="w-full">
              Voir le profil
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
