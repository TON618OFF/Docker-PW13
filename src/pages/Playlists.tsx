import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListMusic, Plus, Music, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import CreatePlaylistDialog from "@/components/CreatePlaylistDialog";
import AddSongToPlaylistDialog from "@/components/AddSongToPlaylistDialog";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_url: string | null;
  created_at: string;
  song_count?: number;
}

const Playlists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get song counts
      const playlistsWithCounts = await Promise.all(
        (data || []).map(async (playlist) => {
          const { count } = await supabase
            .from("playlist_songs")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id);

          return { ...playlist, song_count: count || 0 };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (error: any) {
      toast.error("Ошибка загрузки плейлистов");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Плейлисты</h1>
          <p className="text-muted-foreground">{playlists.length} плейлистов</p>
        </div>
        <CreatePlaylistDialog onPlaylistCreated={fetchPlaylists} />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
        </div>
      ) : playlists.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 backdrop-blur">
          <ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Нет плейлистов</h3>
          <p className="text-muted-foreground mb-6">
            Создайте свой первый плейлист
          </p>
          <CreatePlaylistDialog onPlaylistCreated={fetchPlaylists} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <Card
              key={playlist.id}
              className="group cursor-pointer hover:bg-card/80 transition-all overflow-hidden"
            >
              <div className="aspect-square bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 relative overflow-hidden">
                {playlist.cover_url ? (
                  <img
                    src={playlist.cover_url}
                    alt={playlist.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-20 h-20 text-primary/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg truncate">{playlist.name}</h3>
                  {playlist.is_public ? (
                    <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>

                {playlist.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {playlist.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    {playlist.song_count} {playlist.song_count === 1 ? "трек" : "треков"}
                  </p>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AddSongToPlaylistDialog 
                      playlistId={playlist.id}
                      playlistName={playlist.name}
                      onSongAdded={fetchPlaylists}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                    >
                      Открыть
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists;
