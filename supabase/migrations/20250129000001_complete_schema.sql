-- =================================================================================================
-- ПОЛНЫЙ SQL СКРИПТ ДЛЯ БАЗЫ ДАННЫХ IMPERIAL TUNES (SUPABASE)
-- Версия: 5.0 (Полная очистка и создание)
-- =================================================================================================
-- Этот скрипт сначала удаляет все существующие объекты, затем создаёт полную схему базы данных
-- =================================================================================================

-- =================================================================================================
-- ЧАСТЬ 1: УДАЛЕНИЕ ВСЕХ СУЩЕСТВУЮЩИХ ОБЪЕКТОВ
-- =================================================================================================

-- Удаляем все триггеры
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users CASCADE;

DROP TRIGGER IF EXISTS update_artists_updated_at ON public.artists CASCADE;

DROP TRIGGER IF EXISTS update_albums_updated_at ON public.albums CASCADE;

DROP TRIGGER IF EXISTS update_tracks_updated_at ON public.tracks CASCADE;

DROP TRIGGER IF EXISTS update_playlists_updated_at ON public.playlists CASCADE;

DROP TRIGGER IF EXISTS audit_tracks_trigger ON public.tracks CASCADE;

DROP TRIGGER IF EXISTS audit_playlists_trigger ON public.playlists CASCADE;

DROP TRIGGER IF EXISTS listening_history_trigger ON public.listening_history CASCADE;

-- Удаляем все таблицы в правильном порядке (с учётом зависимостей)
DROP TABLE IF EXISTS public.favorites_tracks CASCADE;

DROP TABLE IF EXISTS public.favorites_albums CASCADE;

DROP TABLE IF EXISTS public.favorites_playlists CASCADE;

DROP TABLE IF EXISTS public.artist_applications CASCADE;

DROP TABLE IF EXISTS public.audit_log CASCADE;

DROP TABLE IF EXISTS public.listening_history CASCADE;

DROP TABLE IF EXISTS public.playlist_tracks CASCADE;

DROP TABLE IF EXISTS public.track_genres CASCADE;

DROP TABLE IF EXISTS public.playlists CASCADE;

DROP TABLE IF EXISTS public.tracks CASCADE;

DROP TABLE IF EXISTS public.albums CASCADE;

DROP TABLE IF EXISTS public.artists CASCADE;

DROP TABLE IF EXISTS public.genres CASCADE;

DROP TABLE IF EXISTS public.users CASCADE;

DROP TABLE IF EXISTS public.roles CASCADE;

-- Удаляем представления
DROP VIEW IF EXISTS public.track_statistics CASCADE;

DROP VIEW IF EXISTS public.user_statistics CASCADE;

DROP VIEW IF EXISTS public.playlist_duration CASCADE;

DROP VIEW IF EXISTS public.album_duration CASCADE;

-- Удаляем функции
DROP FUNCTION IF EXISTS public.toggle_favorite_track (UUID) CASCADE;

DROP FUNCTION IF EXISTS public.toggle_favorite_album (UUID) CASCADE;

DROP FUNCTION IF EXISTS public.toggle_favorite_playlist (UUID) CASCADE;

DROP FUNCTION IF EXISTS public.add_track_to_playlist (UUID, UUID, INTEGER) CASCADE;

DROP FUNCTION IF EXISTS public.ensure_user_exists () CASCADE;

DROP FUNCTION IF EXISTS public.log_listening () CASCADE;

DROP FUNCTION IF EXISTS public.audit_changes () CASCADE;

DROP FUNCTION IF EXISTS public.update_updated_at_column () CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user () CASCADE;

DROP FUNCTION IF EXISTS public.approve_artist_application (UUID) CASCADE;

DROP FUNCTION IF EXISTS public.reject_artist_application (UUID, TEXT) CASCADE;

-- Удаляем типы
DROP TYPE IF EXISTS public.audio_format CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;

-- =================================================================================================
-- ЧАСТЬ 2: СОЗДАНИЕ СХЕМЫ БАЗЫ ДАННЫХ
-- =================================================================================================

-- Включение расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================================================================================================
-- 1. СОЗДАНИЕ ENUM ТИПОВ
-- =================================================================================================

CREATE TYPE public.app_role AS ENUM ('слушатель', 'администратор', 'артист', 'дистрибьютор', 'модератор');

