import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
}

export const FavoriteButton = ({
  productId,
  size = 'md',
  className,
  onToggle,
}: FavoriteButtonProps) => {
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  useEffect(() => {
    checkFavoriteStatus();
  }, [productId]);

  const checkFavoriteStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!userId) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour ajouter des favoris.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);

        if (error) throw error;

        setIsFavorite(false);
        onToggle?.(false);
        toast({
          title: 'Retiré des favoris',
          description: 'Le produit a été retiré de vos favoris.',
        });
      } else {
        // Add to favorites
        const { error } = await supabase.from('favorites').insert({
          user_id: userId,
          product_id: productId,
        });

        if (error) throw error;

        setIsFavorite(true);
        onToggle?.(true);
        toast({
          title: 'Ajouté aux favoris',
          description: 'Le produit a été ajouté à vos favoris.',
          className: 'bg-success text-success-foreground',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier les favoris.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(
        'transition-all hover:scale-110',
        isFavorite && 'text-destructive hover:text-destructive',
        className
      )}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          'transition-all',
          isFavorite && 'fill-current'
        )}
      />
    </Button>
  );
};
