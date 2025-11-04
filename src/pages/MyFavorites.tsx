import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Play, Clock, Search, Heart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Track } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

const MyFavorites = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { playTrack, setPlaylist } = usePlayer();

  useEffect(() => {
    fetchFavoriteTracks();
  }, []);

  const fetchFavoriteTracks = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("favorites_tracks")
        .select(`
          id,
          created_at,
          track:tracks(
            id,
            track_title,
            track_duration,
            track_play_count,
            track_like_count,
            track_audio_url,
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Преобразуем данные для удобства использования
      const transformedTracks = (data || [])
        .map(item => item.track)
        .filter(Boolean)
        .map(track => ({
          ...track,
          genres: track.genres.map(tg => tg.genre)
        }));
      
      setTracks(transformedTracks);
      setPlaylist(transformedTracks);
    } catch (error: any) {
      toast.error(t('library.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredTracks = tracks.filter(
    (track) =>
      track.track_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.album.artist.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.album.album_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayTrack = (track: Track) => {
    playTrack(track);
  };

  const toggleFavorite = async (trackId: string) => {
    try {
      const { data, error } = await supabase.rpc("toggle_favorite_track", {
        p_track_id: trackId,
      });

      if (error) throw error;
      
      toast.success(data.action === "removed" ? t("library.trackRemoved") : t("library.trackAdded"));
      
      // Обновляем список после удаления из избранного
      if (data.action === "removed") {
        setTracks(tracks.filter(track => track.id !== trackId));
      }
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/profile")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('profile.favorites')}</h1>
          <p className="text-muted-foreground">{tracks.length} {t("library.tracks").toLowerCase()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={t("library.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Songs List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
        </div>
      ) : filteredTracks.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 backdrop-blur">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? t("library.emptySearch") : t('profile.favorites')}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? t("library.emptyMessage")
              : "У вас пока нет избранных треков"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTracks.map((track) => (
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
                  <h3 className="font-semibold truncate">{track.track_title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.album?.artist?.id ? (
                      <span 
                        className="hover:text-primary hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/artists/${track.album.artist.id}`);
                        }}
                      >
                        {track.album.artist.artist_name}
                      </span>
                    ) : (
                      <span>{track.album?.artist?.artist_name || 'Неизвестный артист'}</span>
                    )}
                    {' • '}
                    {track.album?.id ? (
                      <span 
                        className="hover:text-primary hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/albums/${track.album.id}`);
                        }}
                      >
                        {track.album.album_title}
                      </span>
                    ) : (
                      <span>{track.album?.album_title || 'Без альбома'}</span>
                    )}
                  </p>
                  {track.genres.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {track.genres.slice(0, 2).map((genre) => (
                        <span
                          key={genre.id}
                          className="text-xs bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 px-2 py-1 rounded-full text-yellow-300 font-medium"
                        >
                          {genre.genre_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatDuration(track.track_duration)}
                </div>

                <div className="hidden md:block text-xs text-muted-foreground">
                  {track.track_play_count} {t("library.plays")}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                    className="hover:bg-transparent"
                  >
                    <Heart 
                      className="w-5 h-5 fill-red-500 text-red-500" 
                    />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFavorites;