CREATE TYPE public.audio_format AS ENUM ('mp3', 'wav', 'flac', 'ogg', 'm4a');

-- =================================================================================================
-- 2. СОЗДАНИЕ ТАБЛИЦ
-- =================================================================================================

-- Таблица ролей
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        role_name IN (
            'слушатель',
            'дистрибьютор',
            'администратор',
            'артист',
            'модератор'
        )
    )
);

-- Таблица пользователей (расширение auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role_id UUID REFERENCES public.roles (id) ON DELETE RESTRICT,
    avatar_url TEXT,
    bio TEXT,
    language VARCHAR(10) NOT NULL DEFAULT 'ru',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login TIMESTAMPTZ,
    CHECK (
        LENGTH(username) >= 3
        AND LENGTH(username) <= 50
    ),
    CHECK (language IN ('ru', 'en'))
);

-- Таблица артистов
CREATE TABLE public.artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    artist_name VARCHAR(100) NOT NULL UNIQUE,
    artist_bio TEXT,
    artist_image_url TEXT,
    genre VARCHAR(50),
    user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        LENGTH(artist_name) >= 2
        AND LENGTH(artist_name) <= 100
    )
);

-- Таблица жанров
CREATE TABLE public.genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    genre_name VARCHAR(50) NOT NULL UNIQUE,
    genre_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        LENGTH(genre_name) >= 2
        AND LENGTH(genre_name) <= 50
    )
);

-- Таблица альбомов
CREATE TABLE public.albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    album_title VARCHAR(100) NOT NULL,
    album_release_date DATE NOT NULL,
    artist_id UUID REFERENCES public.artists (id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
    album_cover_url TEXT,
    album_description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        LENGTH(album_title) >= 2
        AND LENGTH(album_title) <= 100
    ),
    CHECK (
        album_release_date >= '1900-01-01'
        AND album_release_date <= CURRENT_DATE + INTERVAL '1 year'
    )
);

-- Таблица треков
CREATE TABLE public.tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    track_title VARCHAR(100) NOT NULL,
    track_duration INTEGER NOT NULL,
    album_id UUID REFERENCES public.albums (id) ON DELETE CASCADE,
    track_audio_url TEXT NOT NULL,
    track_order INTEGER NOT NULL DEFAULT 1,
    track_play_count INTEGER NOT NULL DEFAULT 0,
    track_like_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        track_duration > 0
        AND track_duration <= 7200
    ),
    CHECK (track_play_count >= 0),
    CHECK (track_like_count >= 0),
    CHECK (track_order > 0),
    CHECK (
        LENGTH(track_title) >= 1
        AND LENGTH(track_title) <= 100
    )
);

-- Таблица плейлистов
CREATE TABLE public.playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    playlist_title VARCHAR(100) NOT NULL,
    playlist_description TEXT,
    user_id UUID REFERENCES public.users (id) ON DELETE CASCADE,
    playlist_cover_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    follow_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        LENGTH(playlist_title) >= 2
        AND LENGTH(playlist_title) <= 100
    ),
    CHECK (follow_count >= 0)
);

-- Таблица связей трек-жанр
CREATE TABLE public.track_genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    track_id UUID REFERENCES public.tracks (id) ON DELETE CASCADE,
    genre_id UUID REFERENCES public.genres (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (track_id, genre_id)
);

-- Таблица связей плейлист-трек
CREATE TABLE public.playlist_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    playlist_id UUID REFERENCES public.playlists (id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks (id) ON DELETE CASCADE,
    order_position INTEGER NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (order_position > 0),
    UNIQUE (playlist_id, track_id)
);

-- Таблица истории прослушиваний
CREATE TABLE public.listening_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks (id) ON DELETE CASCADE,
    listened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_played INTEGER CHECK (duration_played >= 0),
    completed BOOLEAN DEFAULT FALSE
);

-- Таблица аудита
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        action_type IN (
            'INSERT',
            'UPDATE',
            'DELETE',
            'SELECT',
            'LOGIN',
            'LOGOUT'
        )
    ),
    CHECK (
        table_name IN (
            'users',
            'artists',
            'albums',
            'tracks',
            'playlists',
            'track_genres',
            'playlist_tracks',
            'listening_history',
            'genres',
            'artist_applications'
        )
    )
);

