import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, TrendingUp, Music, Library, ListMusic, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { toast } from "sonner";
import type { Track } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { playTrack, setPlaylist } = usePlayer();
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalPlaylists: 0,
    recentListens: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [tracksRes, playlistsRes, listensRes] = await Promise.all([
        supabase.from("tracks").select("id", { count: "exact", head: true }),
        supabase.from("playlists").select("id", { count: "exact", head: true }),
        supabase
          .from("listening_history")
          .select("id", { count: "exact", head: true })
          .gte("listened_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalSongs: tracksRes.count || 0,
        totalPlaylists: playlistsRes.count || 0,
        recentListens: listensRes.count || 0,
      });
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleStartListening = async () => {
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

      if (!data || data.length === 0) {
        toast.info(t("index.noTracks"));
        return;
      }

      const transformedTracks: Track[] = (data || []).map(track => ({
        ...track,
        genres: track.genres.map(tg => tg.genre)
      }));

      setPlaylist(transformedTracks);
      if (transformedTracks.length > 0) {
        playTrack(transformedTracks[0]);
        toast.success(t("index.startingPlayback").replace("{count}", transformedTracks.length.toString()));
      }
    } catch (error: any) {
      toast.error(t("index.errorLoading") + ": " + error.message);
    }
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden h-[500px] animate-fade-in bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(253,224,71,0.2),transparent_70%)]"></div>
        
        {/* Верхняя часть с контентом */}
        <div className="relative z-10 flex-1 flex items-center justify-center text-center p-8 md:p-12">
          <div>
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-2xl shadow-primary/50">
                  <Music className="w-12 h-12 text-black" />
                </div>
                <div className="absolute -top-2 -right-2 text-4xl">👑</div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t("index.hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t("index.hero.subtitle")}
            </p>
          </div>
        </div>
        
        {/* Нижняя часть с кнопками */}
        <div className="relative z-10 pb-8 md:pb-12 px-8 md:px-12">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={handleStartListening}
            >
              <Play className="w-5 h-5" />
              {t("index.startListening")}
            </Button>
            <div className="relative">
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 border-border bg-card/50 backdrop-blur"
                onClick={() => {
                  toast.info(t("upload.createAlbumFirst"));
                  navigate("/library");
                }}
              >
                <Upload className="w-5 h-5" />
                {t("index.uploadTracks")}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Градиент внизу */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("index.totalTracks")}</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {loadingStats ? "..." : stats.totalSongs}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("index.totalPlaylists")}</p>
              <p className="text-3xl font-bold text-secondary mt-1">
                {loadingStats ? "..." : stats.totalPlaylists}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <ListMusic className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("index.weeklyListens")}</p>
              <p className="text-3xl font-bold text-accent mt-1">
                {loadingStats ? "..." : stats.recentListens}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-8 bg-card/50 backdrop-blur border-border/50">
        <h2 className="text-2xl font-bold mb-6">{t("index.quickActions")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-20 justify-start gap-4 hover:bg-primary/5 hover:border-primary/30 transition-all"
            onClick={() => navigate("/library")}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Library className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{t("index.library")}</p>
              <p className="text-sm text-muted-foreground">{t("index.allTracks")}</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-20 justify-start gap-4 hover:bg-secondary/5 hover:border-secondary/30 transition-all"
            onClick={() => navigate("/playlists")}
          >
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <ListMusic className="w-5 h-5 text-secondary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{t("index.playlists")}</p>
              <p className="text-sm text-muted-foreground">{t("index.createPlaylist")}</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-20 justify-start gap-4 hover:bg-accent/5 hover:border-accent/30 transition-all"
            onClick={() => {
              toast.info(t("upload.createAlbumFirst"));
              navigate("/library");
            }}
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{t("index.uploadMusic")}</p>
              <p className="text-sm text-muted-foreground">{t("index.uploadTracks")}</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-20 justify-start gap-4 hover:bg-primary/5 hover:border-primary/30 transition-all"
            onClick={() => navigate("/profile")}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{t("index.profile")}</p>
              <p className="text-sm text-muted-foreground">{t("index.settings")}</p>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Index;
