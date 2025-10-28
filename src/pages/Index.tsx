import { useEffect, useState } from "react";
import { Play, TrendingUp, Music } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-music.jpg";

const Index = () => {
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalPlaylists: 0,
    recentListens: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const [songsRes, playlistsRes, listensRes] = await Promise.all([
        supabase.from("songs").select("id", { count: "exact", head: true }),
        supabase
          .from("playlists")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("listen_history")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("listened_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalSongs: songsRes.count || 0,
        totalPlaylists: playlistsRes.count || 0,
        recentListens: listensRes.count || 0,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden h-[400px] animate-fade-in">
        <img
          src={heroImage}
          alt="Music Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end p-8 md:p-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Ваша музыка.<br />Всегда с вами.
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
            Загружайте треки, создавайте плейлисты, анализируйте статистику прослушиваний.
            Полнофункциональный музыкальный плеер с защищённой базой данных.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Play className="w-5 h-5" />
              Начать слушать
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-border bg-card/50 backdrop-blur">
              <Music className="w-5 h-5" />
              Загрузить треки
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Всего треков</p>
              <p className="text-3xl font-bold text-primary mt-1">{stats.totalSongs}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Плейлистов</p>
              <p className="text-3xl font-bold text-secondary mt-1">{stats.totalPlaylists}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Play className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Прослушиваний за неделю</p>
              <p className="text-3xl font-bold text-accent mt-1">{stats.recentListens}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-8 bg-card/50 backdrop-blur border-border/50">
        <h2 className="text-2xl font-bold mb-6">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-20 justify-start gap-4 hover:bg-primary/5 hover:border-primary/30"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Библиотека</p>
              <p className="text-sm text-muted-foreground">Все ваши треки</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-20 justify-start gap-4 hover:bg-secondary/5 hover:border-secondary/30"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-secondary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Плейлисты</p>
              <p className="text-sm text-muted-foreground">Создайте подборку</p>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Index;