-- Таблица избранных треков
CREATE TABLE public.favorites_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE CASCADE NOT NULL,
    track_id UUID REFERENCES public.tracks (id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, track_id)
);

-- Таблица избранных альбомов
CREATE TABLE public.favorites_albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE CASCADE NOT NULL,
    album_id UUID REFERENCES public.albums (id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, album_id)
);

-- Таблица избранных плейлистов
CREATE TABLE public.favorites_playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE CASCADE NOT NULL,
    playlist_id UUID REFERENCES public.playlists (id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, playlist_id)
);

-- Таблица анкет для становления артистом
CREATE TABLE public.artist_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE CASCADE NOT NULL,
    artist_name VARCHAR(100) NOT NULL,
    artist_bio TEXT,
    artist_image_url TEXT,
    genre VARCHAR(50),
    portfolio_url TEXT,
    social_media_urls JSONB,
    motivation TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
    review_comment TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        LENGTH(artist_name) >= 2
        AND LENGTH(artist_name) <= 100
    ),
    CHECK (
        status IN (
            'pending',
            'approved',
            'rejected'
        )
    )
);

-- =================================================================================================
-- 3. СОЗДАНИЕ ИНДЕКСОВ
-- =================================================================================================

CREATE INDEX idx_users_username ON public.users (username);

CREATE INDEX idx_users_role ON public.users (role_id);

CREATE INDEX idx_users_last_login ON public.users (last_login);

CREATE INDEX idx_users_created_at ON public.users (created_at);

CREATE INDEX idx_tracks_album ON public.tracks (album_id);

CREATE INDEX idx_tracks_play_count ON public.tracks (track_play_count DESC);

CREATE INDEX idx_tracks_like_count ON public.tracks (track_like_count DESC);

CREATE INDEX idx_tracks_created_at ON public.tracks (created_at);

CREATE INDEX idx_tracks_is_public ON public.tracks (is_public);

CREATE INDEX idx_tracks_uploaded_by ON public.tracks (uploaded_by);

CREATE INDEX idx_albums_created_by ON public.albums (created_by);

CREATE INDEX idx_albums_artist ON public.albums (artist_id);

CREATE INDEX idx_artists_user ON public.artists (user_id);

CREATE INDEX idx_playlists_user ON public.playlists (user_id);

CREATE INDEX idx_playlists_is_public ON public.playlists (is_public);

CREATE INDEX idx_playlists_follow_count ON public.playlists (follow_count DESC);

CREATE INDEX idx_playlists_created_at ON public.playlists (created_at);

CREATE INDEX idx_listening_user ON public.listening_history (user_id);

CREATE INDEX idx_listening_track ON public.listening_history (track_id);

CREATE INDEX idx_listening_date ON public.listening_history (listened_at);

CREATE INDEX idx_listening_user_date ON public.listening_history (user_id, listened_at);

CREATE INDEX idx_audit_user ON public.audit_log (user_id);

CREATE INDEX idx_audit_table ON public.audit_log (table_name);

CREATE INDEX idx_audit_timestamp ON public.audit_log (timestamp);

CREATE INDEX idx_audit_action ON public.audit_log (action_type);

CREATE INDEX idx_favorites_tracks_user ON public.favorites_tracks (user_id);

CREATE INDEX idx_favorites_tracks_track ON public.favorites_tracks (track_id);

CREATE INDEX idx_favorites_albums_user ON public.favorites_albums (user_id);

CREATE INDEX idx_favorites_albums_album ON public.favorites_albums (album_id);

CREATE INDEX idx_favorites_playlists_user ON public.favorites_playlists (user_id);

CREATE INDEX idx_favorites_playlists_playlist ON public.favorites_playlists (playlist_id);

CREATE INDEX idx_artist_applications_user ON public.artist_applications (user_id);

CREATE INDEX idx_artist_applications_status ON public.artist_applications (status);

CREATE INDEX idx_artist_applications_reviewed_by ON public.artist_applications (reviewed_by);

-- =================================================================================================
-- 4. СОЗДАНИЕ ПРЕДСТАВЛЕНИЙ
-- =================================================================================================

CREATE VIEW public.album_duration AS
SELECT
    a.id,
    a.album_title,
    a.artist_id,
    ar.artist_name,
    a.album_release_date,
    COALESCE(SUM(t.track_duration), 0) AS total_duration_seconds,
    COUNT(t.id) AS track_count,
    a.created_at,
    a.updated_at
