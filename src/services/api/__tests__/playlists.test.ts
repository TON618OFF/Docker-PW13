import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as playlistsAPI from '../playlists';
import { supabase } from '@/integrations/supabase/client';
import { createMockSupabaseQuery, createMockSupabaseQueryWithSingle } from '@/test/helpers/mockSupabaseQuery';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Playlists API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlaylists', () => {
    it('должен получить все плейлисты пользователя', async () => {
      const mockData = [
        {
          id: '1',
          playlist_name: 'Test Playlist',
          user_id: 'user-1',
        },
      ];

      const mockQuery = createMockSupabaseQuery(mockData);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await playlistsAPI.getPlaylists('user-1');

      expect(supabase.from).toHaveBeenCalledWith('playlists');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('должен применить фильтр поиска', async () => {
      const mockQuery = createMockSupabaseQuery([]);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await playlistsAPI.getPlaylists('user-1', { search: 'test' });

      expect(mockQuery.ilike).toHaveBeenCalledWith('playlist_name', '%test%');
    });
  });

  describe('getPlaylistById', () => {
    it('должен получить плейлист по ID', async () => {
      const mockPlaylist = {
        id: '1',
        playlist_name: 'Test Playlist',
        user_id: 'user-1',
      };

      const mockQuery = createMockSupabaseQueryWithSingle(mockPlaylist);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await playlistsAPI.getPlaylistById('1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.single).toHaveBeenCalled();
    });
  });

  describe('createPlaylist', () => {
    it('должен создать новый плейлист', async () => {
      const newPlaylist = {
        playlist_name: 'New Playlist',
        user_id: 'user-1',
      };

      const createdPlaylist = { id: '1', ...newPlaylist };
      const mockQuery = createMockSupabaseQueryWithSingle(createdPlaylist);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await playlistsAPI.createPlaylist(newPlaylist);

      expect(mockQuery.insert).toHaveBeenCalledWith(newPlaylist);
    });
  });

  describe('addTrackToPlaylist', () => {
    it('должен добавить трек в плейлист', async () => {
      const mockData = { id: '1' };
      const mockQuery = createMockSupabaseQueryWithSingle(mockData);
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await playlistsAPI.addTrackToPlaylist('playlist-1', 'track-1', 0);

      expect(supabase.from).toHaveBeenCalledWith('playlist_tracks');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        playlist_id: 'playlist-1',
        track_id: 'track-1',
        position: 0,
      });
    });
  });

  describe('removeTrackFromPlaylist', () => {
    it('должен удалить трек из плейлиста', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await playlistsAPI.removeTrackFromPlaylist('playlist-1', 'track-1');

      expect(supabase.from).toHaveBeenCalledWith('playlist_tracks');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('playlist_id', 'playlist-1');
    });
  });
});

