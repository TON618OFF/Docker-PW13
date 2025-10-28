import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, Music } from "lucide-react";

const Analytics = () => {
  const [stats, setStats] = useState({
    totalListens: 0,
    totalDuration: 0,
    uniqueSongs: 0,
    avgDuration: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("listen_history")
        .select("duration_played, song_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const totalListens = data?.length || 0;
      const totalDuration = data?.reduce((acc, curr) => acc + (curr.duration_played || 0), 0) || 0;
      const uniqueSongs = new Set(data?.map((d) => d.song_id)).size;
      const avgDuration = totalListens > 0 ? Math.floor(totalDuration / totalListens) : 0;

      setStats({
        totalListens,
        totalDuration,
        uniqueSongs,
        avgDuration,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}ч ${mins}м`;
    return `${mins}м`;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Аналитика</h1>
        <p className="text-muted-foreground">Статистика ваших прослушиваний</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Всего прослушиваний</p>
          <p className="text-3xl font-bold text-primary">{stats.totalListens}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Время прослушивания</p>
          <p className="text-3xl font-bold text-secondary">{formatDuration(stats.totalDuration)}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-accent" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Уникальных треков</p>
          <p className="text-3xl font-bold text-accent">{stats.uniqueSongs}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-muted/10 to-muted/5 border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Средняя длительность</p>
          <p className="text-3xl font-bold">{formatDuration(stats.avgDuration)}</p>
        </Card>
      </div>

      <Card className="p-8 bg-card/50 backdrop-blur text-center">
        <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Визуализации в разработке</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Скоро здесь появятся графики по жанрам, времени прослушивания и топ треков
        </p>
      </Card>
    </div>
  );
};

export default Analytics;
