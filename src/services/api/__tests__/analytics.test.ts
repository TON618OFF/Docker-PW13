import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as analyticsAPI from '../analytics';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getListeningStats', () => {
    it('должен получить статистику прослушиваний без фильтров', async () => {
      const mockData = [
        {
          id: '1',
          track_id: 'track-1',
          user_id: 'user-1',
          listened_at: '2025-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await analyticsAPI.getListeningStats();

      expect(supabase.from).toHaveBeenCalledWith('listening_history');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.order).toHaveBeenCalledWith('listened_at', { ascending: false });
    });

    it('должен применить фильтр по дате начала', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await analyticsAPI.getListeningStats({ startDate: '2025-01-01' });

      expect(mockQuery.gte).toHaveBeenCalledWith('listened_at', '2025-01-01');
    });

    it('должен применить фильтр по дате окончания', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await analyticsAPI.getListeningStats({ endDate: '2025-01-31' });

      expect(mockQuery.lte).toHaveBeenCalledWith('listened_at', '2025-01-31');
    });

    it('должен применить фильтр по треку', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await analyticsAPI.getListeningStats({ trackId: 'track-1' });

      expect(mockQuery.eq).toHaveBeenCalledWith('track_id', 'track-1');
    });

    it('должен применить фильтр по пользователю', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await analyticsAPI.getListeningStats({ userId: 'user-1' });

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  describe('getTopTracks', () => {
    it('должен получить топ треков', async () => {
      const mockData = [
        { track_id: 'track-1', play_count: 100 },
        { track_id: 'track-2', play_count: 50 },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null });

      const result = await analyticsAPI.getTopTracks(10);

      expect(supabase.rpc).toHaveBeenCalledWith('get_top_tracks', {
        p_limit: 10,
        p_start_date: null,
        p_end_date: null,
        p_genre_id: null,
        p_artist_id: null,
      });
    });

    it('должен применить фильтры к топ трекам', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null });

      await analyticsAPI.getTopTracks(10, {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        genreId: 'genre-1',
        artistId: 'artist-1',
      });

      expect(supabase.rpc).toHaveBeenCalledWith('get_top_tracks', {
        p_limit: 10,
        p_start_date: '2025-01-01',
        p_end_date: '2025-01-31',
        p_genre_id: 'genre-1',
        p_artist_id: 'artist-1',
      });
    });
  });

  describe('getGenreStats', () => {
    it('должен получить статистику по жанрам', async () => {
      const mockData = [
        { genre_id: 'genre-1', play_count: 100 },
        { genre_id: 'genre-2', play_count: 50 },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null });

      const result = await analyticsAPI.getGenreStats();

      expect(supabase.rpc).toHaveBeenCalledWith('get_genre_statistics', {
        p_start_date: null,
        p_end_date: null,
      });
    });

    it('должен применить фильтры по дате к статистике жанров', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null });

      await analyticsAPI.getGenreStats({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(supabase.rpc).toHaveBeenCalledWith('get_genre_statistics', {
        p_start_date: '2025-01-01',
        p_end_date: '2025-01-31',
      });
    });
  });

  describe('getDailyListeningStats', () => {
    it('должен получить ежедневную статистику', async () => {
      const mockData = [
        { date: '2025-01-01', play_count: 10 },
        { date: '2025-01-02', play_count: 20 },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null });

      const result = await analyticsAPI.getDailyListeningStats();

      expect(supabase.rpc).toHaveBeenCalledWith('get_daily_listening_stats', {
        p_start_date: null,
        p_end_date: null,
        p_user_id: null,
      });
    });

    it('должен применить фильтры к ежедневной статистике', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null });

      await analyticsAPI.getDailyListeningStats({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        userId: 'user-1',
      });

      expect(supabase.rpc).toHaveBeenCalledWith('get_daily_listening_stats', {
        p_start_date: '2025-01-01',
        p_end_date: '2025-01-31',
        p_user_id: 'user-1',
      });
    });
  });
});

