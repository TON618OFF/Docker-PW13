-- SQL скрипт для создания bucket'ов в Supabase Storage
-- Выполните этот скрипт в SQL Editor в Supabase Dashboard

-- Создание bucket для аудио файлов
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'songs', 
  'songs', 
  false, 
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Создание bucket для обложек
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers', 
  'covers', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Настройка RLS политик для bucket 'songs'
CREATE POLICY "Authenticated users can upload songs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own songs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own songs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Настройка RLS политик для bucket 'covers' (публичный)
CREATE POLICY "Anyone can view covers" ON storage.objects FOR
SELECT TO authenticated USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can upload covers" ON storage.objects FOR
INSERT
    TO authenticated
WITH
    CHECK (bucket_id = 'covers');

CREATE POLICY "Users can delete own covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