FROM public.albums a
    LEFT JOIN public.tracks t ON a.id = t.album_id
    LEFT JOIN public.artists ar ON a.artist_id = ar.id
WHERE
    a.is_active = TRUE
GROUP BY
    a.id,
    a.album_title,
    a.artist_id,
    ar.artist_name,
    a.album_release_date,
    a.created_at,
    a.updated_at;

CREATE VIEW public.playlist_duration AS
SELECT
    p.id,
    p.playlist_title,
    p.user_id,
    u.username,
    p.is_public,
    p.follow_count,
    COALESCE(SUM(t.track_duration), 0) AS total_duration_seconds,
    COUNT(pt.track_id) AS track_count,
    p.created_at,
    p.updated_at
FROM public.playlists p
    LEFT JOIN public.playlist_tracks pt ON p.id = pt.playlist_id
    LEFT JOIN public.tracks t ON pt.track_id = t.id
    LEFT JOIN public.users u ON p.user_id = u.id
WHERE
    p.is_active = TRUE
GROUP BY
    p.id,
    p.playlist_title,
    p.user_id,
    u.username,
    p.is_public,
    p.follow_count,
    p.created_at,
    p.updated_at;

CREATE VIEW public.user_statistics AS
SELECT
    u.id,
    u.username,
    au.email,
    r.role_name,
    u.created_at,
    u.last_login,
    COUNT(DISTINCT p.id) AS playlist_count,
    COUNT(DISTINCT lh.id) AS total_listens,
    COUNT(DISTINCT lh.track_id) AS unique_tracks_listened
FROM
    public.users u
    LEFT JOIN auth.users au ON u.id = au.id
    LEFT JOIN public.roles r ON u.role_id = r.id
    LEFT JOIN public.playlists p ON u.id = p.user_id
    LEFT JOIN public.listening_history lh ON u.id = lh.user_id
GROUP BY
    u.id,
    u.username,
    au.email,
    r.role_name,
    u.created_at,
    u.last_login;

CREATE VIEW public.track_statistics AS
SELECT
    t.id,
    t.track_title,
    t.track_duration,
    t.track_play_count,
    t.track_like_count,
    a.album_title,
    ar.artist_name,
    t.created_at,
    t.is_public,
    CASE
        WHEN t.track_play_count > 10000 THEN 'Популярный'
        WHEN t.track_play_count > 1000 THEN 'Популярный'
        WHEN t.track_play_count > 100 THEN 'Средний'
        ELSE 'Новый'
    END AS popularity_level
FROM public.tracks t
    LEFT JOIN public.albums a ON t.album_id = a.id
    LEFT JOIN public.artists ar ON a.artist_id = ar.id;

-- =================================================================================================
-- 5. СОЗДАНИЕ ФУНКЦИЙ
-- =================================================================================================

-- Функция для автоматического создания пользователя при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id UUID;
  user_username TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
BEGIN
  -- Получаем ID роли "слушатель"
  SELECT id INTO default_role_id FROM public.roles WHERE role_name = 'слушатель' LIMIT 1;
  
  -- Если роль не найдена, создаем её
  IF default_role_id IS NULL THEN
    INSERT INTO public.roles (role_name, role_description) 
    VALUES ('слушатель', 'Обычный пользователь, может слушать музыку и создавать плейлисты')
    RETURNING id INTO default_role_id;
  END IF;

  -- Извлекаем метаданные
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user_' || substr(NEW.id::text, 1, 8)
  );
  
  -- Проверяем уникальность username
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = user_username) LOOP
    user_username := 'user_' || substr(NEW.id::text, 1, 8) || '_' || floor(random() * 10000)::text;
  END LOOP;

  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

  -- Создаем запись пользователя
  INSERT INTO public.users (id, username, first_name, last_name, role_id)
  VALUES (
    NEW.id, 
    user_username,
    NULLIF(user_first_name, ''),
    NULLIF(user_last_name, ''),
    default_role_id
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- В случае ошибки логируем и продолжаем
    RAISE WARNING 'Ошибка создания пользователя: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Функция для автоматического обновления updated_at
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

-- Функция для аудита изменений
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action_type, table_name, record_id, new_value)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action_type, table_name, record_id, old_value, new_value)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action_type, table_name, record_id, old_value)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
END;
$$;

