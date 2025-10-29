-- Миграция для добавления таблиц избранного и обновлений схемы
-- Версия: 5.0

-- =================================================================================================
-- ТАБЛИЦЫ ИЗБРАННОГО
-- =================================================================================================

-- Таблица избранных треков
CREATE TABLE IF NOT EXISTS public.favorites_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE CASCADE NOT NULL,
    track_id UUID REFERENCES public.tracks (id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, track_id)
);

-- Таблица избранных альбомов
CREATE TABLE IF NOT EXISTS public.favorites_albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE CASCADE NOT NULL,
    album_id UUID REFERENCES public.albums (id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, album_id)
);

-- Таблица избранных плейлистов
CREATE TABLE IF NOT EXISTS public.favorites_playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.users (id) ON DELETE CASCADE NOT NULL,
    playlist_id UUID REFERENCES public.playlists (id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, playlist_id)
);

-- =================================================================================================
-- ИНДЕКСЫ ДЛЯ ИЗБРАННОГО
-- =================================================================================================

CREATE INDEX IF NOT EXISTS idx_favorites_tracks_user ON public.favorites_tracks (user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_tracks_track ON public.favorites_tracks (track_id);

CREATE INDEX IF NOT EXISTS idx_favorites_albums_user ON public.favorites_albums (user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_albums_album ON public.favorites_albums (album_id);

CREATE INDEX IF NOT EXISTS idx_favorites_playlists_user ON public.favorites_playlists (user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_playlists_playlist ON public.favorites_playlists (playlist_id);

-- =================================================================================================
-- RLS ДЛЯ ИЗБРАННОГО
-- =================================================================================================

ALTER TABLE public.favorites_tracks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.favorites_albums ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.favorites_playlists ENABLE ROW LEVEL SECURITY;

-- Политики для избранных треков
DROP POLICY IF EXISTS "Users can view own favorite tracks" ON public.favorites_tracks;

DROP POLICY IF EXISTS "Users can manage own favorite tracks" ON public.favorites_tracks;

CREATE POLICY "Users can view own favorite tracks" ON public.favorites_tracks FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can manage own favorite tracks" ON public.favorites_tracks FOR ALL TO authenticated USING (user_id = auth.uid ());

-- Политики для избранных альбомов
DROP POLICY IF EXISTS "Users can view own favorite albums" ON public.favorites_albums;

DROP POLICY IF EXISTS "Users can manage own favorite albums" ON public.favorites_albums;

CREATE POLICY "Users can view own favorite albums" ON public.favorites_albums FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can manage own favorite albums" ON public.favorites_albums FOR ALL TO authenticated USING (user_id = auth.uid ());

-- Политики для избранных плейлистов
DROP POLICY IF EXISTS "Users can view own favorite playlists" ON public.favorites_playlists;

DROP POLICY IF EXISTS "Users can manage own favorite playlists" ON public.favorites_playlists;

CREATE POLICY "Users can view own favorite playlists" ON public.favorites_playlists FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can manage own favorite playlists" ON public.favorites_playlists FOR ALL TO authenticated USING (user_id = auth.uid ());

-- =================================================================================================
-- ОБНОВЛЕНИЕ ПОЛЕЙ ПО УМОЛЧАНИЮ
-- =================================================================================================

-- Устанавливаем is_public = TRUE по умолчанию для треков
ALTER TABLE public.tracks
ALTER COLUMN is_public
SET DEFAULT TRUE;

-- Устанавливаем is_public = TRUE по умолчанию для альбомов
ALTER TABLE public.albums
ALTER COLUMN is_public
SET DEFAULT TRUE;

-- =================================================================================================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С ИЗБРАННЫМ
-- =================================================================================================

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