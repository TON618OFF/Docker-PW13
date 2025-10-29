import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Music, Search } from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
}

interface AddSongToPlaylistDialogProps {
  playlistId: string;
  playlistName: string;
  onSongAdded?: () => void;
}

const AddSongToPlaylistDialog = ({ playlistId, playlistName, onSongAdded }: AddSongToPlaylistDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSongs, setLoadingSongs] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSongs();
    }
  }, [open]);

  const fetchSongs = async () => {
    setLoadingSongs(true);
    try {
      const { data, error } = await supabase
        .from("tracks")
        .select(`
          id,
          track_title,
          track_duration,
          album:albums(
            album_title,
            artist:artists(artist_name)
          )
        `)
        .eq("is_public", true)
        .order("track_title");

      if (error) throw error;
      
      // Преобразуем данные для удобства
      const transformedSongs = (data || []).map(track => ({
        id: track.id,
        title: track.track_title,
        artist: track.album?.artist?.artist_name || "Неизвестный артист",
        album: track.album?.album_title || null,
        duration: track.track_duration,
      }));
      
      setSongs(transformedSongs);
    } catch (error: any) {
      toast.error(`Ошибка загрузки треков: ${error.message}`);
    } finally {
      setLoadingSongs(false);
    }
  };

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.album && song.album.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSongId) {
      toast.error("Выберите трек");
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Необходимо войти в систему");
        return;
      }

      // Добавляем трек в плейлист
      const { count: existingCount } = await supabase
        .from("playlist_tracks")
        .select("*", { count: "exact", head: true })
        .eq("playlist_id", playlistId)
        .eq("track_id", selectedSongId);

      if (existingCount && existingCount > 0) {
        toast.error("Трек уже добавлен в плейлист");
        return;
      }

      // Получаем максимальный order_position
      const { data: maxOrder } = await supabase
        .from("playlist_tracks")
        .select("order_position")
        .eq("playlist_id", playlistId)
        .order("order_position", { ascending: false })
        .limit(1)
        .single();

      const nextOrder = maxOrder ? maxOrder.order_position + 1 : 1;

      const { error } = await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: playlistId,
          track_id: selectedSongId,
          order_position: nextOrder,
        });

      toast.success("Трек добавлен в плейлист!");
      setSelectedSongId("");
      setSearchQuery("");
      setOpen(false);
      onSongAdded?.();
    } catch (error: any) {
      toast.error(`Ошибка добавления трека: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Добавить трек
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Добавить трек в "{playlistName}"
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Поиск треков</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, исполнителю или альбому..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="song">Выберите трек *</Label>
            {loadingSongs ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Загрузка треков...</p>
              </div>
            ) : (
              <Select value={selectedSongId} onValueChange={setSelectedSongId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите трек для добавления" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredSongs.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchQuery ? "Треки не найдены" : "Нет доступных треков"}
                    </div>
                  ) : (
                    filteredSongs.map((song) => (
                      <SelectItem key={song.id} value={song.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{song.title}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {song.artist}
                              {song.album && ` • ${song.album}`}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground ml-2">
                            {formatDuration(song.duration)}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedSongId}
              className="flex-1"
            >
              {loading ? "Добавление..." : "Добавить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSongToPlaylistDialog;