-- Функция для логирования прослушиваний
CREATE OR REPLACE FUNCTION public.log_listening()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tracks 
  SET track_play_count = track_play_count + 1,
      updated_at = now()
  WHERE id = NEW.track_id;
  RETURN NEW;
END;
$$;

-- Функция для проверки существования пользователя
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  auth_user_record RECORD;
  default_role_id UUID;
  user_exists BOOLEAN;
  final_username TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
  END IF;
  
  -- Проверяем, существует ли пользователь
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = current_user_id) INTO user_exists;
  
  IF user_exists THEN
    RETURN jsonb_build_object('success', TRUE, 'message', 'User already exists');
  END IF;
  
  -- Получаем данные из auth.users
  SELECT 
    id,
    email,
    raw_user_meta_data
  INTO auth_user_record
  FROM auth.users
  WHERE id = current_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Auth user not found');
  END IF;
  
  -- Получаем ID роли "слушатель"
  SELECT id INTO default_role_id FROM public.roles WHERE role_name = 'слушатель' LIMIT 1;
  
  IF default_role_id IS NULL THEN
    INSERT INTO public.roles (role_name, role_description) 
    VALUES ('слушатель', 'Обычный пользователь, может слушать музыку и создавать плейлисты')
    RETURNING id INTO default_role_id;
  END IF;

  -- Генерируем username
  final_username := COALESCE(
    auth_user_record.raw_user_meta_data->>'username',
    split_part(auth_user_record.email, '@', 1),
    'user_' || substr(current_user_id::text, 1, 8)
  );
  
  -- Проверяем уникальность
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    final_username := 'user_' || substr(current_user_id::text, 1, 8) || '_' || floor(random() * 10000)::text;
  END LOOP;

  -- Создаём пользователя
  INSERT INTO public.users (id, username, first_name, last_name, role_id)
  VALUES (
    current_user_id,
    final_username,
    NULLIF(COALESCE(auth_user_record.raw_user_meta_data->>'first_name', ''), ''),
    NULLIF(COALESCE(auth_user_record.raw_user_meta_data->>'last_name', ''), ''),
    default_role_id
  );
  
  RETURN jsonb_build_object('success', TRUE, 'message', 'User created successfully', 'username', final_username);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- Функция для явного создания пользователя (для использования из клиента)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_username TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id UUID;
  final_username TEXT;
BEGIN
  -- Получаем ID роли "слушатель"
  SELECT id INTO default_role_id FROM public.roles WHERE role_name = 'слушатель' LIMIT 1;
  
  IF default_role_id IS NULL THEN
    INSERT INTO public.roles (role_name, role_description) 
    VALUES ('слушатель', 'Обычный пользователь, может слушать музыку и создавать плейлисты')
    RETURNING id INTO default_role_id;
  END IF;

  -- Проверяем и генерируем уникальный username
  final_username := COALESCE(p_username, 'user_' || substr(p_user_id::text, 1, 8));
  
  -- Если username занят, добавляем суффикс
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username AND id != p_user_id) LOOP
    final_username := 'user_' || substr(p_user_id::text, 1, 8) || '_' || floor(random() * 10000)::text;
  END LOOP;

  -- Создаём или обновляем пользователя
  INSERT INTO public.users (id, username, first_name, last_name, role_id)
  VALUES (
    p_user_id,
    final_username,
    NULLIF(p_first_name, ''),
    NULLIF(p_last_name, ''),
    default_role_id
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name);
  
  RETURN jsonb_build_object('success', TRUE, 'username', final_username);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- Функция для добавления трека в избранное
CREATE OR REPLACE FUNCTION public.toggle_favorite_track(p_track_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    exists_check BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM public.favorites_tracks 
        WHERE user_id = current_user_id AND track_id = p_track_id
    ) INTO exists_check;
    
    IF exists_check THEN
        DELETE FROM public.favorites_tracks 
        WHERE user_id = current_user_id AND track_id = p_track_id;
        RETURN jsonb_build_object('success', TRUE, 'action', 'removed');
    ELSE
        INSERT INTO public.favorites_tracks (user_id, track_id)
        VALUES (current_user_id, p_track_id);
        RETURN jsonb_build_object('success', TRUE, 'action', 'added');
    END IF;
END;
$$;

