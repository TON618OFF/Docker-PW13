import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Track = Database['public']['Tables']['tracks']['Row'];
type TrackInsert = Database['public']['Tables']['tracks']['Insert'];
type TrackUpdate = Database['public']['Tables']['tracks']['Update'];

/**
 * Получить все треки
 */
export async function getTracks(filters?: {
  search?: string;
  genreId?: string;
  artistId?: string;
  albumId?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('tracks')
    .select(`
      *,
      album:albums(*, artist:artists(*)),
      genres:track_genres(genre:genres(*))
    `);

  if (filters?.search) {
    query = query.ilike('track_title', `%${filters.search}%`);
  }

  if (filters?.genreId) {
    query = query.eq('track_genres.genre_id', filters.genreId);
  }

  if (filters?.artistId) {
    query = query.eq('albums.artist_id', filters.artistId);
  }

  if (filters?.albumId) {
    query = query.eq('album_id', filters.albumId);
  }

  if (filters?.isPublic !== undefined) {
    query = query.eq('is_public', filters.isPublic);
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
 * Получить трек по ID
 */
export async function getTrackById(trackId: string) {
  return supabase
    .from('tracks')
    .select(`
      *,
      album:albums(*, artist:artists(*)),
      genres:track_genres(genre:genres(*))
    `)
    .eq('id', trackId)
    .single();
}

/**
 * Создать новый трек
 */
export async function createTrack(track: TrackInsert) {
  return supabase
    .from('tracks')
    .insert(track)
    .select()
    .single();
}

/**
 * Обновить трек
 */
export async function updateTrack(trackId: string, updates: TrackUpdate) {
  return supabase
    .from('tracks')
    .update(updates)
    .eq('id', trackId)
    .select()
    .single();
}

/**
 * Удалить трек
 */
export async function deleteTrack(trackId: string) {
  return supabase
    .from('tracks')
    .delete()
    .eq('id', trackId);
}

/**
 * Увеличить счетчик прослушиваний
 */
export async function incrementPlayCount(trackId: string) {
  return supabase.rpc('increment_track_play_count', {
    track_id: trackId,
  });
}

