-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Providers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view product images (public bucket)
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow providers to update their own images
CREATE POLICY "Providers can update their product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow providers to delete their own images
CREATE POLICY "Providers can delete their product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);