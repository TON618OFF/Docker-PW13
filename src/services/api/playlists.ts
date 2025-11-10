import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Playlist = Database['public']['Tables']['playlists']['Row'];
type PlaylistInsert = Database['public']['Tables']['playlists']['Insert'];
type PlaylistUpdate = Database['public']['Tables']['playlists']['Update'];

/**
 * Получить все плейлисты пользователя
 */
export async function getPlaylists(userId: string, filters?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('playlists')
    .select(`
      *,
      tracks:playlist_tracks(track:tracks(*))
    `)
    .eq('user_id', userId);

  if (filters?.search) {
    query = query.ilike('playlist_name', `%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  return query;
}

/**
 * Получить плейлист по ID
 */
export async function getPlaylistById(playlistId: string) {
  return supabase
    .from('playlists')
    .select(`
      *,
      tracks:playlist_tracks(track:tracks(*))
    `)
    .eq('id', playlistId)
    .single();
}

/**
 * Создать новый плейлист
 */
export async function createPlaylist(playlist: PlaylistInsert) {
  return supabase
    .from('playlists')
    .insert(playlist)
    .select()
    .single();
}

/**
 * Обновить плейлист
 */
export async function updatePlaylist(playlistId: string, updates: PlaylistUpdate) {
  return supabase
    .from('playlists')
    .update(updates)
    .eq('id', playlistId)
    .select()
    .single();
}

/**
 * Удалить плейлист
 */
export async function deletePlaylist(playlistId: string) {
  return supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);
}

/**
 * Добавить трек в плейлист
 */
export async function addTrackToPlaylist(playlistId: string, trackId: string, position?: number) {
  return supabase
    .from('playlist_tracks')
    .insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: position || 0,
    })
    .select()
    .single();
}

/**
 * Удалить трек из плейлиста
 */
export async function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  return supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);
}

