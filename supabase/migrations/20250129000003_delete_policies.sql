-- Добавление политик для удаления треков, альбомов и плейлистов только владельцем
-- Выполните этот скрипт после основного скрипта миграции

-- =================================================================================================
-- ДОПОЛНИТЕЛЬНЫЕ RLS ПОЛИТИКИ ДЛЯ УДАЛЕНИЯ
-- =================================================================================================

-- Политики для удаления треков (только владелец)
DROP POLICY IF EXISTS "Users can delete own tracks" ON public.tracks;

CREATE POLICY "Users can delete own tracks" ON public.tracks FOR DELETE TO authenticated USING (uploaded_by = auth.uid ());

-- Политики для удаления альбомов (только создатель альбома через артиста)
-- Для альбомов нужно проверить, является ли пользователь создателем артиста
-- Добавим поле created_by в albums или проверим через artist_id
-- Но так как у нас нет прямой связи, добавим проверку через tracks
DROP POLICY IF EXISTS "Users can delete own albums" ON public.albums;

CREATE POLICY "Users can delete own albums" ON public.albums FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.tracks
        WHERE
            tracks.album_id = albums.id
            AND tracks.uploaded_by = auth.uid ()
        LIMIT 1
    )
);

-- Политики для удаления плейлистов (только владелец)
DROP POLICY IF EXISTS "Users can delete own playlists" ON public.playlists;

CREATE POLICY "Users can delete own playlists" ON public.playlists FOR DELETE TO authenticated USING (user_id = auth.uid ());

-- Политики для удаления артистов (только если пользователь создал альбомы/треки этого артиста)
DROP POLICY IF EXISTS "Users can delete own artists" ON public.artists;

CREATE POLICY "Users can delete own artists" ON public.artists FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.albums
            JOIN public.tracks ON albums.id = tracks.album_id
        WHERE
            albums.artist_id = artists.id
            AND tracks.uploaded_by = auth.uid ()
        LIMIT 1
    )
);

-- Политики для удаления связей трек-жанр (только владелец трека)
DROP POLICY IF EXISTS "Users can delete track genres for own tracks" ON public.track_genres;

CREATE POLICY "Users can delete track genres for own tracks" ON public.track_genres FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.tracks
        WHERE
            tracks.id = track_genres.track_id
            AND tracks.uploaded_by = auth.uid ()
    )
);

-- Политики для удаления связей плейлист-трек (только владелец плейлиста)
DROP POLICY IF EXISTS "Users can delete tracks from own playlists" ON public.playlist_tracks;

CREATE POLICY "Users can delete tracks from own playlists" ON public.playlist_tracks FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.playlists
        WHERE
            playlists.id = playlist_tracks.playlist_id
            AND playlists.user_id = auth.uid ()
    )
);