-- Функция для добавления альбома в избранное
CREATE OR REPLACE FUNCTION public.toggle_favorite_album(p_album_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    exists_check BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM public.favorites_albums 
        WHERE user_id = current_user_id AND album_id = p_album_id
    ) INTO exists_check;
    
    IF exists_check THEN
        DELETE FROM public.favorites_albums 
        WHERE user_id = current_user_id AND album_id = p_album_id;
        RETURN jsonb_build_object('success', TRUE, 'action', 'removed');
    ELSE
        INSERT INTO public.favorites_albums (user_id, album_id)
        VALUES (current_user_id, p_album_id);
        RETURN jsonb_build_object('success', TRUE, 'action', 'added');
    END IF;
END;
$$;

-- Функция для обновления роли пользователя при одобрении анкеты и создания артиста
CREATE OR REPLACE FUNCTION public.approve_artist_application(p_application_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    application_record RECORD;
    artist_role_id UUID;
    is_distributor BOOLEAN;
    new_artist_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    -- Проверяем, является ли пользователь дистрибьютором
    SELECT EXISTS(
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = current_user_id AND r.role_name = 'дистрибьютор'
    ) INTO is_distributor;
    
    IF NOT is_distributor THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Only distributors can approve applications');
    END IF;
    
    -- Получаем анкету
    SELECT * INTO application_record
    FROM public.artist_applications
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Application not found');
    END IF;
    
    IF application_record.status != 'pending' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Application already reviewed');
    END IF;
    
    -- Проверяем, не существует ли уже артист с таким именем
    IF EXISTS (SELECT 1 FROM public.artists WHERE artist_name = application_record.artist_name) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Artist with this name already exists');
    END IF;
    
    -- Получаем ID роли артиста
    SELECT id INTO artist_role_id
    FROM public.roles
    WHERE role_name = 'артист'
    LIMIT 1;
    
    IF artist_role_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Artist role not found');
    END IF;
    
    -- Создаём артиста из данных анкеты и связываем с пользователем
    INSERT INTO public.artists (
        artist_name,
        artist_bio,
        artist_image_url,
        genre,
        user_id
    ) VALUES (
        application_record.artist_name,
        application_record.artist_bio,
        application_record.artist_image_url,
        application_record.genre,
        application_record.user_id
    ) RETURNING id INTO new_artist_id;
    
    -- Обновляем роль пользователя
    UPDATE public.users
    SET role_id = artist_role_id
    WHERE id = application_record.user_id;
    
    -- Обновляем статус анкеты
    UPDATE public.artist_applications
    SET 
        status = 'approved',
        reviewed_by = current_user_id,
        reviewed_at = now()
    WHERE id = p_application_id;
    
    RETURN jsonb_build_object('success', TRUE, 'message', 'Application approved', 'artist_id', new_artist_id);
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Artist with this name already exists');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- Функция для отклонения анкеты
CREATE OR REPLACE FUNCTION public.reject_artist_application(p_application_id UUID, p_comment TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    application_record RECORD;
    is_distributor BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    -- Проверяем, является ли пользователь дистрибьютором
    SELECT EXISTS(
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = current_user_id AND r.role_name = 'дистрибьютор'
    ) INTO is_distributor;
    
    IF NOT is_distributor THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Only distributors can reject applications');
    END IF;
    
    -- Получаем анкету
    SELECT * INTO application_record
    FROM public.artist_applications
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Application not found');
    END IF;
    
    IF application_record.status != 'pending' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Application already reviewed');
    END IF;
    
    -- Обновляем статус анкеты
    UPDATE public.artist_applications
    SET 
        status = 'rejected',
        reviewed_by = current_user_id,
        review_comment = p_comment,
        reviewed_at = now()
    WHERE id = p_application_id;
    
    RETURN jsonb_build_object('success', TRUE, 'message', 'Application rejected');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- Функция для добавления плейлиста в избранное
CREATE OR REPLACE FUNCTION public.toggle_favorite_playlist(p_playlist_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    exists_check BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM public.favorites_playlists 
        WHERE user_id = current_user_id AND playlist_id = p_playlist_id
    ) INTO exists_check;
    
    IF exists_check THEN
        DELETE FROM public.favorites_playlists 
        WHERE user_id = current_user_id AND playlist_id = p_playlist_id;
        RETURN jsonb_build_object('success', TRUE, 'action', 'removed');
    ELSE
        INSERT INTO public.favorites_playlists (user_id, playlist_id)
        VALUES (current_user_id, p_playlist_id);
        RETURN jsonb_build_object('success', TRUE, 'action', 'added');
    END IF;
END;
$$;

-- =================================================================================================
-- 6. СОЗДАНИЕ ТРИГГЕРОВ
-- =================================================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_tracks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_playlists_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER listening_history_trigger
  AFTER INSERT ON public.listening_history
  FOR EACH ROW
  EXECUTE FUNCTION public.log_listening();

CREATE TRIGGER update_artist_applications_updated_at
  BEFORE UPDATE ON public.artist_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =================================================================================================
-- 7. НАСТРОЙКА RLS (ROW LEVEL SECURITY)
-- =================================================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.track_genres ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.favorites_tracks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.favorites_albums ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.favorites_playlists ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;

-- Политики для ролей
CREATE POLICY "Anyone can view roles" ON public.roles FOR
SELECT TO authenticated USING (TRUE);

-- Политики для пользователей
CREATE POLICY "Users can view own profile" ON public.users FOR
SELECT TO authenticated USING (auth.uid () = id);

CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE TO authenticated USING (auth.uid () = id);

-- Политики для артистов
CREATE POLICY "Anyone can view artists" ON public.artists FOR
SELECT TO authenticated USING (TRUE);

-- Артисты могут быть созданы только через одобрение анкет дистрибьюторами
-- Прямое создание артистов через INSERT запрещено

-- Политики для жанров
CREATE POLICY "Anyone can view genres" ON public.genres FOR
SELECT TO authenticated USING (TRUE);

-- Политики для альбомов
CREATE POLICY "Anyone can view public albums" ON public.albums FOR
SELECT TO authenticated USING (
        is_public = TRUE
        OR is_active = TRUE
    );

CREATE POLICY "Artists and distributors can insert albums" ON public.albums FOR
INSERT
    TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
                JOIN public.roles r ON u.role_id = r.id
            WHERE
                u.id = auth.uid ()
                AND (
                    r.role_name = 'артист'
                    OR r.role_name = 'дистрибьютор'
                )
        )
    );

