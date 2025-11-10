import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as artistsAPI from '../artists';
import { supabase } from '@/integrations/supabase/client';
import { createMockSupabaseQuery, createMockSupabaseQueryWithSingle } from '@/test/helpers/mockSupabaseQuery';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Artists API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getArtists', () => {
    it('должен получить всех артистов без фильтров', async () => {
      const mockData = [
        {
          id: '1',
          artist_name: 'Test Artist',
        },
      ];

      const mockQuery = createMockSupabaseQuery(mockData);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await artistsAPI.getArtists();

      expect(supabase.from).toHaveBeenCalledWith('artists');
      expect(mockQuery.order).toHaveBeenCalledWith('artist_name', { ascending: true });
    });

    it('должен применить фильтр поиска', async () => {
      const mockQuery = createMockSupabaseQuery([]);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await artistsAPI.getArtists({ search: 'test' });

      expect(mockQuery.ilike).toHaveBeenCalledWith('artist_name', '%test%');
    });
  });

  describe('getArtistById', () => {
    it('должен получить артиста по ID', async () => {
      const mockArtist = {
        id: '1',
        artist_name: 'Test Artist',
      };

      const mockQuery = createMockSupabaseQueryWithSingle(mockArtist);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await artistsAPI.getArtistById('1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.single).toHaveBeenCalled();
    });
  });

  describe('createArtist', () => {
    it('должен создать нового артиста', async () => {
      const newArtist = {
        artist_name: 'New Artist',
        artist_bio: 'Bio',
      };

      const createdArtist = { id: '1', ...newArtist };
      const mockQuery = createMockSupabaseQueryWithSingle(createdArtist);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await artistsAPI.createArtist(newArtist);

      expect(mockQuery.insert).toHaveBeenCalledWith(newArtist);
    });
  });

  describe('updateArtist', () => {
    it('должен обновить артиста', async () => {
      const updates = {
        artist_name: 'Updated Artist',
      };

      const updatedArtist = { id: '1', ...updates };
      const mockQuery = createMockSupabaseQueryWithSingle(updatedArtist);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await artistsAPI.updateArtist('1', updates);

      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('deleteArtist', () => {
    it('должен удалить артиста', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await artistsAPI.deleteArtist('1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });
  });
});

