import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Image as ImageIcon, FolderOpen, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  userId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload = ({
  userId,
  images,
  onImagesChange,
  maxImages = 5,
}: ImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = useCallback(
    async (file: File) => {
      if (images.length >= maxImages) {
        toast({
          title: 'Limite atteinte',
          description: `Vous ne pouvez pas ajouter plus de ${maxImages} images.`,
          variant: 'destructive',
        });
        return null;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        toast({
          title: 'Format non supporté',
          description: 'Utilisez JPG, PNG, WEBP ou GIF.',
          variant: 'destructive',
        });
        return null;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'La taille maximale est de 5 Mo.',
          variant: 'destructive',
        });
        return null;
      }

      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Erreur d\'upload',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
    [userId, images.length, maxImages, toast]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map((file) => uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.filter((url): url is string => url !== null);

      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
        toast({
          title: 'Images ajoutées',
          description: `${newUrls.length} image(s) ajoutée(s) avec succès.`,
          className: 'bg-success text-success-foreground',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = async (urlToRemove: string) => {
    try {
      const path = urlToRemove.split('/product-images/')[1];
      if (path) {
        await supabase.storage.from('product-images').remove([path]);
      }
      onImagesChange(images.filter((url) => url !== urlToRemove));
      toast({
        title: 'Image supprimée',
        description: 'L\'image a été supprimée.',
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Open file picker programmatically
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload button - explicit and visible */}
      <Button
        type="button"
        variant="outline"
        onClick={openFilePicker}
        disabled={uploading || images.length >= maxImages}
        className="w-full h-14 gap-3 border-dashed border-2 hover:border-primary hover:bg-primary/5"
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement en cours...
          </>
        ) : (
          <>
            <FolderOpen className="h-5 w-5" />
            <span className="font-medium">Parcourir mes fichiers</span>
          </>
        )}
      </Button>

      {/* Images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group"
            >
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Supprimer l'image"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                  Principal
                </span>
              )}
            </div>
          ))}

          {/* Add more images button within grid */}
          {images.length < maxImages && images.length > 0 && (
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              className={cn(
                'aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:border-primary hover:bg-muted/50',
                uploading && 'pointer-events-none opacity-50'
              )}
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center px-2">
                    Ajouter
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Empty state with drop zone */}
      {images.length === 0 && (
        <div 
          onClick={openFilePicker}
          className={cn(
            'border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary hover:bg-muted/30',
            uploading && 'pointer-events-none opacity-50'
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-muted">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-secondary">Ajoutez des photos de votre produit</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cliquez pour parcourir vos fichiers
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, WEBP ou GIF • Max {maxImages} images • 5 Mo max
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image count indicator */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {images.length} / {maxImages} images
          </span>
          {images.length < maxImages && (
            <span className="text-primary cursor-pointer hover:underline" onClick={openFilePicker}>
              + Ajouter d'autres images
            </span>
          )}
        </div>
      )}
    </div>
  );
};