CREATE POLICY "Users can delete own albums" ON public.albums FOR DELETE TO authenticated USING (created_by = auth.uid ());

-- Политики для треков
CREATE POLICY "Anyone can view public tracks" ON public.tracks FOR
SELECT TO authenticated USING (is_public = TRUE);

CREATE POLICY "Users can view own tracks" ON public.tracks FOR
SELECT TO authenticated USING (uploaded_by = auth.uid ());

CREATE POLICY "Authenticated users can insert tracks" ON public.tracks FOR
INSERT
    TO authenticated
WITH
    CHECK (uploaded_by = auth.uid ());

CREATE POLICY "Users can update own tracks" ON public.tracks FOR
UPDATE TO authenticated USING (uploaded_by = auth.uid ());

CREATE POLICY "Users can delete own tracks" ON public.tracks FOR DELETE TO authenticated USING (uploaded_by = auth.uid ());

-- Политики для плейлистов
CREATE POLICY "Users can view own playlists" ON public.playlists FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Anyone can view public playlists" ON public.playlists FOR
SELECT TO authenticated USING (is_public = TRUE);

CREATE POLICY "Users can create playlists" ON public.playlists FOR
INSERT
    TO authenticated
WITH
    CHECK (user_id = auth.uid ());

CREATE POLICY "Users can update own playlists" ON public.playlists FOR
UPDATE TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can delete own playlists" ON public.playlists FOR DELETE TO authenticated USING (user_id = auth.uid ());

-- Политики для связей трек-жанр
CREATE POLICY "Anyone can view track genres" ON public.track_genres FOR
SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can insert track genres" ON public.track_genres FOR
INSERT
    TO authenticated
WITH
    CHECK (TRUE);

-- Политики для связей плейлист-трек
CREATE POLICY "Users can view tracks in accessible playlists" ON public.playlist_tracks FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.playlists
            WHERE
                id = playlist_id
                AND (
                    user_id = auth.uid ()
                    OR is_public = TRUE
                )
        )
    );

CREATE POLICY "Users can manage tracks in own playlists" ON public.playlist_tracks FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.playlists
        WHERE
            id = playlist_id
            AND user_id = auth.uid ()
    )
);

