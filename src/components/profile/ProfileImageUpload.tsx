import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, User, Upload, Trash2 } from 'lucide-react';

interface ProfileImageUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onUploadComplete: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
};

const iconSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function ProfileImageUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
  size = 'md',
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'L\'image ne doit pas dépasser 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Create a preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);

      toast({
        title: 'Photo mise à jour',
        description: 'Votre photo de profil a été mise à jour avec succès',
        className: 'bg-success text-success-foreground',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setPreviewUrl(currentAvatarUrl);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de télécharger l\'image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!previewUrl) return;

    setUploading(true);

    try {
      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (error) throw error;

      setPreviewUrl(null);
      onUploadComplete('');

      toast({
        title: 'Photo supprimée',
        description: 'Votre photo de profil a été supprimée',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} ring-2 ring-primary/20 transition-all group-hover:ring-primary/40`}>
          <AvatarImage src={previewUrl || ''} alt="Photo de profil" />
          <AvatarFallback className="bg-primary/10">
            <User className={iconSizes[size]} />
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {previewUrl ? 'Changer la photo' : 'Ajouter une photo'}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemovePhoto}
            disabled={uploading}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
