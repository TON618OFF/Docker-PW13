import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Play, Clock, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import UploadTrackDialog from "@/components/UploadTrackDialog";
import ArtistsAlbumsManager from "@/components/ArtistsAlbumsManager";
import AlbumsManager from "@/components/AlbumsManager";
import AudioTest from "@/components/AudioTest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Track } from "@/types";

const Library = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { playTrack, setPlaylist } = usePlayer();

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from("tracks")
        .select(`
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
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Преобразуем данные для удобства использования
      const transformedTracks = (data || []).map(track => ({
        ...track,
        genres: track.genres.map(tg => tg.genre)
      }));
      
      setTracks(transformedTracks);
      setPlaylist(transformedTracks);
    } catch (error: any) {
      toast.error("Ошибка загрузки библиотеки");
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
    console.log('Playing track:', track);
    console.log('Track audio URL:', track.track_audio_url);
    playTrack(track);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Библиотека</h1>
          <p className="text-muted-foreground">{tracks.length} треков</p>
        </div>
        <UploadTrackDialog onTrackUploaded={fetchTracks} />
      </div>

        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tracks">Треки</TabsTrigger>
            <TabsTrigger value="artists-albums">Артисты и альбомы</TabsTrigger>
            <TabsTrigger value="albums">Альбомы</TabsTrigger>
            <TabsTrigger value="test">Тест аудио</TabsTrigger>
          </TabsList>
        
        <TabsContent value="tracks" className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или исполнителю..."
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
          <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? "Треки не найдены" : "Библиотека пуста"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Попробуйте изменить запрос"
              : "Загрузите свои первые треки"}
          </p>
          {!searchQuery && (
                <UploadTrackDialog onTrackUploaded={fetchTracks} />
          )}
        </Card>
      ) : (
            <div className="space-y-2">
              {filteredTracks.map((track, index) => (
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
                        {track.album.artist.artist_name} • {track.album.album_title}
                      </p>
                      {track.genres.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {track.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre.id}
                              className="text-xs bg-secondary/50 px-2 py-1 rounded-full"
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
                      {track.track_play_count} прослушиваний
                    </div>
              </div>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>

        <TabsContent value="artists-albums">
          <ArtistsAlbumsManager />
        </TabsContent>

        <TabsContent value="albums">
          <AlbumsManager />
        </TabsContent>

        <TabsContent value="test">
          <AudioTest />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;
