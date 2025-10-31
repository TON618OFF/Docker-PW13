import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ArrowLeft, Play, Clock, Shuffle, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Track } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

const ArtistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playTrack, setPlaylist } = usePlayer();
  const { t } = useTranslation();
  const [artist, setArtist] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    if (id) {
      fetchArtistData();
    }
  }, [id]);

  const fetchArtistData = async () => {
    if (!id) return;

    try {
      // Загружаем данные артиста
      const { data: artistData, error: artistError } = await supabase
        .from("artists")
        .select(`
          *,
          user:users(
            id,
            username
          )
        `)
        .eq("id", id)
        .single();

      if (artistError) throw artistError;

      if (!artistData) {
        toast.error(t('artist.notFound'));
        navigate("/library");
        return;
      }

      setArtist(artistData);

      // Загружаем альбомы артиста
      const { data: albumsData, error: albumsError } = await supabase
        .from("albums")
        .select(`
          id,
          album_title,
          album_release_date,
          album_cover_url,
          album_description,
          created_at
        `)
        .eq("artist_id", id)
        .eq("is_active", true)
        .order("album_release_date", { ascending: false });

      if (albumsError) throw albumsError;
      setAlbums(albumsData || []);

      // Загружаем треки артиста через альбомы
      // Сначала получаем ID всех альбомов артиста
      const albumIds = albumsData?.map(album => album.id) || [];
      
      let tracksData = null;
      let tracksError = null;
      
      if (albumIds.length > 0) {
        const tracksResult = await supabase
          .from("tracks")
          .select(`
            id,
            track_title,
            track_duration,
            track_play_count,
            track_like_count,
            track_audio_url,
            uploaded_by,
            created_at,
            album_id,
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
          .in("album_id", albumIds)
          .eq("is_public", true)
          .order("created_at", { ascending: false });
        
        tracksData = tracksResult.data;
        tracksError = tracksResult.error;
      }

      if (tracksError) throw tracksError;

      const transformedTracks: Track[] = (tracksData || []).map((track: any) => ({
        ...track,
        genres: track.genres.map((tg: any) => tg.genre)
      }));

      setTracks(transformedTracks);

      // Вычисляем общее количество прослушиваний
      const total = transformedTracks.reduce((sum, track) => sum + (track.track_play_count || 0), 0);
      setTotalPlays(total);

      // Загружаем плейлисты артиста (если он создал)
      if (artistData.user_id) {
        const { data: playlistsData, error: playlistsError } = await supabase
          .from("playlists")
          .select(`
            id,
            playlist_title,
            playlist_description,
            playlist_cover_url,
            is_public,
            created_at
          `)
          .eq("user_id", artistData.user_id)
          .eq("is_active", true)
          .eq("is_public", true)
          .order("created_at", { ascending: false });

        if (!playlistsError && playlistsData) {
          setPlaylists(playlistsData);
        }
      }
    } catch (error: any) {
      console.error("Ошибка загрузки артиста:", error);
      toast.error(t('artist.loadError'));
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

  const handlePlayAll = () => {
    if (tracks.length === 0) {
      toast.error(t('artist.noTracks'));
      return;
    }

    setPlaylist(tracks);
    playTrack(tracks[0]);
    toast.success(t('index.startingPlayback').replace('{count}', tracks.length.toString()));
  };

  const handleShuffle = () => {
    if (tracks.length === 0) {
      toast.error(t('artist.noTracks'));
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

  if (!artist) {
    return null;
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => navigate("/library")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('artist.backToLibrary')}
      </Button>

      {/* Artist Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 h-64 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-lg overflow-hidden flex-shrink-0">
            {artist.artist_image_url ? (
              <img
                src={artist.artist_image_url}
                alt={artist.artist_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-32 h-32 text-primary/40" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{artist.artist_name}</h1>
              {artist.user && (
                <p className="text-lg text-muted-foreground mb-4">
                  {artist.user.username}
                </p>
              )}
              {artist.artist_bio && (
                <p className="text-muted-foreground mb-4">{artist.artist_bio}</p>
              )}
              {artist.genre && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 px-3 py-1 rounded-full text-yellow-300 font-medium">
                    {artist.genre}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>{tracks.length} {t('artist.tracks')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>{albums.length} {t('artist.albums')}</span>
              </div>
              {totalPlays > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <span>{totalPlays} {t('artist.totalPlays')}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handlePlayAll}
                className="gap-2 bg-primary hover:bg-primary/90"
                disabled={tracks.length === 0}
              >
                <Play className="w-4 h-4" />
                {t('artist.playAll')}
              </Button>
              <Button
                onClick={handleShuffle}
                variant="outline"
                className="gap-2"
                disabled={tracks.length === 0}
              >
                <Shuffle className="w-4 h-4" />
                {t('artist.shuffle')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Albums Section */}
      {albums.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">{t('artist.allAlbums')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((album) => (
              <Link key={album.id} to={`/albums/${album.id}`}>
                <Card className="cursor-pointer hover:bg-card/80 transition-colors overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 relative overflow-hidden">
                    {album.album_cover_url ? (
                      <img
                        src={album.album_cover_url}
                        alt={album.album_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-16 h-16 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold truncate">{album.album_title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(album.album_release_date).getFullYear()}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Playlists Section */}
      {playlists.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">{t('artist.allPlaylists')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map((playlist) => (
              <Link key={playlist.id} to={`/playlists/${playlist.id}`}>
                <Card className="cursor-pointer hover:bg-card/80 transition-colors overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 relative overflow-hidden">
                    {playlist.playlist_cover_url ? (
                      <img
                        src={playlist.playlist_cover_url}
                        alt={playlist.playlist_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-16 h-16 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold truncate">{playlist.playlist_title}</h3>
                    {playlist.playlist_description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {playlist.playlist_description}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Tracks List */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">{t('artist.allTracks')}</h2>
        
        {tracks.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('artist.emptyTracks')}</p>
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
                    <p className="text-sm text-muted-foreground truncate">
                      {track.album?.album_title || t('artist.noAlbum')}
                    </p>
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

export default ArtistDetail;

