import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Album = Database['public']['Tables']['albums']['Row'];
type AlbumInsert = Database['public']['Tables']['albums']['Insert'];
type AlbumUpdate = Database['public']['Tables']['albums']['Update'];

/**
 * Получить все альбомы
 */
export async function getAlbums(filters?: {
  artistId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('albums')
    .select(`
      *,
      artist:artists(*),
      tracks:tracks(*)
    `);

  if (filters?.artistId) {
    query = query.eq('artist_id', filters.artistId);
  }

  if (filters?.search) {
    query = query.ilike('album_title', `%${filters.search}%`);
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
 * Получить альбом по ID
 */
export async function getAlbumById(albumId: string) {
  return supabase
    .from('albums')
    .select(`
      *,
      artist:artists(*),
      tracks:tracks(*)
    `)
    .eq('id', albumId)
    .single();
}

/**
 * Создать новый альбом
 */
export async function createAlbum(album: AlbumInsert) {
  return supabase
    .from('albums')
    .insert(album)
    .select()
    .single();
}

/**
 * Обновить альбом
 */
export async function updateAlbum(albumId: string, updates: AlbumUpdate) {
  return supabase
    .from('albums')
    .update(updates)
    .eq('id', albumId)
    .select()
    .single();
}

/**
 * Удалить альбом
 */
export async function deleteAlbum(albumId: string) {
  return supabase
    .from('albums')
    .delete()
    .eq('id', albumId);
}