-- Политики для истории прослушиваний
CREATE POLICY "Users can view own listening history" ON public.listening_history FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can insert own listening history" ON public.listening_history FOR
INSERT
    TO authenticated
WITH
    CHECK (user_id = auth.uid ());

-- Политики для аудита
CREATE POLICY "Users can view own audit logs" ON public.audit_log FOR
SELECT TO authenticated USING (user_id = auth.uid ());

-- Политики для избранных треков
CREATE POLICY "Users can view own favorite tracks" ON public.favorites_tracks FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can manage own favorite tracks" ON public.favorites_tracks FOR ALL TO authenticated USING (user_id = auth.uid ());

-- Политики для избранных альбомов
CREATE POLICY "Users can view own favorite albums" ON public.favorites_albums FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can manage own favorite albums" ON public.favorites_albums FOR ALL TO authenticated USING (user_id = auth.uid ());

-- Политики для избранных плейлистов
CREATE POLICY "Users can view own favorite playlists" ON public.favorites_playlists FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can manage own favorite playlists" ON public.favorites_playlists FOR ALL TO authenticated USING (user_id = auth.uid ());

-- Политики для анкет артистов
CREATE POLICY "Users can view own artist applications" ON public.artist_applications FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can create artist applications" ON public.artist_applications FOR
INSERT
    TO authenticated
WITH
    CHECK (
        user_id = auth.uid ()
        AND status = 'pending'
    );

CREATE POLICY "Distributors can view all artist applications" ON public.artist_applications FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.users u
                JOIN public.roles r ON u.role_id = r.id
            WHERE
                u.id = auth.uid ()
                AND r.role_name = 'дистрибьютор'
        )
    );

CREATE POLICY "Distributors can update artist applications" ON public.artist_applications FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
        WHERE
            u.id = auth.uid ()
            AND r.role_name = 'дистрибьютор'
    )
);

-- =================================================================================================
-- 8. ВСТАВКА БАЗОВЫХ ДАННЫХ
-- =================================================================================================

INSERT INTO
    public.roles (role_name, role_description)
VALUES (
        'слушатель',
        'Обычный пользователь, может слушать музыку и создавать плейлисты'
    ),
    (
        'администратор',
        'Полный доступ ко всем функциям системы'
    ),
    (
        'артист',
        'Может загружать и управлять своими треками и альбомами'
    ),
    (
        'дистрибьютор',
        'Может загружать музыку от имени артистов'
    ),
    (
        'модератор',
        'Может модерировать контент и пользователей'
    ) ON CONFLICT (role_name) DO NOTHING;

INSERT INTO
    public.genres (genre_name, genre_description)
VALUES ('Поп', 'Популярная музыка'),
    (
        'Рок',
        'Рок-музыка во всех её проявлениях'
    ),
    (
        'Хип-Хоп',
        'Хип-хоп и рэп музыка'
    ),
    (
        'Электронная',
        'Электронная музыка'
    ),
    ('Джаз', 'Джазовая музыка'),
    (
        'Классическая',
        'Классическая музыка'
    ) ON CONFLICT (genre_name) DO NOTHING;

-- =================================================================================================
-- 9. СОЗДАНИЕ STORAGE BUCKETS
-- =================================================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('songs', 'songs', FALSE, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4']),
  ('covers', 'covers', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS политики
DROP POLICY IF EXISTS "Authenticated users can upload songs" ON storage.objects;

DROP POLICY IF EXISTS "Users can view own songs" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view public songs" ON storage.objects;

DROP POLICY IF EXISTS "Users can delete own songs" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;

CREATE POLICY "Authenticated users can upload songs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own songs"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Политика для просмотра всех песен (публичных) - позволяет слушать треки других пользователей
CREATE POLICY "Anyone can view public songs" ON storage.objects FOR
SELECT TO authenticated USING (bucket_id = 'songs');

CREATE POLICY "Users can delete own songs"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view covers" ON storage.objects FOR
SELECT TO authenticated USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can upload covers" ON storage.objects FOR
INSERT
    TO authenticated
WITH
    CHECK (bucket_id = 'covers');

-- RLS политики для bucket 'avatars'
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR
SELECT TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

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

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =================================================================================================
-- КОНЕЦ СКРИПТА
-- =================================================================================================
-- Скрипт успешно выполнен!
-- Все таблицы, функции, триггеры и политики безопасности созданы.
-- =================================================================================================