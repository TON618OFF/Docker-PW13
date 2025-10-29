import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Clock, Music, Download } from "lucide-react";
import { toast } from "sonner";

const Analytics = () => {
  const [stats, setStats] = useState({
    totalListens: 0,
    totalDurationMinutes: 0,
    avgTrackDuration: 0,
    totalTracks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Получаем начало текущих суток
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Получаем историю прослушиваний с информацией о треках
      // Для totalDurationMinutes - только за сегодня
      // Для остальной статистики - все прослушивания
      const [todayData, allData] = await Promise.all([
        supabase
          .from("listening_history")
          .select(`
            duration_played,
            track:tracks(
              id,
              track_duration
            )
          `)
          .eq("user_id", user.id)
          .gte("listened_at", todayISO),
        supabase
          .from("listening_history")
          .select(`
            duration_played,
            track:tracks(
              id,
              track_duration
            )
          `)
          .eq("user_id", user.id)
      ]);

      if (todayData.error) throw todayData.error;
      if (allData.error) throw allData.error;

      // Суточное время прослушивания (только за сегодня)
      const totalDurationSeconds = todayData.data?.reduce((acc, curr) => acc + (curr.duration_played || 0), 0) || 0;
      const totalDurationMinutes = Math.floor(totalDurationSeconds / 60);

      // Общая статистика (за все время)
      const historyData = allData.data;
      const totalListens = historyData?.length || 0;
      
      // Подсчитываем среднюю длительность треков
      const trackDurations = historyData
        ?.filter(item => item.track?.track_duration)
        .map(item => item.track.track_duration) || [];
      
      const avgTrackDuration = trackDurations.length > 0
        ? Math.floor(trackDurations.reduce((acc, curr) => acc + curr, 0) / trackDurations.length)
        : 0;

      // Подсчитываем количество уникальных треков
      const uniqueTrackIds = new Set(historyData?.map(item => item.track?.id).filter(Boolean));
      const totalTracks = uniqueTrackIds.size;

      setStats({
        totalListens,
        totalDurationMinutes,
        avgTrackDuration,
        totalTracks,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Ошибка загрузки аналитики");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}ч ${mins}м`;
    if (mins > 0) return `${mins}м ${secs}с`;
    return `${secs}с`;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    // Если больше 60 минут (1 часа), показываем в часах
    if (hours > 0) return `${hours}ч ${mins}м`;
    // Если меньше часа, показываем только минуты
    return `${mins}м`;
  };

  const exportToCSV = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: historyData, error } = await supabase
        .from("listening_history")
        .select(`
          listened_at,
          duration_played,
          track:tracks(
            track_title,
            track_duration,
            album:albums(
              album_title,
              artist:artists(artist_name)
            )
          )
        `)
        .eq("user_id", user.id)
        .order("listened_at", { ascending: false });

      if (error) throw error;

      const csvHeaders = ["Дата", "Трек", "Исполнитель", "Альбом", "Длительность трека", "Прослушано секунд"];
      const csvRows = historyData?.map(item => [
        new Date(item.listened_at).toLocaleString("ru-RU"),
        item.track?.track_title || "Неизвестно",
        item.track?.album?.artist?.artist_name || "Неизвестно",
        item.track?.album?.album_title || "Неизвестно",
        formatDuration(item.track?.track_duration || 0),
        item.duration_played || 0
      ]) || [];

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Данные экспортированы в CSV");
    } catch (error: any) {
      toast.error(`Ошибка экспорта: ${error.message}`);
    }
  };

  const exportToPDF = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Используем jsPDF для создания PDF
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      // Используем английский текст для избежания проблем с кодировкой
      // Для кириллицы можно использовать библиотеку jspdf-autotable или другой подход

      doc.setFontSize(20);
      doc.text("Listening Analytics Report", 14, 22);

      // Добавляем статистику
      doc.setFontSize(12);
      let yPos = 35;
      doc.text(`Total listens: ${stats.totalListens}`, 14, yPos);
      yPos += 10;
      doc.text(`Total listening time: ${formatMinutes(stats.totalDurationMinutes)}`, 14, yPos);
      yPos += 10;
      doc.text(`Tracks listened: ${stats.totalTracks}`, 14, yPos);
      yPos += 10;
      doc.text(`Avg track duration: ${formatDuration(stats.avgTrackDuration)}`, 14, yPos);
      yPos += 15;

      // Добавляем таблицу истории
      doc.setFontSize(14);
      doc.text("Listening History", 14, yPos);
      yPos += 10;

      const { data: historyData, error } = await supabase
        .from("listening_history")
        .select(`
          listened_at,
          duration_played,
          track:tracks(
            track_title,
            track_duration,
            album:albums(
              album_title,
              artist:artists(artist_name)
            )
          )
        `)
        .eq("user_id", user.id)
        .order("listened_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      doc.setFontSize(9);
      historyData?.forEach((item) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        // Используем английскую локаль для даты и времени
        const date = new Date(item.listened_at).toLocaleDateString("en-US");
        const time = new Date(item.listened_at).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
        const trackName = item.track?.track_title || "Unknown";
        const artistName = item.track?.album?.artist?.artist_name || "Unknown";
        const albumName = item.track?.album?.album_title || "Unknown";
        const duration = formatDuration(item.duration_played || 0);
        
        // Формируем строки с ограничением длины
        const dateTime = `${date} ${time}`;
        const trackLine = `Track: ${trackName.length > 50 ? trackName.substring(0, 50) + '...' : trackName}`;
        const artistLine = `Artist: ${artistName.length > 40 ? artistName.substring(0, 40) + '...' : artistName}`;
        const albumLine = `Album: ${albumName.length > 40 ? albumName.substring(0, 40) + '...' : albumName}`;
        const durationLine = `Duration: ${duration}`;
        
        // Разбиваем длинные строки если нужно
        const lines = [
          dateTime,
          ...doc.splitTextToSize(trackLine, 180),
          ...doc.splitTextToSize(artistLine, 180),
          ...doc.splitTextToSize(albumLine, 180),
          durationLine
        ];
        
        lines.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 14, yPos);
          yPos += 5;
        });
        
        yPos += 3; // Отступ между записями
      });

      doc.save(`analytics_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Данные экспортированы в PDF");
    } catch (error: any) {
      toast.error(`Ошибка экспорта: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Аналитика</h1>
          <p className="text-muted-foreground">Статистика ваших прослушиваний</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Экспорт CSV
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Экспорт PDF
          </Button>
        </div>
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
          <p className="text-3xl font-bold text-secondary">{formatMinutes(stats.totalDurationMinutes)}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-accent" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Прослушано треков</p>
          <p className="text-3xl font-bold text-accent">{stats.totalTracks}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-muted/10 to-muted/5 border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Средняя длительность трека</p>
          <p className="text-3xl font-bold">{formatDuration(stats.avgTrackDuration)}</p>
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
