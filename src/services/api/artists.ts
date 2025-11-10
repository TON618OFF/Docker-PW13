import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Artist = Database['public']['Tables']['artists']['Row'];
type ArtistInsert = Database['public']['Tables']['artists']['Insert'];
type ArtistUpdate = Database['public']['Tables']['artists']['Update'];

/**
 * Получить всех артистов
 */
export async function getArtists(filters?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('artists')
    .select(`
      *,
      albums:albums(*)
    `);

  if (filters?.search) {
    query = query.ilike('artist_name', `%${filters.search}%`);
  }

  query = query.order('artist_name', { ascending: true });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  return query;
}

/**
 * Получить артиста по ID
 */
export async function getArtistById(artistId: string) {
  return supabase
    .from('artists')
    .select(`
      *,
      albums:albums(*, tracks:tracks(*))
    `)
    .eq('id', artistId)
    .single();
}

/**
 * Создать нового артиста
 */
export async function createArtist(artist: ArtistInsert) {
  return supabase
    .from('artists')
    .insert(artist)
    .select()
    .single();
}

/**
 * Обновить артиста
 */
export async function updateArtist(artistId: string, updates: ArtistUpdate) {
  return supabase
    .from('artists')
    .update(updates)
    .eq('id', artistId)
    .select()
    .single();
}

/**
 * Удалить артиста
 */
export async function deleteArtist(artistId: string) {
  return supabase
    .from('artists')
    .delete()
    .eq('id', artistId);
}

