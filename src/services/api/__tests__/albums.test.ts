import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as albumsAPI from '../albums';
import { supabase } from '@/integrations/supabase/client';
import { createMockSupabaseQuery, createMockSupabaseQueryWithSingle } from '@/test/helpers/mockSupabaseQuery';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Albums API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAlbums', () => {
    it('должен получить все альбомы без фильтров', async () => {
      const mockData = [
        {
          id: '1',
          album_title: 'Test Album',
          artist_id: 'artist-1',
        },
      ];

      const mockQuery = createMockSupabaseQuery(mockData);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await albumsAPI.getAlbums();

      expect(supabase.from).toHaveBeenCalledWith('albums');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('должен применить фильтр по артисту', async () => {
      const mockQuery = createMockSupabaseQuery([]);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await albumsAPI.getAlbums({ artistId: 'artist-1' });

      expect(mockQuery.eq).toHaveBeenCalledWith('artist_id', 'artist-1');
    });

    it('должен применить фильтр поиска', async () => {
      const mockQuery = createMockSupabaseQuery([]);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await albumsAPI.getAlbums({ search: 'test' });

      expect(mockQuery.ilike).toHaveBeenCalledWith('album_title', '%test%');
    });
  });

  describe('getAlbumById', () => {
    it('должен получить альбом по ID', async () => {
      const mockAlbum = {
        id: '1',
        album_title: 'Test Album',
        artist_id: 'artist-1',
      };

      const mockQuery = createMockSupabaseQueryWithSingle(mockAlbum);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await albumsAPI.getAlbumById('1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.single).toHaveBeenCalled();
    });
  });

  describe('createAlbum', () => {
    it('должен создать новый альбом', async () => {
      const newAlbum = {
        album_title: 'New Album',
        artist_id: 'artist-1',
      };

      const createdAlbum = { id: '1', ...newAlbum };
      const mockQuery = createMockSupabaseQueryWithSingle(createdAlbum);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await albumsAPI.createAlbum(newAlbum);

      expect(mockQuery.insert).toHaveBeenCalledWith(newAlbum);
    });
  });

  describe('updateAlbum', () => {
    it('должен обновить альбом', async () => {
      const updates = {
        album_title: 'Updated Album',
      };

      const updatedAlbum = { id: '1', ...updates };
      const mockQuery = createMockSupabaseQueryWithSingle(updatedAlbum);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await albumsAPI.updateAlbum('1', updates);

      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('deleteAlbum', () => {
    it('должен удалить альбом', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await albumsAPI.deleteAlbum('1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });
  });
});

