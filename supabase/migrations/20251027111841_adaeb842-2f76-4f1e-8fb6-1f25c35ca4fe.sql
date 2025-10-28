-- =============================================
-- Музыкальный плеер: База данных PostgreSQL
-- =============================================

-- 1. ENUM типы
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'guest');
CREATE TYPE public.audio_format AS ENUM ('mp3', 'wav', 'flac', 'ogg', 'm4a');

-- 2. Таблица profiles (расширение auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ru')),
  page_size INTEGER DEFAULT 20 CHECK (page_size BETWEEN 10 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Таблица user_roles (М:М)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Таблица songs
CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  genre TEXT,
  duration INTEGER NOT NULL CHECK (duration > 0),
  file_path TEXT NOT NULL,
  file_hash TEXT UNIQUE,
  file_size BIGINT,
  cover_path TEXT,
  format public.audio_format,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  play_count INTEGER DEFAULT 0 CHECK (play_count >= 0),
  CONSTRAINT valid_file_path CHECK (file_path ~ '^[a-zA-Z0-9_\-/]+\.(mp3|wav|flac|ogg|m4a)$')
);

CREATE INDEX idx_songs_title ON public.songs(title);
CREATE INDEX idx_songs_artist ON public.songs(artist);
CREATE INDEX idx_songs_genre ON public.songs(genre);
CREATE INDEX idx_songs_uploaded_by ON public.songs(uploaded_by);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- 5. Таблица playlists
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlists_is_public ON public.playlists(is_public);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- 6. Таблица playlist_songs (М:М с порядком)
CREATE TABLE public.playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, song_id)
);

CREATE INDEX idx_playlist_songs_playlist ON public.playlist_songs(playlist_id);
CREATE INDEX idx_playlist_songs_song ON public.playlist_songs(song_id);

ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

-- 7. Таблица listen_history
CREATE TABLE public.listen_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  listened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_played INTEGER CHECK (duration_played >= 0),
  completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_listen_history_user ON public.listen_history(user_id);
CREATE INDEX idx_listen_history_song ON public.listen_history(song_id);
CREATE INDEX idx_listen_history_listened_at ON public.listen_history(listened_at DESC);

ALTER TABLE public.listen_history ENABLE ROW LEVEL SECURITY;

-- 8. Таблица audit_log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- =============================================

-- Функция: обновление updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Триггеры для updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Функция: автоматическое создание профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Функция: аудит для songs
CREATE OR REPLACE FUNCTION public.audit_songs_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'songs', OLD.id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', 'songs', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', 'songs', NEW.id, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER audit_songs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_songs_changes();

-- Функция: аудит для playlists
CREATE OR REPLACE FUNCTION public.audit_playlists_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'playlists', OLD.id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', 'playlists', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', 'playlists', NEW.id, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER audit_playlists_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_playlists_changes();

-- Функция: проверка прав на роль
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Функция: добавление песни в плейлист
CREATE OR REPLACE FUNCTION public.add_song_to_playlist(
  _user_id UUID,
  _playlist_id UUID,
  _song_id UUID,
  _position INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _playlist_owner UUID;
  _max_position INTEGER;
  _result JSONB;
BEGIN
  -- Проверка владельца плейлиста
  SELECT user_id INTO _playlist_owner
  FROM public.playlists
  WHERE id = _playlist_id;
  
  IF _playlist_owner IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Playlist not found');
  END IF;
  
  IF _playlist_owner != _user_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Access denied');
  END IF;
  
  -- Определение позиции
  IF _position IS NULL THEN
    SELECT COALESCE(MAX(position), -1) + 1 INTO _max_position
    FROM public.playlist_songs
    WHERE playlist_id = _playlist_id;
    _position := _max_position;
  END IF;
  
  -- Вставка
  INSERT INTO public.playlist_songs (playlist_id, song_id, position)
  VALUES (_playlist_id, _song_id, _position)
  ON CONFLICT (playlist_id, song_id) DO NOTHING;
  
  RETURN jsonb_build_object('success', TRUE, 'position', _position);
END;
$$;

-- Функция: статистика пользователя за месяц
CREATE OR REPLACE FUNCTION public.calculate_user_monthly_stats(
  _user_id UUID,
  _year INTEGER,
  _month INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_listens INTEGER;
  _total_duration INTEGER;
  _unique_songs INTEGER;
  _result JSONB;
BEGIN
  SELECT
    COUNT(*),
    COALESCE(SUM(duration_played), 0),
    COUNT(DISTINCT song_id)
  INTO _total_listens, _total_duration, _unique_songs
  FROM public.listen_history
  WHERE user_id = _user_id
    AND EXTRACT(YEAR FROM listened_at) = _year
    AND EXTRACT(MONTH FROM listened_at) = _month;
  
  _result := jsonb_build_object(
    'user_id', _user_id,
    'year', _year,
    'month', _month,
    'total_listens', _total_listens,
    'total_duration_seconds', _total_duration,
    'unique_songs', _unique_songs
  );
  
  RETURN _result;
END;
$$;

-- VIEW: статистика пользователя
CREATE OR REPLACE VIEW public.v_user_stats AS
SELECT
  p.id AS user_id,
  p.display_name,
  COUNT(DISTINCT s.id) AS total_songs_uploaded,
  COUNT(DISTINCT pl.id) AS total_playlists,
  COALESCE(SUM(lh.duration_played), 0) AS total_listening_time,
  COUNT(DISTINCT lh.song_id) AS unique_songs_listened
FROM public.profiles p
LEFT JOIN public.songs s ON s.uploaded_by = p.id
LEFT JOIN public.playlists pl ON pl.user_id = p.id
LEFT JOIN public.listen_history lh ON lh.user_id = p.id
GROUP BY p.id, p.display_name;

-- =============================================
-- RLS ПОЛИТИКИ
-- =============================================

-- Profiles: пользователи видят свой профиль
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles: только чтение своих ролей
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Songs: все видят, авторизованные добавляют
CREATE POLICY "Anyone can view songs"
  ON public.songs FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can insert songs"
  ON public.songs FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own songs"
  ON public.songs FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own songs"
  ON public.songs FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all songs"
  ON public.songs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Playlists: владелец + публичные
CREATE POLICY "Users can view own playlists"
  ON public.playlists FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view public playlists"
  ON public.playlists FOR SELECT
  TO authenticated
  USING (is_public = TRUE);

CREATE POLICY "Users can create playlists"
  ON public.playlists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own playlists"
  ON public.playlists FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own playlists"
  ON public.playlists FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Playlist songs: доступ через плейлист
CREATE POLICY "Users can view songs in accessible playlists"
  ON public.playlist_songs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE id = playlist_id
        AND (user_id = auth.uid() OR is_public = TRUE)
    )
  );

CREATE POLICY "Users can manage songs in own playlists"
  ON public.playlist_songs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );

-- Listen history: только свои записи
CREATE POLICY "Users can view own listen history"
  ON public.listen_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own listen history"
  ON public.listen_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Audit log: только чтение своих записей
CREATE POLICY "Users can view own audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('songs', 'songs', FALSE, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4']),
  ('covers', 'covers', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: songs bucket
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

-- Storage RLS: covers bucket (публичный)
CREATE POLICY "Anyone can view covers"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can upload covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Users can delete own covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);