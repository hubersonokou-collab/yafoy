import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReviewCard } from './ReviewCard';
import { StarRating } from './StarRating';
import { Loader2, MessageSquare } from 'lucide-react';

interface ReviewListProps {
  providerId: string;
  limit?: number;
}

export const ReviewList = ({ providerId, limit }: ReviewListProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    count: 0,
  });

  useEffect(() => {
    fetchReviews();
  }, [providerId]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      const reviewsData = data || [];
      setReviews(reviewsData);

      // Calculate stats
      if (reviewsData.length > 0) {
        const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
        setStats({
          average: sum / reviewsData.length,
          count: reviewsData.length,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <MessageSquare className="mb-2 h-10 w-10" />
        <p>Aucun avis pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
        <div className="text-center">
          <p className="text-3xl font-bold text-primary">{stats.average.toFixed(1)}</p>
          <StarRating rating={Math.round(stats.average)} size="sm" />
        </div>
        <div className="text-sm text-muted-foreground">
          <p>{stats.count} avis</p>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};
