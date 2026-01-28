import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  productName?: string;
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

export const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const validImages = images
    .filter((img) => img && img.trim() !== '')
    .map((img) => getImageUrl(img))
    .filter((img): img is string => img !== null);

  if (validImages.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Aucune image disponible</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
        <img
          src={validImages[currentIndex]}
          alt={productName ? `${productName} - Image ${currentIndex + 1}` : `Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Zoom button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsZoomed(true)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        {/* Navigation arrows */}
        {validImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Dots indicator */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {validImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  index === currentIndex ? 'bg-primary w-4' : 'bg-white/70 hover:bg-white'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-all',
                index === currentIndex ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
              )}
            >
              <img
                src={image}
                alt={`Miniature ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative">
            <img
              src={validImages[currentIndex]}
              alt={productName || 'Image zoomée'}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setIsZoomed(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Navigation in zoom mode */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
