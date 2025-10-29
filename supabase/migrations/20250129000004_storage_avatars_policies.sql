-- Миграция для добавления RLS политик для bucket 'avatars'
-- Bucket должен быть создан вручную через Supabase Dashboard

-- Включаем RLS для storage.objects если еще не включен
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Создаем bucket 'avatars' если его еще нет (через INSERT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Публичный для чтения
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Удаляем существующие политики для avatars если есть
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;

-- Политика для чтения: все аутентифицированные могут просматривать аватары
-- Для публичного доступа можно использовать 'public', но для безопасности оставим 'authenticated'
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR
SELECT TO authenticated USING (bucket_id = 'avatars');

-- Политика для публичного чтения (если bucket публичный)
-- Раскомментируйте, если нужно разрешить чтение без аутентификации
-- CREATE POLICY "Public can view avatars"
--   ON storage.objects FOR SELECT
--   TO public
--   USING (bucket_id = 'avatars');

-- Политика для загрузки: аутентифицированные пользователи могут загружать в свою папку
-- Файл должен быть в папке с именем, равным user_id
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Политика для обновления: пользователи могут обновлять свои аватары
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Политика для удаления: пользователи могут удалять свои аватары
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );