import { StarRating } from './StarRating';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, User } from 'lucide-react';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    quality_rating?: number | null;
    professionalism_rating?: number | null;
    value_rating?: number | null;
    comment?: string | null;
    provider_response?: string | null;
    created_at: string;
    client?: {
      full_name?: string | null;
      avatar_url?: string | null;
    };
  };
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.client?.avatar_url || ''} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium truncate">
                {review.client?.full_name || 'Client anonyme'}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDate(review.created_at)}
              </span>
            </div>
            <div className="mt-1">
              <StarRating rating={review.rating} size="sm" />
            </div>
            {review.comment && (
              <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
            )}

            {/* Sub-ratings */}
            {(review.quality_rating || review.professionalism_rating || review.value_rating) && (
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {review.quality_rating && (
                  <div className="flex items-center gap-1">
                    <span>Qualité:</span>
                    <StarRating rating={review.quality_rating} size="sm" />
                  </div>
                )}
                {review.professionalism_rating && (
                  <div className="flex items-center gap-1">
                    <span>Pro:</span>
                    <StarRating rating={review.professionalism_rating} size="sm" />
                  </div>
                )}
                {review.value_rating && (
                  <div className="flex items-center gap-1">
                    <span>Rapport qualité/prix:</span>
                    <StarRating rating={review.value_rating} size="sm" />
                  </div>
                )}
              </div>
            )}

            {/* Provider response */}
            {review.provider_response && (
              <div className="mt-3 rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <MessageCircle className="h-3 w-3" />
                  Réponse du prestataire
                </div>
                <p className="text-sm">{review.provider_response}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
