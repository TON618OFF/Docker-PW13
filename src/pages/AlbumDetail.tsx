import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ArrowLeft, Play, Clock, Shuffle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Track } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

const AlbumDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playTrack, setPlaylist } = usePlayer();
  const { t } = useTranslation();
  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    if (id) {
      fetchAlbumData();
    }
  }, [id]);

  const fetchAlbumData = async () => {
    if (!id) return;

    try {
      // Загружаем данные альбома
      const { data: albumData, error: albumError } = await supabase
        .from("albums")
        .select(`
          *,
          artist:artists(
            id,
            artist_name,
            artist_image_url
          )
        `)
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (albumError) throw albumError;

      if (!albumData) {
        toast.error(t('albumDetail.notFound'));
        navigate("/library");
        return;
      }

      setAlbum(albumData);

      // Загружаем треки альбома
      const { data: tracksData, error: tracksError } = await supabase
        .from("tracks")
        .select(`
          id,
          track_title,
          track_duration,
          track_play_count,
          track_audio_url,
          track_order,
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
        `)
        .eq("album_id", id)
        .eq("is_public", true)
        .order("track_order", { ascending: true });

      if (tracksError) throw tracksError;

      const transformedTracks: Track[] = (tracksData || []).map((track: any) => ({
        ...track,
        genres: track.genres.map((tg: any) => tg.genre)
      }));

      setTracks(transformedTracks);

      // Вычисляем общее количество прослушиваний
      const total = transformedTracks.reduce((sum, track) => sum + (track.track_play_count || 0), 0);
      setTotalPlays(total);
    } catch (error: any) {
      console.error("Ошибка загрузки альбома:", error);
      toast.error(t('albumDetail.loadError'));
      navigate("/library");
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) {
      toast.error("Нет треков для воспроизведения");
      return;
    }

    setPlaylist(tracks);
    playTrack(tracks[0]);
    toast.success(t('index.startingPlayback').replace('{count}', tracks.length.toString()));
  };

  const handleShuffle = () => {
    if (tracks.length === 0) {
      toast.error("Нет треков для воспроизведения");
      return;
    }

    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setPlaylist(shuffled);
    playTrack(shuffled[0]);
    toast.success(t('index.startingPlayback').replace('{count}', tracks.length.toString()));
  };

  const handlePlayTrack = (track: Track) => {
    playTrack(track);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!album) {
    return null;
  }

  const totalDuration = tracks.reduce((sum, track) => sum + track.track_duration, 0);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => navigate("/library")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('albumDetail.backToLibrary')}
      </Button>

      {/* Album Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 h-64 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-lg overflow-hidden flex-shrink-0">
            {album.album_cover_url ? (
              <img
                src={album.album_cover_url}
                alt={album.album_title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-32 h-32 text-primary/40" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{album.album_title}</h1>
              <div className="flex items-center gap-3 mb-4">
                {album.artist?.artist_image_url && (
                  <img
                    src={album.artist.artist_image_url}
                    alt={album.artist.artist_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => album.artist?.id && navigate(`/artists/${album.artist.id}`)}
                  />
                )}
                <p 
                  className="text-xl text-muted-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
                  onClick={() => album.artist?.id && navigate(`/artists/${album.artist.id}`)}
                >
                  {album.artist?.artist_name}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(album.album_release_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>{tracks.length} {t('albumDetail.tracks')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>{totalPlays} {t('albumDetail.listens')}</span>
              </div>
            </div>

            {album.album_description && (
              <p className="text-muted-foreground">{album.album_description}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handlePlayAll}
                className="gap-2 bg-primary hover:bg-primary/90"
                disabled={tracks.length === 0}
              >
                <Play className="w-4 h-4" />
                {t('albumDetail.playAll')}
              </Button>
              <Button
                onClick={handleShuffle}
                variant="outline"
                className="gap-2"
                disabled={tracks.length === 0}
              >
                <Shuffle className="w-4 h-4" />
                {t('albumDetail.shuffle')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tracks List */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">{t('albumDetail.tracksTitle')}</h2>
        
        {tracks.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('albumDetail.emptyMessage')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <Card
                key={track.id}
                className="p-4 hover:bg-card/80 transition-colors cursor-pointer group"
                onClick={() => handlePlayTrack(track)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 text-center text-muted-foreground group-hover:hidden">
                    {index + 1}
                  </div>
                  <div className="w-10 text-center hidden group-hover:block">
                    <Play className="w-5 h-5 text-primary mx-auto" />
                  </div>

                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {track.album?.album_cover_url ? (
                      <img
                        src={track.album.album_cover_url}
                        alt={track.album.album_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{track.track_title}</h3>
                    {track.genres && track.genres.length > 0 && (
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
                    <Play className="w-4 h-4" />
                    <span>{track.track_play_count || 0}</span>
                  </div>

                  <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {formatDuration(track.track_duration)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AlbumDetail;

