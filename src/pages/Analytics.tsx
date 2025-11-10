import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { BarChart3, TrendingUp, Clock, Music, Download, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalListens: 0,
    totalDurationMinutes: 0,
    avgTrackDuration: 0,
    totalTracks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [genreData, setGenreData] = useState<any[]>([]);
  
  // Фильтры для экспорта
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    genreId: null as string | null,
    artistId: null as string | null,
    albumId: null as string | null,
    completed: null as boolean | null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);

  useEffect(() => {
    fetchFilterData();
    fetchAnalytics(); // Начальная загрузка данных
  }, []);

  // Обновляем данные при изменении фильтров
  useEffect(() => {
    fetchAnalytics();
  }, [filters.startDate, filters.endDate, filters.genreId, filters.artistId, filters.albumId, filters.completed]);

  const fetchFilterData = async () => {
    try {
      const [genresRes, artistsRes] = await Promise.all([
        supabase.from("genres").select("id, genre_name").eq("is_active", true).order("genre_name"),
        supabase.from("artists").select("id, artist_name").order("artist_name"),
      ]);

      if (genresRes.data) setGenres(genresRes.data);
      if (artistsRes.data) setArtists(artistsRes.data);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  const fetchAlbums = async (artistId?: string | null) => {
    try {
      let query = supabase.from("albums").select("id, album_title, artist_id").order("album_title");
      if (artistId) {
        query = query.eq("artist_id", artistId);
      }
      const { data } = await query;
      if (data) setAlbums(data);
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  useEffect(() => {
    fetchAlbums(filters.artistId);
  }, [filters.artistId]);

  // Функция для построения запроса с фильтрами
  const buildFilteredQuery = (baseQuery: any) => {
    let query = baseQuery;

    // Применяем фильтры по дате
    if (filters.startDate) {
      query = query.gte("listened_at", filters.startDate.toISOString());
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte("listened_at", endDate.toISOString());
    }
    if (filters.completed !== null) {
      query = query.eq("completed", filters.completed);
    }

    return query;
  };

  // Функция для получения track_ids по фильтрам
  const getFilteredTrackIds = async (): Promise<string[] | null> => {
    let trackIds: string[] | null = null;

    // Если выбран жанр
    if (filters.genreId) {
      const { data: tracksWithGenre } = await supabase
        .from("track_genres")
        .select("track_id")
        .eq("genre_id", filters.genreId);
      
      if (tracksWithGenre && tracksWithGenre.length > 0) {
        trackIds = tracksWithGenre.map(tg => tg.track_id);
      } else {
        return []; // Нет треков с этим жанром
      }
    }

    // Если выбран артист
    if (filters.artistId) {
      const { data: artistAlbums } = await supabase
        .from("albums")
        .select("id")
        .eq("artist_id", filters.artistId);
      
      if (artistAlbums && artistAlbums.length > 0) {
        const albumIds = artistAlbums.map(a => a.id);
        const { data: tracksFromAlbums } = await supabase
          .from("tracks")
          .select("id")
          .in("album_id", albumIds);
        
        if (tracksFromAlbums && tracksFromAlbums.length > 0) {
          const artistTrackIds = tracksFromAlbums.map(t => t.id);
          // Если уже есть trackIds от жанра, пересекаем их
          if (trackIds) {
            trackIds = trackIds.filter(id => artistTrackIds.includes(id));
          } else {
            trackIds = artistTrackIds;
          }
        } else {
          return []; // Нет треков у этого артиста
        }
      } else {
        return []; // Нет альбомов у этого артиста
      }
    }

    // Если выбран альбом
    if (filters.albumId) {
      const { data: albumTracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("album_id", filters.albumId);
      
      if (albumTracks && albumTracks.length > 0) {
        const albumTrackIds = albumTracks.map(t => t.id);
        // Если уже есть trackIds, пересекаем их
        if (trackIds) {
          trackIds = trackIds.filter(id => albumTrackIds.includes(id));
        } else {
          trackIds = albumTrackIds;
        }
      } else {
        return []; // Нет треков в этом альбоме
      }
    }

    return trackIds;
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Получаем track_ids по фильтрам
      const filteredTrackIds = await getFilteredTrackIds();
      if (filteredTrackIds !== null && filteredTrackIds.length === 0) {
        // Нет данных для выбранных фильтров
        setStats({
          totalListens: 0,
          totalDurationMinutes: 0,
          avgTrackDuration: 0,
          totalTracks: 0,
        });
        setDailyData([]);
        setTopTracks([]);
        setGenreData([]);
        setLoading(false);
        return;
      }

      // Получаем начало текущих суток
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Получаем дату 30 дней назад
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // Базовые запросы
      let todayQuery = supabase
        .from("listening_history")
        .select(`
          duration_played,
          track:tracks(
            id,
            track_duration
          )
        `)
        .eq("user_id", user.id)
        .gte("listened_at", todayISO);

      let allDataQuery = supabase
        .from("listening_history")
        .select(`
          duration_played,
          track:tracks(
            id,
            track_duration
          )
        `)
        .eq("user_id", user.id);

      let chartDataQuery = supabase
        .from("listening_history")
        .select(`
          listened_at,
          duration_played,
          track_id,
          completed,
          track:tracks(
            id,
            track_title,
            track_duration,
            genres:track_genres(
              genre:genres(
                id,
                genre_name
              )
            )
          )
        `, { count: 'exact' })
        .eq("user_id", user.id)
        .order("listened_at", { ascending: false })
        .limit(1000); // Увеличиваем лимит для фильтров

      // Применяем фильтры по track_id
      if (filteredTrackIds !== null) {
        todayQuery = todayQuery.in("track_id", filteredTrackIds);
        allDataQuery = allDataQuery.in("track_id", filteredTrackIds);
        chartDataQuery = chartDataQuery.in("track_id", filteredTrackIds);
      }

      // Применяем остальные фильтры (для todayQuery только completed, так как дата уже ограничена сегодня)
      if (filters.completed !== null) {
        todayQuery = todayQuery.eq("completed", filters.completed);
      }
      allDataQuery = buildFilteredQuery(allDataQuery);
      chartDataQuery = buildFilteredQuery(chartDataQuery);

      // Выполняем запросы
      const [todayData, allData, chartData] = await Promise.all([
        todayQuery,
        allDataQuery,
        chartDataQuery
      ]);

      if (todayData.error) {
        console.error("Today data error:", todayData.error);
        throw todayData.error;
      }
      if (allData.error) {
        console.error("All data error:", allData.error);
        throw allData.error;
      }
      if (chartData.error) {
        console.error("Chart data error:", chartData.error);
        throw chartData.error;
      }

      console.log("Analytics data:", {
        todayCount: todayData.data?.length || 0,
        allCount: allData.data?.length || 0,
        chartCount: chartData.data?.length || 0,
        todayISO,
        thirtyDaysAgoISO,
        userId: user.id
      });


      // Суточное время прослушивания (только за сегодня)
      const totalDurationSeconds = todayData.data?.reduce((acc, curr) => acc + (curr.duration_played || 0), 0) || 0;
      const totalDurationMinutes = Math.floor(totalDurationSeconds / 60);

      // Общая статистика (за все время)
      const historyData = allData.data || [];
      const totalListens = historyData.length;

      // Подсчитываем среднюю длительность треков
      const trackDurations = historyData
        .filter(item => item.track?.track_duration)
        .map(item => item.track.track_duration) || [];

      const avgTrackDuration = trackDurations.length > 0
        ? Math.floor(trackDurations.reduce((acc, curr) => acc + curr, 0) / trackDurations.length)
        : 0;

      // Подсчитываем количество уникальных треков
      const uniqueTrackIds = new Set(historyData.map(item => item.track?.id).filter(Boolean));
      const totalTracks = uniqueTrackIds.size;

      console.log("Stats calculated:", {
        totalListens,
        totalDurationMinutes,
        avgTrackDuration,
        totalTracks,
      });

      setStats({
        totalListens,
        totalDurationMinutes,
        avgTrackDuration,
        totalTracks,
      });

      // Обработка данных для графиков
      const chartDataArray = chartData.data || [];
      if (chartDataArray.length > 0) {
        processChartData(chartDataArray);
      } else {
        // Нет данных для графиков
        setDailyData([]);
        setTopTracks([]);
        setGenreData([]);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error(t('analytics.loadError'));
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

  const processChartData = (data: any[]) => {
    console.log("Processing chart data, items:", data.length);

    if (!data || data.length === 0) {
      console.log("No chart data to process");
      setDailyData([]);
      setTopTracks([]);
      setGenreData([]);
      return;
    }

    // График по дням (последние 30 дней)
    const dailyMap = new Map<string, { listens: number; duration: number }>();

    // Инициализируем все дни последних 30 дней
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      dailyMap.set(dateKey, { listens: 0, duration: 0 });
    }

    // Топ треков
    const trackMap = new Map<string, { title: string; listens: number }>();

    // Жанры
    const genreMap = new Map<string, number>();

    let processedCount = 0;
    data.forEach((item) => {
      if (!item || !item.listened_at) {
        console.warn("Invalid item:", item);
        return;
      }

      const date = new Date(item.listened_at);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", item.listened_at);
        return;
      }

      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];

      if (dailyMap.has(dateKey)) {
        const daily = dailyMap.get(dateKey)!;
        daily.listens += 1;
        daily.duration += item.duration_played || 0;
        processedCount++;
      }

      // Топ треков - используем track_id если track отсутствует
      const trackId = item.track?.id || item.track_id;
      let trackTitle = item.track?.track_title;

      if (!trackTitle && trackId) {
        // Пытаемся загрузить название трека отдельно
        trackTitle = `Track ${trackId.substring(0, 8)}...`;
      }

      if (trackId) {
        const key = trackId;
        if (!trackMap.has(key)) {
          trackMap.set(key, { title: trackTitle || `Unknown Track`, listens: 0 });
        }
        trackMap.get(key)!.listens += 1;
      }

      // Жанры
      if (item.track?.genres && Array.isArray(item.track.genres)) {
        item.track.genres.forEach((tg: any) => {
          if (tg?.genre?.genre_name) {
            const genreName = tg.genre.genre_name;
            genreMap.set(genreName, (genreMap.get(genreName) || 0) + 1);
          }
        });
      }
    });

    console.log("Processed items:", processedCount);
    console.log("Track map size:", trackMap.size);
    console.log("Genre map size:", genreMap.size);

    // Преобразуем данные для графика по дням
    const dailyArray = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US", {
          day: 'numeric',
          month: 'short'
        }),
        listens: data.listens,
        duration: Math.floor(data.duration / 60), // в минутах
      }));

    // Топ 10 треков
    const topTracksArray = Array.from(trackMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.listens - a.listens)
      .slice(0, 10);

    // Топ 10 жанров
    const genreArray = Array.from(genreMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log("Final chart data:", {
      dailyDataLength: dailyArray.length,
      topTracksLength: topTracksArray.length,
      genreDataLength: genreArray.length,
    });

    setDailyData(dailyArray);
    setTopTracks(topTracksArray);
    setGenreData(genreArray);
  };

  // Палитра для графиков - яркие контрастные цвета для белой бумаги
  const COLORS = [
    '#2563eb', // Синий
    '#16a34a', // Зеленый
    '#dc2626', // Красный
    '#ca8a04', // Желтый
    '#7c3aed', // Фиолетовый
    '#0891b2', // Голубой
    '#ea580c', // Оранжевый
    '#be185d', // Розовый
    '#059669', // Изумрудный
    '#9333ea'  // Пурпурный
  ];

  const escapeCSV = (str: string): string => {
    if (!str && str !== '0') return '""';
    // Экранируем кавычки и заменяем переносы строк
    const stringValue = str.toString();
    // Убираем проблемные символы и заменяем переносы строк
    const cleaned = stringValue
      .replace(/"/g, '""')  // Экранируем кавычки
      .replace(/\n/g, ' ')   // Заменяем переносы строк на пробелы
      .replace(/\r/g, '')    // Убираем carriage return
      .replace(/\t/g, ' ');  // Заменяем табы на пробелы
    return `"${cleaned}"`;
  };

  // Создание ASCII графика для CSV
  const createASCIIChart = (
    data: any[],
    valueKey: string,
    labelKey: string,
    maxWidth: number = 50,
    height: number = 10
  ): string[] => {
    if (!data || data.length === 0) return [];

    const lines: string[] = [];
    const maxValue = Math.max(...data.map(item => item[valueKey] || 0));
    if (maxValue === 0) return [];

    // Определяем символы для графика (более темные для лучшей видимости)
    const bars = ['█', '▓', '▒', '░'];

    // Создаем график
    data.forEach((item, index) => {
      const value = item[valueKey] || 0;
      const label = item[labelKey] || '';
      const barLength = Math.round((value / maxValue) * maxWidth);
      const bar = bars[0].repeat(barLength);
      const padding = maxWidth - barLength;
      const spacing = ' '.repeat(Math.max(0, padding));

      // Форматируем строку
      const formattedValue = typeof value === 'number' ? value.toString() : value;
      lines.push(`${label.padEnd(15)}│${bar}${spacing}│ ${formattedValue}`);
    });

    return lines;
  };

  // Создание ASCII горизонтальной гистограммы
  const createASCIIBarChart = (
    data: any[],
    valueKey: string,
    labelKey: string,
    maxWidth: number = 40
  ): string[] => {
    if (!data || data.length === 0) return [];

    const lines: string[] = [];
    const maxValue = Math.max(...data.map(item => item[valueKey] || 0));
    if (maxValue === 0) return [];

    data.forEach((item) => {
      const value = item[valueKey] || 0;
      let label = (item[labelKey] || '').toString().substring(0, 20);
      // Убираем проблемные символы из меток
      label = label.replace(/[,\n\r"]/g, ' ').trim().padEnd(20);
      const barLength = Math.round((value / maxValue) * maxWidth);
      const bar = '█'.repeat(Math.max(1, barLength));
      const formattedValue = typeof value === 'number' ? value.toString() : value;
      // Формируем строку так, чтобы она была одной колонкой в CSV
      lines.push(`${label} ${bar} ${formattedValue}`);
    });

    return lines;
  };

  // Создание ASCII круговой диаграммы (текстовое представление)
  const createASCIIPieChart = (
    data: any[],
    valueKey: string,
    labelKey: string
  ): string[] => {
    if (!data || data.length === 0) return [];

    const lines: string[] = [];
    const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
    if (total === 0) return [];

    const symbols = ['█', '▓', '▒', '░', '▄', '▀', '▌', '▐', '■', '□'];

    data.forEach((item, index) => {
      const value = item[valueKey] || 0;
      let label = (item[labelKey] || '').toString();
      // Убираем проблемные символы из меток
      label = label.replace(/[,\n\r"]/g, ' ').trim().padEnd(20);
      const percentage = ((value / total) * 100).toFixed(1);
      const symbol = symbols[index % symbols.length];
      const barLength = Math.round((value / total) * 30);
      const bar = symbol.repeat(Math.max(1, barLength));

      lines.push(`${symbol} ${label} ${bar} ${percentage}% (${value})`);
    });

    return lines;
  };

  const exportToCSV = async () => {
    try {
      toast.info(t('analytics.exporting') || 'Exporting CSV...');
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Строим запрос с фильтрами
      let query = supabase
        .from("listening_history")
        .select(`
          listened_at,
          duration_played,
          completed,
          track:tracks(
            track_title,
            track_duration,
            album:albums(
              album_title,
              artist:artists(artist_name)
            ),
            genres:track_genres(
              genre:genres(id, genre_name)
            )
          )
        `)
        .eq("user_id", user.id);

      // Применяем фильтры
      if (filters.startDate) {
        query = query.gte("listened_at", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("listened_at", endDate.toISOString());
      }
      if (filters.completed !== null) {
        query = query.eq("completed", filters.completed);
      }

      // Если выбран жанр, фильтруем по трекам с этим жанром
      if (filters.genreId) {
        // Получаем все треки с выбранным жанром
        const { data: tracksWithGenre } = await supabase
          .from("track_genres")
          .select("track_id")
          .eq("genre_id", filters.genreId);
        
        if (tracksWithGenre && tracksWithGenre.length > 0) {
          const trackIds = tracksWithGenre.map(tg => tg.track_id);
          query = query.in("track_id", trackIds);
        } else {
          // Если нет треков с этим жанром, возвращаем пустой результат
          toast.warning(t('analytics.noDataForFilters') || 'No data found for selected filters');
          return;
        }
      }

      // Если выбран артист, фильтруем по альбомам этого артиста
      if (filters.artistId) {
        const { data: artistAlbums } = await supabase
          .from("albums")
          .select("id")
          .eq("artist_id", filters.artistId);
        
        if (artistAlbums && artistAlbums.length > 0) {
          const albumIds = artistAlbums.map(a => a.id);
          // Получаем треки этих альбомов
          const { data: tracksFromAlbums } = await supabase
            .from("tracks")
            .select("id")
            .in("album_id", albumIds);
          
          if (tracksFromAlbums && tracksFromAlbums.length > 0) {
            const trackIds = tracksFromAlbums.map(t => t.id);
            query = query.in("track_id", trackIds);
          } else {
            toast.warning(t('analytics.noDataForFilters') || 'No data found for selected filters');
            return;
          }
        } else {
          toast.warning(t('analytics.noDataForFilters') || 'No data found for selected filters');
          return;
        }
      }

      // Если выбран альбом, фильтруем по трекам этого альбома
      if (filters.albumId) {
        const { data: albumTracks } = await supabase
          .from("tracks")
          .select("id")
          .eq("album_id", filters.albumId);
        
        if (albumTracks && albumTracks.length > 0) {
          const trackIds = albumTracks.map(t => t.id);
          query = query.in("track_id", trackIds);
        } else {
          toast.warning(t('analytics.noDataForFilters') || 'No data found for selected filters');
          return;
        }
      }

      const { data: historyData, error } = await query.order("listened_at", { ascending: false });

      if (error) throw error;

      // Заголовки с правильной кодировкой
      const csvHeaders = [
        t('analytics.csvHeaders.date'),
        t('analytics.csvHeaders.track'),
        t('analytics.csvHeaders.artist'),
        t('analytics.csvHeaders.album'),
        t('analytics.csvHeaders.duration'),
        t('analytics.csvHeaders.played'),
        t('analytics.csvHeaders.completed') || 'Completed'
      ];

      // Форматируем данные
      const csvRows = historyData?.map(item => {
        const date = new Date(item.listened_at);
        const dateStr = date.toLocaleString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US", {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        return [
          dateStr,
          item.track?.track_title || t('analytics.unknown'),
          item.track?.album?.artist?.artist_name || t('analytics.unknown'),
          item.track?.album?.album_title || t('analytics.unknown'),
          formatDuration(item.track?.track_duration || 0),
          formatDuration(item.duration_played || 0),
          item.completed ? (t('common.yes') || 'Yes') : (t('common.no') || 'No')
        ];
      }) || [];

      // Добавляем статистику в начало файла
      const statsSection = [
        ['=== Listening Analytics Report ==='],
        [''],
        [t('analytics.stats.totalListens') || 'Total Listens', stats.totalListens],
        [t('analytics.stats.totalDuration') || 'Total Duration', formatMinutes(stats.totalDurationMinutes)],
        [t('analytics.stats.totalTracks') || 'Total Tracks', stats.totalTracks],
        [t('analytics.stats.avgDuration') || 'Average Duration', formatDuration(stats.avgTrackDuration)],
        [''],
        ['=== Listening History ==='],
        ['']
      ];

      // Данные графиков для экспорта с ASCII визуализацией
      const chartsSection: string[][] = [];

      // График по дням (Daily Listens) - с ASCII визуализацией
      if (dailyData.length > 0) {
        chartsSection.push(['']);
        chartsSection.push(['=== ' + (t('analytics.charts.dailyListens') || 'Daily Listens') + ' ===']);
        chartsSection.push(['']);

        // Таблица данных
        chartsSection.push([
          t('analytics.csvHeaders.date') || 'Date',
          t('analytics.charts.listens') || 'Listens',
          t('analytics.charts.duration') || 'Duration (minutes)'
        ]);
        dailyData.forEach((item) => {
          chartsSection.push([
            item.date || '',
            item.listens?.toString() || '0',
            item.duration?.toString() || '0'
          ]);
        });

        // ASCII график прослушиваний
        chartsSection.push(['']);
        chartsSection.push(['--- ASCII Chart: ' + (t('analytics.charts.listens') || 'Listens') + ' by Day ---']);
        const listensChart = createASCIIBarChart(dailyData, 'listens', 'date', 35);
        if (listensChart.length > 0) {
          listensChart.forEach(line => chartsSection.push([line]));
        }
      }

      // График по дням (Daily Duration) - с ASCII визуализацией
      if (dailyData.length > 0) {
        chartsSection.push(['']);
        chartsSection.push(['=== ' + (t('analytics.charts.dailyDuration') || 'Daily Duration') + ' ===']);
        chartsSection.push(['']);

        // Таблица данных
        chartsSection.push([
          t('analytics.csvHeaders.date') || 'Date',
          t('analytics.charts.duration') || 'Duration (minutes)',
          t('analytics.charts.listens') || 'Listens'
        ]);
        dailyData.forEach((item) => {
          chartsSection.push([
            item.date || '',
            item.duration?.toString() || '0',
            item.listens?.toString() || '0'
          ]);
        });

        // ASCII график длительности
        chartsSection.push(['']);
        chartsSection.push(['--- ASCII Chart: ' + (t('analytics.charts.duration') || 'Duration') + ' by Day ---']);
        const durationChart = createASCIIBarChart(dailyData, 'duration', 'date', 35);
        if (durationChart.length > 0) {
          durationChart.forEach(line => chartsSection.push([line]));
        }
      }

      // Топ треков - с ASCII визуализацией
      if (topTracks.length > 0) {
        chartsSection.push(['']);
        chartsSection.push(['=== ' + (t('analytics.charts.topTracks') || 'Top Tracks') + ' ===']);
        chartsSection.push(['']);

        // Таблица данных
        chartsSection.push([
          t('analytics.csvHeaders.rank') || 'Rank',
          t('analytics.csvHeaders.track') || 'Track',
          t('analytics.charts.listens') || 'Listens'
        ]);
        topTracks.forEach((item, index) => {
          chartsSection.push([
            (index + 1).toString(),
            item.title || t('analytics.unknown') || 'Unknown',
            item.listens?.toString() || '0'
          ]);
        });

        // ASCII график топ треков
        chartsSection.push(['']);
        chartsSection.push(['--- ASCII Chart: Top Tracks ---']);
        const topTracksChart = createASCIIBarChart(
          topTracks.map((item, idx) => ({
            label: `${idx + 1}. ${item.title || 'Unknown'}`,
            value: item.listens || 0
          })),
          'value',
          'label',
          35
        );
        if (topTracksChart.length > 0) {
          topTracksChart.forEach(line => chartsSection.push([line]));
        }
      }

      // График по жанрам - с ASCII визуализацией
      if (genreData.length > 0) {
        chartsSection.push(['']);
        chartsSection.push(['=== ' + (t('analytics.charts.genres') || 'Genres') + ' ===']);
        chartsSection.push(['']);

        // Таблица данных
        chartsSection.push([
          t('analytics.csvHeaders.rank') || 'Rank',
          t('analytics.csvHeaders.genre') || 'Genre',
          t('analytics.charts.count') || 'Count'
        ]);
        genreData.forEach((item, index) => {
          chartsSection.push([
            (index + 1).toString(),
            item.name || t('analytics.unknown') || 'Unknown',
            item.count?.toString() || '0'
          ]);
        });

        // ASCII круговая диаграмма (текстовое представление)
        chartsSection.push(['']);
        chartsSection.push(['--- ASCII Chart: ' + (t('analytics.charts.genres') || 'Genres') + ' Distribution ---']);
        const genreChart = createASCIIPieChart(genreData, 'count', 'name');
        if (genreChart.length > 0) {
          genreChart.forEach(line => chartsSection.push([line]));
        }
      }

      // Формируем CSV с UTF-8 BOM для корректного отображения кириллицы
      try {
        const csvLines = [
          ...statsSection.map(row => row.map(escapeCSV).join(',')),
          csvHeaders.map(escapeCSV).join(','),
          ...csvRows.map(row => row.map(escapeCSV).join(',')),
          ...chartsSection.map(row => {
            // Для ASCII графиков - обрабатываем как одну колонку
            if (row.length === 1) {
              // Если это строка ASCII графика, оборачиваем в кавычки
              const line = row[0] || '';
              // Заменяем кавычки на двойные кавычки для CSV
              return `"${line.replace(/"/g, '""')}"`;
            }
            // Для обычных строк с несколькими колонками
            return row.map(escapeCSV).join(',');
          })
        ].filter(line => line !== null && line !== undefined);

        // Создаем CSV контент с UTF-8 BOM
        const csvText = csvLines.join('\r\n');

        // Создаем Blob с правильной кодировкой UTF-8
        // Используем TextEncoder для гарантированной UTF-8 кодировки
        const encoder = new TextEncoder();
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM в байтах
        const csvBytes = encoder.encode(csvText);
        const blob = new Blob([bom, csvBytes], {
          type: "text/csv;charset=utf-8;"
        });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `analytics_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();

        // Удаляем элемент после небольшой задержки, чтобы браузер успел скачать файл
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } catch (csvError) {
        console.error('CSV generation error:', csvError);
        throw new Error(`Failed to generate CSV: ${csvError instanceof Error ? csvError.message : 'Unknown error'}`);
      }

      toast.success(t('analytics.csvExportSuccess'));
    } catch (error: any) {
      console.error('CSV Export Error:', error);
      const errorMsg = error.message || 'Unknown error';
      toast.error(`${t('analytics.errorExport') || 'Export error'}: ${errorMsg}`);
    }
  };

  const exportToPDF = async () => {
    try {
      toast.info(t('analytics.exporting') || 'Exporting PDF...');
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Создаем скрытый контейнер для рендеринга текста через html2canvas
      const createTextElement = (text: string, fontSize: number = 14, fontWeight: string = 'normal', color: string = '#000000') => {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.left = '-9999px';
        div.style.top = '0';
        div.style.width = `${(pageWidth - 2 * margin) * 3.779527559}px`; // Конвертируем mm в px (1mm = 3.779527559px)
        div.style.fontSize = `${fontSize}pt`;
        div.style.fontWeight = fontWeight;
        div.style.color = color;
        div.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        div.style.lineHeight = '1.5';
        div.style.whiteSpace = 'pre-wrap';
        div.style.background = '#ffffff';
        div.style.padding = '10px';
        div.style.border = 'none';
        div.style.boxSizing = 'border-box';
        div.textContent = text;
        document.body.appendChild(div);
        // Ждем рендеринга
        return new Promise<HTMLDivElement>((resolve) => {
          setTimeout(() => resolve(div), 50);
        });
      };

      // Рендерим заголовок через html2canvas
      const title = t('analytics.reportTitle') || 'Listening Analytics Report';
      const titleDiv = await createTextElement(title, 24, 'bold');
      const titleCanvas = await html2canvas(titleDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        width: titleDiv.offsetWidth,
        height: titleDiv.offsetHeight
      });
      const titleImg = titleCanvas.toDataURL('image/png');
      const titleWidth = pageWidth - 2 * margin;
      const titleHeight = (titleCanvas.height * titleWidth) / titleCanvas.width;
      doc.addImage(titleImg, 'PNG', margin, yPos, titleWidth, titleHeight);
      yPos += titleHeight + 10;
      document.body.removeChild(titleDiv);

      // Дата генерации
      const dateStr = new Date().toLocaleString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US");
      const dateText = `${t('analytics.generatedOn') || 'Generated on'}: ${dateStr}`;
      const dateDiv = await createTextElement(dateText, 10, 'normal', '#666666');
      const dateCanvas = await html2canvas(dateDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });
      const dateImg = dateCanvas.toDataURL('image/png');
      const dateHeight = (dateCanvas.height * (pageWidth - 2 * margin)) / dateCanvas.width;
      doc.addImage(dateImg, 'PNG', margin, yPos, pageWidth - 2 * margin, dateHeight);
      yPos += dateHeight + 10;
      document.body.removeChild(dateDiv);

      // Статистика
      const statsTitle = t('analytics.statistics') || 'Statistics';
      const statsTitleDiv = await createTextElement(statsTitle, 16, 'bold');
      const statsTitleCanvas = await html2canvas(statsTitleDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });
      const statsTitleImg = statsTitleCanvas.toDataURL('image/png');
      const statsTitleHeight = (statsTitleCanvas.height * (pageWidth - 2 * margin)) / statsTitleCanvas.width;
      doc.addImage(statsTitleImg, 'PNG', margin, yPos, pageWidth - 2 * margin, statsTitleHeight);
      yPos += statsTitleHeight + 8;
      document.body.removeChild(statsTitleDiv);

      // Статистика данные - рендерим все вместе для оптимизации
      const statsData = [
        `${t('analytics.stats.totalListens') || 'Total Listens'}: ${stats.totalListens}`,
        `${t('analytics.stats.totalDuration') || 'Total Duration'}: ${formatMinutes(stats.totalDurationMinutes)}`,
        `${t('analytics.stats.totalTracks') || 'Total Tracks'}: ${stats.totalTracks}`,
        `${t('analytics.stats.avgDuration') || 'Average Duration'}: ${formatDuration(stats.avgTrackDuration)}`
      ];

      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
      }

      const statsText = statsData.join('\n');
      const statsDiv = await createTextElement(statsText, 11, 'normal');
      const statsCanvas = await html2canvas(statsDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });
      const statsImg = statsCanvas.toDataURL('image/png');
      const statsHeight = (statsCanvas.height * (pageWidth - 2 * margin - 10)) / statsCanvas.width;
      doc.addImage(statsImg, 'PNG', margin + 10, yPos, pageWidth - 2 * margin - 10, statsHeight);
      yPos += statsHeight + 10;
      document.body.removeChild(statsDiv);

      // Экспорт графиков с улучшенными настройками для белой бумаги
      const chartIds = [
        { id: 'chart-daily-listens', title: t('analytics.charts.dailyListens') || 'Daily Listens' },
        { id: 'chart-daily-duration', title: t('analytics.charts.dailyDuration') || 'Daily Duration' },
        { id: 'chart-top-tracks', title: t('analytics.charts.topTracks') || 'Top Tracks' },
        { id: 'chart-genres', title: t('analytics.charts.genres') || 'Genres' }
      ];

      for (const chart of chartIds) {
        const chartElement = document.getElementById(chart.id) ||
          document.querySelector(`[data-chart-id="${chart.id}"]`)?.parentElement;

        if (chartElement && (chartElement as HTMLElement).offsetHeight > 0) {
          if (yPos > pageHeight - 100) {
            doc.addPage();
            yPos = margin;
          }

          try {
            // Создаем копию элемента с белым фоном для экспорта
            const chartClone = chartElement.cloneNode(true) as HTMLElement;
            chartClone.style.position = 'fixed';
            chartClone.style.left = '-9999px';
            chartClone.style.top = '0';
            chartClone.style.backgroundColor = '#ffffff';
            chartClone.style.padding = '20px';
            chartClone.style.border = '1px solid #e0e0e0';
            chartClone.style.borderRadius = '8px';
            chartClone.style.boxShadow = 'none';

            // Принудительно устанавливаем белый фон для всех дочерних элементов
            const allChildren = chartClone.querySelectorAll('*');
            allChildren.forEach((child) => {
              const el = child as HTMLElement;
              // Сохраняем оригинальные стили, но принудительно устанавливаем белый фон
              if (el.style && el.style.backgroundColor && el.style.backgroundColor !== 'transparent') {
                // Если фон не прозрачный, оставляем как есть, но улучшаем контраст
              }
              // Улучшаем читаемость текста
              if (el.style && el.style.color) {
                // Если цвет темный, делаем его более контрастным
                const color = el.style.color;
                if (color.includes('muted') || color.includes('gray') || color.includes('grey')) {
                  el.style.color = '#333333';
                }
              }
            });

            document.body.appendChild(chartClone);

            // Ждем рендеринга
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(chartClone, {
              backgroundColor: '#ffffff',
              scale: 3, // Увеличиваем масштаб для лучшего качества
              logging: false,
              useCORS: true,
              allowTaint: true,
              windowWidth: chartClone.scrollWidth,
              windowHeight: chartClone.scrollHeight,
              onclone: (clonedDoc) => {
                // Улучшаем стили в клонированном документе для лучшей читаемости
                const clonedElement = clonedDoc.getElementById(chart.id) ||
                  clonedDoc.querySelector(`[data-chart-id="${chart.id}"]`)?.parentElement as HTMLElement;

                if (clonedElement) {
                  // Устанавливаем белый фон и черный текст
                  clonedElement.style.backgroundColor = '#ffffff';
                  clonedElement.style.color = '#000000';

                  // Улучшаем все SVG текстовые элементы (Recharts использует SVG)
                  const textElements = clonedElement.querySelectorAll('text, tspan');
                  textElements.forEach((el) => {
                    const svgEl = el as SVGElement;
                    const currentFill = svgEl.getAttribute('fill') || svgEl.style.fill;

                    // Делаем все тексты черными или темно-серыми для лучшей читаемости
                    if (!currentFill || currentFill === 'none' ||
                      currentFill === '#666' || currentFill === '#999' ||
                      currentFill === 'rgba(0,0,0,0.45)' || currentFill.includes('muted')) {
                      svgEl.setAttribute('fill', '#000000');
                      svgEl.style.fill = '#000000';
                    } else if (currentFill !== '#000000' && currentFill !== '#000') {
                      // Если цвет не черный, делаем его темнее для контраста
                      svgEl.setAttribute('fill', '#333333');
                      svgEl.style.fill = '#333333';
                    }

                    // Увеличиваем размер шрифта если он слишком маленький
                    const fontSize = svgEl.getAttribute('font-size') || svgEl.style.fontSize;
                    if (fontSize && parseInt(fontSize) < 12) {
                      svgEl.setAttribute('font-size', '12');
                      svgEl.style.fontSize = '12px';
                    }

                    // Делаем текст жирнее для лучшей читаемости
                    svgEl.setAttribute('font-weight', '500');
                    svgEl.style.fontWeight = '500';
                  });

                  // Улучшаем линии и границы для лучшей видимости
                  const lineElements = clonedElement.querySelectorAll('line, path');
                  lineElements.forEach((el) => {
                    const svgEl = el as SVGElement;
                    const stroke = svgEl.getAttribute('stroke');
                    if (stroke && (stroke === '#e0e0e0' || stroke === '#f0f0f0' || stroke.includes('muted'))) {
                      svgEl.setAttribute('stroke', '#cccccc');
                      svgEl.style.stroke = '#cccccc';
                    }
                  });

                  // Улучшаем цвета графиков для лучшей видимости на белом фоне
                  const barElements = clonedElement.querySelectorAll('rect, circle, path[fill]');
                  const colorMap: { [key: string]: string } = {
                    '#8884d8': '#2563eb', // Синий
                    '#82ca9d': '#16a34a', // Зеленый
                    '#ffc658': '#ca8a04', // Желтый
                    '#ff7300': '#ea580c', // Оранжевый
                    '#00ff00': '#16a34a', // Зеленый
                    '#0088fe': '#2563eb', // Синий
                    '#00c49f': '#0891b2', // Голубой
                    '#ffbb28': '#ca8a04', // Желтый
                    '#ff8042': '#dc2626', // Красный
                  };

                  barElements.forEach((el) => {
                    const svgEl = el as SVGElement;
                    const fill = svgEl.getAttribute('fill');

                    // Пропускаем элементы сетки и фона
                    if (fill === '#ffffff' || fill === '#f5f5f5' || fill === 'transparent' || fill === 'none') {
                      return;
                    }

                    // Улучшаем цвета для лучшей видимости
                    if (fill && colorMap[fill]) {
                      svgEl.setAttribute('fill', colorMap[fill]);
                    } else if (fill && (fill.includes('rgba') && fill.includes('0.') && parseFloat(fill.split(',')[3] || '1') < 0.5)) {
                      // Если цвет слишком прозрачный, делаем его более насыщенным
                      svgEl.setAttribute('fill', '#2563eb');
                      svgEl.setAttribute('opacity', '1');
                    } else if (fill && fill.length === 7 && fill.startsWith('#')) {
                      // Проверяем яркость цвета
                      const rgb = parseInt(fill.slice(1), 16);
                      const r = (rgb >> 16) & 0xff;
                      const g = (rgb >> 8) & 0xff;
                      const b = rgb & 0xff;
                      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

                      // Если цвет слишком светлый, заменяем на более темный
                      if (brightness > 200) {
                        svgEl.setAttribute('fill', '#2563eb');
                      }
                    }
                  });

                  // Улучшаем сетку для лучшей видимости
                  const gridLines = clonedElement.querySelectorAll('.recharts-cartesian-grid line');
                  gridLines.forEach((el) => {
                    const svgEl = el as SVGElement;
                    const stroke = svgEl.getAttribute('stroke');
                    if (stroke && (stroke === '#e0e0e0' || stroke === '#f0f0f0' || stroke === '#e5e5e5')) {
                      svgEl.setAttribute('stroke', '#d0d0d0');
                      svgEl.setAttribute('stroke-width', '1');
                    }
                  });
                }
              }
            });

            document.body.removeChild(chartClone);

            const imgData = canvas.toDataURL('image/png'); // PNG формат с хорошим качеством
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (yPos + imgHeight > pageHeight - margin) {
              doc.addPage();
              yPos = margin;
            }

            // Заголовок графика через html2canvas
            const chartTitleDiv = await createTextElement(chart.title, 14, 'bold');
            const chartTitleCanvas = await html2canvas(chartTitleDiv, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false
            });
            const chartTitleImg = chartTitleCanvas.toDataURL('image/png');
            const chartTitleHeight = (chartTitleCanvas.height * (pageWidth - 2 * margin)) / chartTitleCanvas.width;
            if (yPos + chartTitleHeight > pageHeight - margin) {
              doc.addPage();
              yPos = margin;
            }
            doc.addImage(chartTitleImg, 'PNG', margin, yPos, pageWidth - 2 * margin, chartTitleHeight);
            yPos += chartTitleHeight + 5;
            document.body.removeChild(chartTitleDiv);

            // Изображение графика
            doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 10;
          } catch (error) {
            console.warn(`Failed to export chart ${chart.id}:`, error);
          }
        }
      }

      // История прослушиваний
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      const historyTitle = t('analytics.listeningHistory') || 'Listening History';
      const historyTitleDiv = await createTextElement(historyTitle, 16, 'bold');
      const historyTitleCanvas = await html2canvas(historyTitleDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });
      const historyTitleImg = historyTitleCanvas.toDataURL('image/png');
      const historyTitleHeight = (historyTitleCanvas.height * (pageWidth - 2 * margin)) / historyTitleCanvas.width;
      doc.addImage(historyTitleImg, 'PNG', margin, yPos, pageWidth - 2 * margin, historyTitleHeight);
      yPos += historyTitleHeight + 8;
      document.body.removeChild(historyTitleDiv);

      // Строим запрос с фильтрами (аналогично exportToCSV)
      let query = supabase
        .from("listening_history")
        .select(`
          listened_at,
          duration_played,
          completed,
          track:tracks(
            track_title,
            track_duration,
            album:albums(
              album_title,
              artist:artists(artist_name)
            )
          )
        `)
        .eq("user_id", user.id);

      // Применяем фильтры
      if (filters.startDate) {
        query = query.gte("listened_at", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("listened_at", endDate.toISOString());
      }
      if (filters.completed !== null) {
        query = query.eq("completed", filters.completed);
      }

      // Если выбран жанр
      if (filters.genreId) {
        const { data: tracksWithGenre } = await supabase
          .from("track_genres")
          .select("track_id")
          .eq("genre_id", filters.genreId);
        
        if (tracksWithGenre && tracksWithGenre.length > 0) {
          const trackIds = tracksWithGenre.map(tg => tg.track_id);
          query = query.in("track_id", trackIds);
        } else {
          toast.warning(t('analytics.noDataForFilters') || 'No data found for selected filters');
          return;
        }
      }

      // Если выбран артист
      if (filters.artistId) {
        const { data: artistAlbums } = await supabase
          .from("albums")
          .select("id")
          .eq("artist_id", filters.artistId);
        
        if (artistAlbums && artistAlbums.length > 0) {
          const albumIds = artistAlbums.map(a => a.id);
          const { data: tracksFromAlbums } = await supabase
            .from("tracks")
            .select("id")
            .in("album_id", albumIds);
          
          if (tracksFromAlbums && tracksFromAlbums.length > 0) {
            const trackIds = tracksFromAlbums.map(t => t.id);
            query = query.in("track_id", trackIds);
          } else {
            toast.warning(t('analytics.noDataForFilters') || 'No data found for selected filters');
            return;
          }
        } else {
          toast.warning(t('analytics.noDataForFilters') || 'No data found for selected filters');
          return;
        }
      }

      // Если выбран альбом
      if (filters.albumId) {
        const { data: albumTracks } = await supabase
          .from("tracks")
          .select("id")
          .eq("album_id", filters.albumId);
        
        if (albumTracks && albumTracks.length > 0) {
          const trackIds = albumTracks.map(t => t.id);
          query = query.in("track_id", trackIds);
        } else {
          toast.warning(t('analytics.noDataForFilters') || 'No data found for selected filters');
          return;
        }
      }

      const { data: historyData, error } = await query.order("listened_at", { ascending: false }).limit(100);

      if (error) throw error;

      // Рендерим историю через html2canvas для поддержки кириллицы
      // Группируем записи для оптимизации (по 10 записей на изображение)
      const itemsPerGroup = 10;
      for (let i = 0; i < (historyData?.length || 0); i += itemsPerGroup) {
        const group = historyData?.slice(i, i + itemsPerGroup) || [];

        if (yPos > pageHeight - 100) {
          doc.addPage();
          yPos = margin;
        }

        const historyLines = group.map((item, idx) => {
          const date = new Date(item.listened_at);
          const dateStr = date.toLocaleString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });

          const trackName = item.track?.track_title || t('analytics.unknown') || 'Unknown';
          const artistName = item.track?.album?.artist?.artist_name || t('analytics.unknown') || 'Unknown';
          const albumName = item.track?.album?.album_title || t('analytics.unknown') || 'Unknown';
          const duration = formatDuration(item.duration_played || 0);
          const completed = item.completed ? (t('common.yes') || 'Yes') : (t('common.no') || 'No');

          return [
            `${i + idx + 1}. ${t('analytics.csvHeaders.date') || 'Date'}: ${dateStr}`,
            `   ${t('analytics.csvHeaders.track') || 'Track'}: ${trackName}`,
            `   ${t('analytics.csvHeaders.artist') || 'Artist'}: ${artistName}`,
            `   ${t('analytics.csvHeaders.album') || 'Album'}: ${albumName}`,
            `   ${t('analytics.csvHeaders.played') || 'Played'}: ${duration} | ${t('analytics.csvHeaders.completed') || 'Completed'}: ${completed}`
          ].join('\n');
        });

        const historyText = historyLines.join('\n\n');
        const historyDiv = await createTextElement(historyText, 9, 'normal');
        const historyCanvas = await html2canvas(historyDiv, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          width: historyDiv.offsetWidth
        });
        const historyImg = historyCanvas.toDataURL('image/png');
        const historyHeight = (historyCanvas.height * (pageWidth - 2 * margin - 10)) / historyCanvas.width;

        if (yPos + historyHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }

        doc.addImage(historyImg, 'PNG', margin, yPos, pageWidth - 2 * margin, historyHeight);
        yPos += historyHeight + 10;
        document.body.removeChild(historyDiv);
      }

      // Футер
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`analytics_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(t('analytics.pdfExportSuccess'));
    } catch (error: any) {
      console.error('PDF Export Error:', error);
      const errorMsg = error.message || 'Unknown error';
      toast.error(`${t('analytics.errorExport') || 'Export error'}: ${errorMsg}`);
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
          <h1 className="text-3xl font-bold mb-2">{t('analytics.title')}</h1>
          <p className="text-muted-foreground">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant={showFilters ? "default" : "outline"} 
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('analytics.filters') || 'Filters'}
            {(filters.startDate || filters.endDate || filters.genreId || filters.artistId || filters.albumId || filters.completed !== null) && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {[
                  filters.startDate ? 1 : 0,
                  filters.endDate ? 1 : 0,
                  filters.genreId ? 1 : 0,
                  filters.artistId ? 1 : 0,
                  filters.albumId ? 1 : 0,
                  filters.completed !== null ? 1 : 0
                ].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {t('analytics.exportCSV')}
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {t('analytics.exportPDF')}
          </Button>
        </div>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('analytics.filters') || 'Filters'}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Фильтр по дате начала */}
            <div className="space-y-2">
              <Label>{t('analytics.filterStartDate') || 'Start Date'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "PPP", { locale: ru }) : (
                      <span>{t('analytics.selectDate') || 'Select date'}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate || undefined}
                    onSelect={(date) => setFilters({ ...filters, startDate: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Фильтр по дате конца */}
            <div className="space-y-2">
              <Label>{t('analytics.filterEndDate') || 'End Date'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "PPP", { locale: ru }) : (
                      <span>{t('analytics.selectDate') || 'Select date'}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate || undefined}
                    onSelect={(date) => setFilters({ ...filters, endDate: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Фильтр по жанру */}
            <div className="space-y-2">
              <Label>{t('analytics.filterGenre') || 'Genre'}</Label>
              <Select
                value={filters.genreId || "all"}
                onValueChange={(value) => setFilters({ ...filters, genreId: value === "all" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('analytics.allGenres') || 'All genres'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('analytics.allGenres') || 'All genres'}</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {genre.genre_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Фильтр по исполнителю */}
            <div className="space-y-2">
              <Label>{t('analytics.filterArtist') || 'Artist'}</Label>
              <Select
                value={filters.artistId || "all"}
                onValueChange={(value) => {
                  setFilters({ ...filters, artistId: value === "all" ? null : value, albumId: null });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('analytics.allArtists') || 'All artists'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('analytics.allArtists') || 'All artists'}</SelectItem>
                  {artists.map((artist) => (
                    <SelectItem key={artist.id} value={artist.id}>
                      {artist.artist_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Фильтр по альбому */}
            <div className="space-y-2">
              <Label>{t('analytics.filterAlbum') || 'Album'}</Label>
              <Select
                value={filters.albumId || "all"}
                onValueChange={(value) => setFilters({ ...filters, albumId: value === "all" ? null : value })}
                disabled={!filters.artistId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    filters.artistId 
                      ? (t('analytics.allAlbums') || 'All albums')
                      : (t('analytics.selectArtistFirst') || 'Select artist first')
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('analytics.allAlbums') || 'All albums'}</SelectItem>
                  {albums
                    .filter(album => !filters.artistId || album.artist_id === filters.artistId)
                    .map((album) => (
                      <SelectItem key={album.id} value={album.id}>
                        {album.album_title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Фильтр по завершённости */}
            <div className="space-y-2">
              <Label>{t('analytics.filterCompleted') || 'Completed'}</Label>
              <Select
                value={filters.completed === null ? "all" : filters.completed ? "true" : "false"}
                onValueChange={(value) => 
                  setFilters({ ...filters, completed: value === "all" ? null : value === "true" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('analytics.all') || 'All'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('analytics.all') || 'All'}</SelectItem>
                  <SelectItem value="true">{t('common.yes') || 'Yes'}</SelectItem>
                  <SelectItem value="false">{t('common.no') || 'No'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Кнопки управления фильтрами */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  startDate: null,
                  endDate: null,
                  genreId: null,
                  artistId: null,
                  albumId: null,
                  completed: null,
                });
              }}
            >
              {t('analytics.clearFilters') || 'Clear Filters'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('analytics.totalListens')}</p>
          <p className="text-3xl font-bold text-primary">{stats.totalListens}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('analytics.listeningTime')}</p>
          <p className="text-3xl font-bold text-secondary">{formatMinutes(stats.totalDurationMinutes)}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-accent" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('analytics.tracksListened')}</p>
          <p className="text-3xl font-bold text-accent">{stats.totalTracks}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-muted/10 to-muted/5 border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('analytics.avgDuration')}</p>
          <p className="text-3xl font-bold">{formatDuration(stats.avgTrackDuration)}</p>
        </Card>
      </div>

      {/* График прослушиваний по дням */}
      <Card id="chart-daily-listens" className="p-6 bg-card/50 backdrop-blur">
        <h3 className="text-xl font-semibold mb-4">{t('analytics.charts.dailyListens')}</h3>
        {dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={80}
                style={{ fontSize: '12px' }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="listens" fill="#8884d8" name={t('analytics.charts.listens')} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {t('analytics.charts.noData')}
          </div>
        )}
      </Card>

      {/* График времени прослушивания по дням */}
      <Card id="chart-daily-duration" className="p-6 bg-card/50 backdrop-blur">
        <h3 className="text-xl font-semibold mb-4">{t('analytics.charts.dailyDuration')}</h3>
        {dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={80}
                style={{ fontSize: '12px' }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="duration"
                stroke="#82ca9d"
                strokeWidth={2}
                name={t('analytics.charts.durationMinutes')}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {t('analytics.charts.noData')}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ треков */}
        <Card id="chart-top-tracks" className="p-6 bg-card/50 backdrop-blur">
          <h3 className="text-xl font-semibold mb-4">{t('analytics.charts.topTracks')}</h3>
          {topTracks.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={topTracks}
                layout="vertical"
                margin={{ left: 100, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="title"
                  type="category"
                  width={90}
                  style={{ fontSize: '12px' }}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="listens" fill="#ffc658" name={t('analytics.charts.listens')} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t('analytics.charts.noData')}
            </div>
          )}
        </Card>

        {/* График по жанрам */}
        <Card id="chart-genres" className="p-6 bg-card/50 backdrop-blur">
          <h3 className="text-xl font-semibold mb-4">{t('analytics.charts.genres')}</h3>
          {genreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                  style={{ fontSize: '12px' }}
                >
                  {genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t('analytics.charts.noData')}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
