import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from './StarRating';
import { Badge } from '@/components/ui/badge';
import { Award, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderRatingProps {
  providerId: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'badge';
}

interface RatingStats {
  averageRating: number;
  reviewCount: number;
  isRecommended: boolean;
}

export const ProviderRating = ({ 
  providerId, 
  showCount = true, 
  size = 'md',
  variant = 'default' 
}: ProviderRatingProps) => {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatingStats();
  }, [providerId]);

  const fetchRatingStats = async () => {
    try {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', providerId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setStats({
          averageRating: avgRating,
          reviewCount: reviews.length,
          // Recommended if average >= 4 and at least 3 reviews
          isRecommended: avgRating >= 4 && reviews.length >= 3,
        });
      } else {
        setStats({
          averageRating: 0,
          reviewCount: 0,
          isRecommended: false,
        });
      }
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-5 w-20 animate-pulse bg-muted rounded" />;
  }

  if (!stats || stats.reviewCount === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">Aucun avis</span>
    );
  }

  if (variant === 'badge') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="gap-1">
          <Star className="h-3 w-3 fill-gold text-gold" />
          {stats.averageRating.toFixed(1)}
        </Badge>
        {showCount && (
          <span className="text-xs text-muted-foreground">
            ({stats.reviewCount} avis)
          </span>
        )}
        {stats.isRecommended && (
          <Badge className="bg-green-600 text-white gap-1">
            <Award className="h-3 w-3" />
            Recommandé
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-gold text-gold" />
        <span className="text-sm font-medium">{stats.averageRating.toFixed(1)}</span>
        {showCount && (
          <span className="text-xs text-muted-foreground">
            ({stats.reviewCount})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        <StarRating rating={Math.round(stats.averageRating)} size={size} showValue />
        {showCount && (
          <span className="text-sm text-muted-foreground">
            ({stats.reviewCount} avis)
          </span>
        )}
      </div>
      {stats.isRecommended && (
        <Badge className="bg-green-600 text-white gap-1 w-fit">
          <Award className="h-3 w-3" />
          Prestataire recommandé
        </Badge>
      )}
    </div>
  );
};
