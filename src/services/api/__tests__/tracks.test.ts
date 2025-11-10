import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tracksAPI from '../tracks';
import { supabase } from '@/integrations/supabase/client';
import { createMockSupabaseQuery, createMockSupabaseQueryWithSingle } from '@/test/helpers/mockSupabaseQuery';

// Мокаем Supabase клиент
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Tracks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTracks', () => {
    it('должен получить все треки без фильтров', async () => {
      const mockData = [
        {
          id: '1',
          track_title: 'Test Track',
          track_url: 'https://example.com/track.mp3',
          is_public: true,
        },
      ];

      const mockQuery = createMockSupabaseQuery(mockData);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await tracksAPI.getTracks();

      expect(supabase.from).toHaveBeenCalledWith('tracks');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.data).toEqual(mockData);
    });

    it('должен применить фильтр поиска', async () => {
      const mockQuery = createMockSupabaseQuery([]);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await tracksAPI.getTracks({ search: 'test' });

      expect(mockQuery.ilike).toHaveBeenCalledWith('track_title', '%test%');
    });

    it('должен применить фильтр по жанру', async () => {
      const mockQuery = createMockSupabaseQuery([]);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await tracksAPI.getTracks({ genreId: 'genre-1' });

      // Фильтр по жанру применяется через eq на связанную таблицу
      expect(mockQuery.eq).toHaveBeenCalled();
    });

    it('должен применить фильтр по публичности', async () => {
      const mockQuery = createMockSupabaseQuery([]);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await tracksAPI.getTracks({ isPublic: true });

      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true);
    });

    it('должен применить пагинацию', async () => {
      const mockQuery = createMockSupabaseQuery([]);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await tracksAPI.getTracks({ limit: 10, offset: 20 });

      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe('getTrackById', () => {
    it('должен получить трек по ID', async () => {
      const mockTrack = {
        id: '1',
        track_title: 'Test Track',
        track_url: 'https://example.com/track.mp3',
      };

      const mockQuery = createMockSupabaseQueryWithSingle(mockTrack);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await tracksAPI.getTrackById('1');

      expect(supabase.from).toHaveBeenCalledWith('tracks');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result.data).toEqual(mockTrack);
    });
  });

  describe('createTrack', () => {
    it('должен создать новый трек', async () => {
      const newTrack = {
        track_title: 'New Track',
        track_url: 'https://example.com/new-track.mp3',
        album_id: 'album-1',
        is_public: true,
      };

      const createdTrack = { id: '1', ...newTrack };
      const mockQuery = createMockSupabaseQueryWithSingle(createdTrack);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await tracksAPI.createTrack(newTrack);

      expect(mockQuery.insert).toHaveBeenCalledWith(newTrack);
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result.data).toEqual(createdTrack);
    });
  });

  describe('updateTrack', () => {
    it('должен обновить трек', async () => {
      const updates = {
        track_title: 'Updated Track',
      };

      const updatedTrack = { id: '1', ...updates };
      const mockQuery = createMockSupabaseQueryWithSingle(updatedTrack);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await tracksAPI.updateTrack('1', updates);

      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result.data).toEqual(updatedTrack);
    });
  });

  describe('deleteTrack', () => {
    it('должен удалить трек', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await tracksAPI.deleteTrack('1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('incrementPlayCount', () => {
    it('должен увеличить счетчик прослушиваний', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });

      await tracksAPI.incrementPlayCount('track-1');

      expect(supabase.rpc).toHaveBeenCalledWith('increment_track_play_count', {
        track_id: 'track-1',
      });
    });
  });
});

