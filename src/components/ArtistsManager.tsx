import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Search, Trash2 } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useTranslation } from "@/hooks/useTranslation";

interface Artist {
  id: string;
  artist_name: string;
  artist_bio: string | null;
  artist_image_url: string | null;
  genre: string | null;
  created_at: string;
  isOwner?: boolean;
}

const ArtistsManager = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const initUser = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    initUser();
    fetchArtists();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchArtists();
    }
  }, [currentUserId]);

  const fetchArtists = async () => {
    try {
      const { data: artistsResult, error } = await supabase
        .from("artists")
        .select("*")
        .order("artist_name");

      if (error) throw error;

      if (artistsResult) {
        // Получаем треки для определения владельца артистов
        if (currentUserId) {
          const { data: tracksData } = await supabase
            .from("tracks")
            .select("album_id, uploaded_by")
            .eq("uploaded_by", currentUserId);
          
          const userAlbumIds = new Set((tracksData || []).map(t => t.album_id));
          
          // Получаем артистов, связанных с альбомами пользователя
          const { data: userArtists } = await supabase
            .from("albums")
            .select("artist_id")
            .in("id", Array.from(userAlbumIds));
          
          const userArtistIds = new Set((userArtists || []).map(a => a.artist_id));
          
          const artistsWithOwnership = artistsResult.map(artist => ({
            ...artist,
            isOwner: userArtistIds.has(artist.id)
          }));
          setArtists(artistsWithOwnership);
        } else {
          setArtists(artistsResult);
        }
      }
    } catch (error: any) {
      toast.error(t('artists.manager.empty'));
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter(artist =>
    artist.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteArtist = async (artistId: string) => {
    if (!confirm(t('artists.manager.deleteConfirm'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from("artists")
        .delete()
        .eq("id", artistId);

      if (error) throw error;

      toast.success(t('artists.manager.deleteSuccess'));
      fetchArtists();
    } catch (error: any) {
      toast.error(`Ошибка удаления артиста: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            {t('artists.manager.title')}
          </h2>
          <p className="text-muted-foreground">{artists.length} {t('artists.manager.title')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('artists.manager.infoMessage')}
          </p>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={t('artists.manager.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Список артистов */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
        </div>
      ) : filteredArtists.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 backdrop-blur">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? t('artists.manager.emptySearch') : t('artists.manager.empty')}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t('artists.manager.emptyMessage')}
          </p>
          {!searchQuery && (
            <p className="text-muted-foreground">
              {t('artists.manager.infoMessage')}
            </p>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map((artist) => (
            <Card 
              key={artist.id} 
              className="group hover:bg-card/80 transition-all cursor-pointer"
              onClick={(e) => {
                // Проверяем, что клик не был на кнопку удаления
                const target = e.target as HTMLElement;
                if (!target.closest('button') && !target.closest('[data-action="edit"]')) {
                  navigate(`/artists/${artist.id}`);
                }
              }}
            >
              <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                  {artist.artist_image_url ? (
                    <img
                      src={artist.artist_image_url}
                      alt={artist.artist_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/artists/${artist.id}`);
                      }}
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/artists/${artist.id}`);
                      }}
                    >
                      <User className="w-6 h-6 text-primary/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <CardTitle 
                        className="text-lg truncate hover:text-primary transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/artists/${artist.id}`);
                        }}
                      >
                        {artist.artist_name}
                      </CardTitle>
                      {artist.isOwner && (
                        <div 
                          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteArtist(artist.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {artist.artist_bio && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {artist.artist_bio}
                  </p>
                )}
                {artist.genre && (
                  <span className="inline-block px-2 py-1 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 rounded-full text-xs text-yellow-300 font-medium">
                    {artist.genre}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


export default ArtistsManager;

