import { supabase } from '@/integrations/supabase/client';

/**
 * Получить статистику прослушиваний
 */
export async function getListeningStats(filters?: {
  startDate?: string;
  endDate?: string;
  trackId?: string;
  userId?: string;
}) {
  let query = supabase
    .from('listening_history')
    .select('*');

  if (filters?.startDate) {
    query = query.gte('listened_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('listened_at', filters.endDate);
  }

  if (filters?.trackId) {
    query = query.eq('track_id', filters.trackId);
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  return query.order('listened_at', { ascending: false });
}

/**
 * Получить топ треков
 */
export async function getTopTracks(limit: number = 10, filters?: {
  startDate?: string;
  endDate?: string;
  genreId?: string;
  artistId?: string;
}) {
  // Используем RPC функцию для получения топ треков
  return supabase.rpc('get_top_tracks', {
    p_limit: limit,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_genre_id: filters?.genreId || null,
    p_artist_id: filters?.artistId || null,
  });
}

/**
 * Получить статистику по жанрам
 */
export async function getGenreStats(filters?: {
  startDate?: string;
  endDate?: string;
}) {
  return supabase.rpc('get_genre_statistics', {
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
  });
}

/**
 * Получить ежедневную статистику прослушиваний
 */
export async function getDailyListeningStats(filters?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
}) {
  return supabase.rpc('get_daily_listening_stats', {
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_user_id: filters?.userId || null,
  });
}

