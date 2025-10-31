import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ArrowLeft, Play, Clock, Trash2, Shuffle, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Track } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { playTrack, setPlaylist } = usePlayer();
  const [playlist, setPlaylistData] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    const initUser = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    initUser();
    fetchPlaylistData();
  }, [id]);

  const fetchPlaylistData = async () => {
    if (!id) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Загружаем данные плейлиста
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select(`
          *,
          user:users(
            id,
            username
          )
        `)
        .eq("id", id)
        .single();

      if (playlistError) throw playlistError;

      // Проверяем доступ
      if (!playlistData.is_public && playlistData.user_id !== user.id) {
        toast.error(t('playlistDetail.noAccess'));
        navigate("/playlists");
        return;
      }

      // Если данные пользователя не загрузились, загружаем их отдельно
      let userData = playlistData.user;
      if (!userData && playlistData.user_id) {
        const { data: userInfo } = await supabase
          .from("users")
          .select("id, username")
          .eq("id", playlistData.user_id)
          .single();
        if (userInfo) userData = userInfo;
      }

      setPlaylistData({ ...playlistData, user: userData });

      // Загружаем треки плейлиста
      const { data: tracksData, error: tracksError } = await supabase
        .from("playlist_tracks")
        .select(`
          order_position,
          track:tracks(
            id,
            track_title,
            track_duration,
            track_play_count,
            track_like_count,
            track_audio_url,
            uploaded_by,
            created_at,
            album:albums(
              id,
              album_title,
              album_cover_url,
              artist:artists(
                id,
                artist_name
              )
            ),
            genres:track_genres(
              id,
              genre:genres(
                id,
                genre_name
              )
            )
          )
        `)
        .eq("playlist_id", id)
        .order("order_position", { ascending: true });

      if (tracksError) throw tracksError;

      const transformedTracks: Track[] = (tracksData || [])
        .map((item: any) => ({
          ...item.track,
          genres: item.track.genres.map((tg: any) => tg.genre)
        }))
        .filter((track: any) => track.id); // Фильтруем удаленные треки

      // Подсчитываем общее количество проигрываний
      const total = transformedTracks.reduce((sum, track) => sum + (track.track_play_count || 0), 0);
      setTotalPlays(total);

      setTracks(transformedTracks);
      setPlaylist(transformedTracks);
    } catch (error: any) {
      toast.error(`${t('playlistDetail.loadError')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track: Track) => {
    playTrack(track);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0]);
      toast.success(t('index.startingPlayback').replace('{count}', tracks.length.toString()));
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0]);
      setPlaylist(shuffled);
      toast.success(t('index.startingPlayback').replace('{count}', tracks.length.toString()));
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("playlist_id", id)
        .eq("track_id", trackId);

      if (error) throw error;

      toast.success(t('playlists.detail.removeFromPlaylist'));
      fetchPlaylistData();
    } catch (error: any) {
      toast.error(t('playlists.detail.errorDeleteTrack', { message: error.message }));
    }
  };

  const handleTogglePrivacy = async (isPublic: boolean) => {
    if (!id || !currentUserId || playlist.user_id !== currentUserId) return;

    try {
      const { error } = await supabase
        .from("playlists")
        .update({ is_public: isPublic })
        .eq("id", id)
        .eq("user_id", currentUserId);

      if (error) throw error;

      // Обновляем локальное состояние
      setPlaylistData({ ...playlist, is_public: isPublic });
      
      toast.success(
        isPublic 
          ? t('playlists.privacyChanged.public') 
          : t('playlists.privacyChanged.private')
      );
    } catch (error: any) {
      toast.error(t('playlists.privacyChangeError', { message: error.message }));
      // Откатываем изменение в UI в случае ошибки
      setPlaylistData({ ...playlist, is_public: !isPublic });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">{t('playlists.detail.notFound')}</h2>
        <Button onClick={() => navigate("/playlists")}>{t('playlists.detail.back')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/playlists")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('playlists.detail.back')}
        </Button>
      </div>

      {/* Header */}
      <Card className="p-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-48 h-48 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
            {playlist.playlist_cover_url ? (
              <img
                src={playlist.playlist_cover_url}
                alt={playlist.playlist_title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-24 h-24 text-primary/40" />
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{playlist.playlist_title}</h1>
            {playlist.playlist_description && (
              <p className="text-muted-foreground mb-4">{playlist.playlist_description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {playlist.user && (
                <>
                  <div className="flex items-center gap-2">
                    <span>{t('playlists.owner')}: {playlist.user.username}</span>
                  </div>
                  <span>•</span>
                </>
              )}
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>{tracks.length} {t('playlists.detail.tracksCount')}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(tracks.reduce((sum, t) => sum + t.track_duration, 0))}</span>
              </div>
              {totalPlays > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <span>{totalPlays} {t('playlists.detail.totalPlays')}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex gap-3">
                <Button onClick={handlePlayAll} className="gap-2 bg-primary hover:bg-primary/90" disabled={tracks.length === 0}>
                  <Play className="w-4 h-4" />
                  {t('playlists.detail.playAll')}
                </Button>
                <Button onClick={handleShuffle} variant="outline" className="gap-2" disabled={tracks.length === 0}>
                  <Shuffle className="w-4 h-4" />
                  {t('playlists.detail.shuffle')}
                </Button>
              </div>
              {currentUserId && playlist.user_id === currentUserId && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card/50">
                  {playlist.is_public ? (
                    <Globe className="w-4 h-4 text-primary" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="privacy-switch" className="text-sm cursor-pointer">
                    {playlist.is_public ? t('playlists.public') : t('playlists.private')}
                  </Label>
                  <Switch
                    id="privacy-switch"
                    checked={playlist.is_public}
                    onCheckedChange={handleTogglePrivacy}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tracks List */}
      {tracks.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 backdrop-blur">
          <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('playlists.detail.empty')}</h3>
          <p className="text-muted-foreground mb-6">
            {t('playlists.detail.addTracks')}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <Card
              key={track.id}
              className="p-4 hover:bg-card/80 transition-colors cursor-pointer group"
              onClick={() => handlePlayTrack(track)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                  {track.album.album_cover_url ? (
                    <img
                      src={track.album.album_cover_url}
                      alt={track.album.album_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="w-6 h-6 text-primary" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                    <h3 className="font-semibold truncate">{track.track_title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.album.artist.artist_name} • {track.album.album_title}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatDuration(track.track_duration)}
                </div>

                {currentUserId && playlist.user_id === currentUserId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t('playlists.detail.confirmRemove'))) {
                        handleRemoveTrack(track.id);
                      }
                    }}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistDetail;

