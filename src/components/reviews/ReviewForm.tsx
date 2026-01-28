import { useState } from 'react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

interface ReviewFormProps {
  orderId: string;
  providerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({ orderId, providerId, onSuccess, onCancel }: ReviewFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    quality_rating: 0,
    professionalism_rating: 0,
    value_rating: 0,
    comment: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast({
        title: 'Note requise',
        description: 'Veuillez attribuer au moins une note globale.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('reviews').insert({
        order_id: orderId,
        client_id: user.id,
        provider_id: providerId,
        rating: formData.rating,
        quality_rating: formData.quality_rating || null,
        professionalism_rating: formData.professionalism_rating || null,
        value_rating: formData.value_rating || null,
        comment: formData.comment || null,
      });

      if (error) throw error;

      toast({
        title: 'Avis envoyé',
        description: 'Merci pour votre retour !',
        className: 'bg-success text-success-foreground',
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer l\'avis.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Main rating */}
      <div className="space-y-2">
        <Label className="text-base">Note globale *</Label>
        <StarRating
          rating={formData.rating}
          size="lg"
          interactive
          onRatingChange={(rating) => setFormData({ ...formData, rating })}
        />
      </div>

      {/* Sub-ratings */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-sm">Qualité</Label>
          <StarRating
            rating={formData.quality_rating}
            size="md"
            interactive
            onRatingChange={(rating) => setFormData({ ...formData, quality_rating: rating })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Professionnalisme</Label>
          <StarRating
            rating={formData.professionalism_rating}
            size="md"
            interactive
            onRatingChange={(rating) => setFormData({ ...formData, professionalism_rating: rating })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Rapport qualité/prix</Label>
          <StarRating
            rating={formData.value_rating}
            size="md"
            interactive
            onRatingChange={(rating) => setFormData({ ...formData, value_rating: rating })}
          />
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment">Commentaire (optionnel)</Label>
        <Textarea
          id="comment"
          placeholder="Partagez votre expérience..."
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Envoyer l'avis
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
