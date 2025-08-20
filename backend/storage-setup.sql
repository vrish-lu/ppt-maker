-- =====================================================
-- SUPABASE STORAGE SETUP
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('presentation-images', 'presentation-images', true, 10485760, ARRAY['image/*']),
('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/*']),
('template-previews', 'template-previews', true, 5242880, ARRAY['image/*']),
('presentation-exports', 'presentation-exports', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']),
('user-uploads', 'user-uploads', false, 20971520, ARRAY['image/*', 'application/pdf']);

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Presentation Images Policies
CREATE POLICY "Users can upload presentation images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'presentation-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view presentation images" ON storage.objects
FOR SELECT USING (bucket_id = 'presentation-images');

CREATE POLICY "Users can update their presentation images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'presentation-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their presentation images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'presentation-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- User Avatars Policies
CREATE POLICY "Users can upload their avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update their avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Template Previews Policies
CREATE POLICY "Anyone can view template previews" ON storage.objects
FOR SELECT USING (bucket_id = 'template-previews');

CREATE POLICY "Admin can upload template previews" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'template-previews' AND
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

CREATE POLICY "Admin can update template previews" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'template-previews' AND
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

CREATE POLICY "Admin can delete template previews" ON storage.objects
FOR DELETE USING (
  bucket_id = 'template-previews' AND
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- Presentation Exports Policies
CREATE POLICY "Users can upload their exports" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'presentation-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their exports" ON storage.objects
FOR SELECT USING (
  bucket_id = 'presentation-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their exports" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'presentation-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their exports" ON storage.objects
FOR DELETE USING (
  bucket_id = 'presentation-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- User Uploads Policies
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- STORAGE FUNCTIONS
-- =====================================================

-- Function to get storage URL
CREATE OR REPLACE FUNCTION get_storage_url(bucket_name text, file_path text)
RETURNS text AS $$
BEGIN
  RETURN 'https://' || current_setting('request.headers')::json->>'host' || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique file path
CREATE OR REPLACE FUNCTION generate_file_path(bucket_name text, user_id uuid, file_extension text)
RETURNS text AS $$
BEGIN
  RETURN user_id::text || '/' || gen_random_uuid()::text || file_extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS void AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Clean up presentation images that don't have corresponding database records
  FOR file_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'presentation-images' 
    AND NOT EXISTS (
      SELECT 1 FROM presentation_images 
      WHERE storage_path = name
    )
  LOOP
    DELETE FROM storage.objects WHERE name = file_record.name AND bucket_id = 'presentation-images';
  END LOOP;
  
  -- Clean up user avatars that don't have corresponding user records
  FOR file_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'user-avatars' 
    AND NOT EXISTS (
      SELECT 1 FROM users 
      WHERE avatar_url LIKE '%' || name || '%'
    )
  LOOP
    DELETE FROM storage.objects WHERE name = file_record.name AND bucket_id = 'user-avatars';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STORAGE TRIGGERS
-- =====================================================

-- Trigger to automatically update user avatar URL when file is uploaded
CREATE OR REPLACE FUNCTION update_user_avatar_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bucket_id = 'user-avatars' THEN
    UPDATE users 
    SET avatar_url = get_storage_url('user-avatars', NEW.name)
    WHERE id::text = (storage.foldername(NEW.name))[1];
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_avatar_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'user-avatars')
  EXECUTE FUNCTION update_user_avatar_url();

-- =====================================================
-- STORAGE SETUP COMPLETE!
-- ===================================================== 