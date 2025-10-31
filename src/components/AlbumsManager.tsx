import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Disc, Music, Calendar, Clock, Trash2, Heart } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import CreateAlbumDialog from "./CreateAlbumDialog";
import { useTranslation } from "@/hooks/useTranslation";

interface Album {
  id: string;
  album_title: string;
  album_release_date: string;
  album_cover_url: string | null;
  album_description: string | null;
  artist: {
    id: string;
    artist_name: string;
  };
  track_count: number;
  total_duration: number;
  created_at: string;
  isOwner?: boolean;
}

const AlbumsManager = () => {
  const navigate = useNavigate();
  const { canManageContent } = useRole();
  const { t } = useTranslation();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Array<{id: string, artist_name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [favoriteAlbumIds, setFavoriteAlbumIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initUser = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        setCurrentUserId(user.id);
        fetchFavoriteAlbums(user.id);
      }
    };
    initUser();
    fetchAlbums();
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const { data } = await supabase
        .from("artists")
        .select("id, artist_name")
        .order("artist_name");
      
      if (data) {
        setArtists(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки артистов:", error);
    }
  };

  const fetchFavoriteAlbums = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("favorites_albums")
        .select("album_id")
        .eq("user_id", userId);

      if (data) {
        setFavoriteAlbumIds(new Set(data.map(item => item.album_id)));
      }
    } catch (error) {
      console.error("Ошибка загрузки избранных альбомов:", error);
    }
  };

  const toggleFavoriteAlbum = async (albumId: string) => {
    try {
      const { data, error } = await supabase.rpc("toggle_favorite_album", {
        p_album_id: albumId,
      });

      if (error) throw error;
      
      const newFavorites = new Set(favoriteAlbumIds);
      if (data.action === "added") {
        newFavorites.add(albumId);
      } else {
        newFavorites.delete(albumId);
      }
      setFavoriteAlbumIds(newFavorites);
      
      toast.success(data.action === "added" ? t('albums.manager.favoriteAdded') : t('albums.manager.favoriteRemoved'));
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    }
  };

  const fetchAlbums = async () => {
    try {
      // Проверяем наличие поля created_by
      let includeCreatedBy = false;
      try {
        const testQuery = await supabase.from("albums").select("created_by").limit(0);
        includeCreatedBy = !testQuery.error;
      } catch (e) {
        includeCreatedBy = false;
      }

      // Формируем базовый запрос
      const baseSelect = `
          id,
          album_title,
          album_release_date,
          album_cover_url,
          album_description,
          created_at,
          artist_id,
          artist:artists(
            id,
            artist_name
          )
        `;

      const selectQuery = includeCreatedBy 
        ? baseSelect + `,created_by`
        : baseSelect;

      // Получаем альбомы
      const { data: albumsData, error: albumsError } = await supabase
        .from("albums")
        .select(selectQuery)
        .eq("is_active", true)
        .order("album_title");

      if (albumsError) throw albumsError;

      // Для каждого альбома получаем треки отдельным запросом (чтобы обойти проблемы с RLS при join)
      const transformedAlbums = await Promise.all((albumsData || []).map(async (album: any) => {
        // Получаем треки альбома отдельным запросом
        const { data: tracksData } = await supabase
          .from("tracks")
          .select("id, track_duration, is_public, uploaded_by")
          .eq("album_id", album.id);

        const tracks = tracksData || [];
        const isOwner = currentUserId && (album.created_by === currentUserId);
        
        // Если artist не загрузился через join, загружаем отдельно
        let artist = album.artist;
        if (!artist && album.artist_id) {
          const { data: artistData } = await supabase
            .from("artists")
            .select("id, artist_name")
            .eq("id", album.artist_id)
            .single();
          if (artistData) {
            artist = artistData;
          }
        }
        
        return {
          id: album.id,
          album_title: album.album_title,
          album_release_date: album.album_release_date,
          album_cover_url: album.album_cover_url,
          album_description: album.album_description,
          artist: artist,
          track_count: tracks.length,
          total_duration: tracks.reduce((sum: number, track: any) => sum + (track.track_duration || 0), 0),
          created_at: album.created_at,
          isOwner,
        };
      }));

      setAlbums(transformedAlbums);
    } catch (error: any) {
      toast.error(`Ошибка загрузки альбомов: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlbums = albums.filter(album =>
    album.album_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.artist?.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t('albums.manager.notSpecified');
    try {
      return new Date(dateString).toLocaleDateString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Disc className="w-6 h-6 text-primary" />
              {t('albums.manager.title')}
            </h2>
          <p className="text-muted-foreground">{albums.length} {t('library.albums')}</p>
        </div>
        {canManageContent && (
          <CreateAlbumDialog artists={artists} onAlbumCreated={fetchAlbums} />
        )}
      </div>

      {/* Поиск */}
      <div className="relative">
        <Input
          placeholder={t('albums.manager.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {/* Список альбомов */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
        </div>
      ) : filteredAlbums.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 backdrop-blur">
          <Disc className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? t('albums.manager.emptySearch') : t('albums.manager.empty')}
          </h3>
          <p className="text-muted-foreground">
              {t('albums.manager.emptyMessage')}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlbums.map((album, index) => (
            <Card
              key={album.id}
              className="group cursor-pointer hover:bg-card/80 transition-all overflow-hidden"
              onClick={() => navigate(`/albums/${album.id}`)}
            >
              <div className="aspect-square bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 relative overflow-hidden">
                {album.album_cover_url ? (
                  <img
                    src={album.album_cover_url}
                    alt={album.album_title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc className="w-20 h-20 text-primary/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{album.album_title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {album.artist?.artist_name || t('albums.manager.unknownArtist')}
                    </p>
                  </div>
                  {currentUserId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteAlbum(album.id);
                      }}
                      className="hover:bg-transparent flex-shrink-0"
                    >
                      <Heart 
                        className={`w-5 h-5 ${
                          favoriteAlbumIds.has(album.id) 
                            ? "fill-red-500 text-red-500" 
                            : "text-muted-foreground"
                        }`} 
                      />
                    </Button>
                  )}
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('albums.manager.tracksLabel')}</span>
                    <Badge variant="secondary">{album.track_count}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('albums.manager.durationLabel')}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(album.total_duration)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('albums.manager.releaseLabel')}</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(album.album_release_date)}
                    </div>
                  </div>
                </div>
                {album.isOwner && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(t('albums.manager.deleteConfirm'))) {
                          const { error } = await supabase
                            .from("albums")
                            .delete()
                            .eq("id", album.id);
                          
                          if (error) {
                            toast.error(t('albums.manager.deleteError'));
                          } else {
                            toast.success(t('albums.manager.deleteSuccess'));
                            fetchAlbums();
                          }
                        }
                      }}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.delete')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlbumsManager;
