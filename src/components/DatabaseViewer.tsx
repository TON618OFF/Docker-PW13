import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Search, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface TableData {
  [key: string]: any;
}

const DatabaseViewer = () => {
  const { t } = useTranslation();
  const [selectedTable, setSelectedTable] = useState<string>("tracks");
  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(50);

  const tables = [
    { value: "tracks", label: t('admin.dbViewer.tables.tracks'), icon: "🎵" },
    { value: "playlists", label: t('admin.dbViewer.tables.playlists'), icon: "📋" },
    { value: "users", label: t('admin.dbViewer.tables.users'), icon: "👤" },
    { value: "listening_history", label: t('admin.dbViewer.tables.listeningHistory'), icon: "📊" },
    { value: "playlist_tracks", label: t('admin.dbViewer.tables.playlistTracks'), icon: "🔗" },
    { value: "artists", label: t('admin.dbViewer.tables.artists'), icon: "🎤" },
    { value: "albums", label: t('admin.dbViewer.tables.albums'), icon: "💿" },
    { value: "roles", label: t('admin.dbViewer.tables.roles'), icon: "👑" },
  ];

  useEffect(() => {
    fetchData();
  }, [selectedTable, limit]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Определяем поле для сортировки в зависимости от таблицы
      let orderByField: string | null = null;
      
      if (selectedTable === "listening_history") {
        orderByField = "listened_at";
      } else if (selectedTable === "playlist_tracks") {
        orderByField = "added_at";
      } else {
        orderByField = "created_at";
      }

      // Формируем SELECT запрос с JOIN'ами для замены внешних ключей
      let selectQuery = "*";
      
      switch (selectedTable) {
        case "tracks":
          selectQuery = `*, album:albums(album_title), uploaded_by_user:users(username)`;
          break;
        case "albums":
          selectQuery = `*, artist:artists(artist_name), created_by_user:users(username)`;
          break;
        case "playlists":
          selectQuery = `*, user:users(username)`;
          break;
        case "listening_history":
          selectQuery = `*, user:users(username), track:tracks(track_title)`;
          break;
        case "playlist_tracks":
          selectQuery = `*, playlist:playlists(playlist_title), track:tracks(track_title)`;
          break;
        case "artists":
          selectQuery = `*, user:users(username)`;
          break;
        case "users":
          selectQuery = `*, role:roles(role_name)`;
          break;
        case "track_genres":
          selectQuery = `*, track:tracks(track_title), genre:genres(genre_name)`;
          break;
        case "artist_applications":
          selectQuery = `*, user:users(username), reviewer:users(username)`;
          break;
        default:
          selectQuery = "*";
      }
      
      let query = supabase
        .from(selectedTable)
        .select(selectQuery)
        .limit(limit);

      // Добавляем сортировку только если поле определено
      if (orderByField) {
        query = query.order(orderByField, { ascending: false });
      }

      const { data: tableData, error } = await query;

      if (error) throw error;
      
      // Преобразуем данные: заменяем внешние ключи на их значения
      const transformedData = (tableData || []).map((row: any) => {
        const transformed: any = { ...row };
        
        // Функция для извлечения значения из связанного объекта/массива
        const getRelatedValue = (related: any, field: string): any => {
          if (!related) return null;
          if (Array.isArray(related)) {
            return related[0]?.[field] || null;
          }
          return related[field] || null;
        };
        
        switch (selectedTable) {
          case "tracks":
            const albumTitle = getRelatedValue(row.album, "album_title");
            if (albumTitle) transformed.album_id = albumTitle;
            const uploaderUsername = getRelatedValue(row.uploaded_by_user, "username");
            if (uploaderUsername) transformed.uploaded_by = uploaderUsername;
            delete transformed.album;
            delete transformed.uploaded_by_user;
            break;
          case "albums":
            const artistName = getRelatedValue(row.artist, "artist_name");
            if (artistName) transformed.artist_id = artistName;
            const creatorUsername = getRelatedValue(row.created_by_user, "username");
            if (creatorUsername) transformed.created_by = creatorUsername;
            delete transformed.artist;
            delete transformed.created_by_user;
            break;
          case "playlists":
            const playlistUser = getRelatedValue(row.user, "username");
            if (playlistUser) transformed.user_id = playlistUser;
            delete transformed.user;
            break;
          case "listening_history":
            const historyUser = getRelatedValue(row.user, "username");
            if (historyUser) transformed.user_id = historyUser;
            const historyTrack = getRelatedValue(row.track, "track_title");
            if (historyTrack) transformed.track_id = historyTrack;
            delete transformed.user;
            delete transformed.track;
            break;
          case "playlist_tracks":
            const playlistTitle = getRelatedValue(row.playlist, "playlist_title");
            if (playlistTitle) transformed.playlist_id = playlistTitle;
            const playlistTrackTitle = getRelatedValue(row.track, "track_title");
            if (playlistTrackTitle) transformed.track_id = playlistTrackTitle;
            delete transformed.playlist;
            delete transformed.track;
            break;
          case "artists":
            const artistUser = getRelatedValue(row.user, "username");
            if (artistUser) transformed.user_id = artistUser;
            delete transformed.user;
            break;
          case "users":
            const roleName = getRelatedValue(row.role, "role_name");
            if (roleName) transformed.role_id = roleName;
            delete transformed.role;
            break;
          case "track_genres":
            const genreTrackTitle = getRelatedValue(row.track, "track_title");
            if (genreTrackTitle) transformed.track_id = genreTrackTitle;
            const genreName = getRelatedValue(row.genre, "genre_name");
            if (genreName) transformed.genre_id = genreName;
            delete transformed.track;
            delete transformed.genre;
            break;
          case "artist_applications":
            const appUser = getRelatedValue(row.user, "username");
            if (appUser) transformed.user_id = appUser;
            const reviewerUsername = getRelatedValue(row.reviewer, "username");
            if (reviewerUsername) transformed.reviewed_by = reviewerUsername;
            delete transformed.user;
            delete transformed.reviewer;
            break;
        }
        
        return transformed;
      });
      
      setData(transformedData);
    } catch (error: any) {
      toast.error(`${t('admin.dbViewer.error')}: ${error.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((row) => {
    if (!searchQuery) return true;
    
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) {
      return <Badge variant="secondary">null</Badge>;
    }
    
    const stringValue = String(value);
    const isLong = stringValue.length > 50;
    
    // UUID поля - отображаем как есть (сокращенно), но только если это действительно UUID
    // Если это уже преобразованное значение (например, имя пользователя), показываем как обычный текст
    if (key === "id") {
      // Только первичные ключи id всегда UUID
      if (typeof value === "string" && value.length === 36) {
        return (
          <span className="font-mono text-xs" title={value}>
            {value.substring(0, 8)}...
          </span>
        );
      }
    } else if (key.endsWith("_id") || key === "created_by" || key === "uploaded_by" || key === "user_id" || key === "artist_id" || key === "album_id" || key === "track_id" || key === "playlist_id" || key === "genre_id" || key === "role_id" || key === "reviewed_by") {
      // Проверяем, является ли значение UUID (36 символов) или уже преобразованным значением
      if (typeof value === "string" && value.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        // Это UUID - показываем сокращенно
        return (
          <span className="font-mono text-xs" title={value}>
            {value.substring(0, 8)}...
          </span>
        );
      }
      // Это уже преобразованное значение (имя пользователя, название и т.д.) - показываем как обычный текст
      return isLong ? (
        <span title={stringValue} className="cursor-help break-all">
          {stringValue.substring(0, 50)}...
        </span>
      ) : (
        <span>{stringValue}</span>
      );
    }
    
    // URL поля - отображаем как ссылку или текст
    if (key.includes("url") || key.includes("_url")) {
      if (typeof value === "string" && (value.startsWith("http") || value.startsWith("/"))) {
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline break-all"
            title={isLong ? value : undefined}
          >
            {isLong ? `${value.substring(0, 50)}...` : value}
          </a>
        );
      }
      return (
        <span className="break-all" title={isLong ? stringValue : undefined}>
          {isLong ? `${stringValue.substring(0, 50)}...` : stringValue}
        </span>
      );
    }
    
    // Булевы значения
    if (typeof value === "boolean") {
      return <Badge variant={value ? "default" : "secondary"}>{value ? t('common.yes') : t('common.no')}</Badge>;
    }
    
    // Поля с датами - проверяем конкретные имена полей
    const dateFields = ["created_at", "updated_at", "listened_at", "added_at", "reviewed_at", "last_login", "album_release_date"];
    if (dateFields.includes(key) || (key.includes("date") && !key.includes("duration"))) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const dateString = date.toLocaleString("ru-RU");
          return <span title={value}>{dateString}</span>;
        }
      } catch (e) {
        // Если не удалось распарсить как дату, возвращаем как строку
      }
    }
    
    // Продолжительность в секундах
    if (key.includes("duration") && typeof value === "number") {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      const durationString = `${mins}:${secs.toString().padStart(2, "0")}`;
      return <span title={`${value} секунд`}>{durationString}</span>;
    }
    
    // Длинные строки - обрезаем, но показываем полный текст при наведении
    if (isLong) {
      return (
        <span title={stringValue} className="cursor-help break-all">
          {stringValue.substring(0, 50)}...
        </span>
      );
    }
    
    // Обычные значения
    return <span>{stringValue}</span>;
  };

  const getColumns = () => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          {t('admin.dbViewer.title')}
        </h3>
        <Button onClick={fetchData} disabled={loading} size="sm">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Фильтры */}
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table.value} value={table.value}>
                  <span className="flex items-center gap-2">
                    <span>{table.icon}</span>
                    {table.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.dbViewer.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Статистика */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <span>{t('admin.dbViewer.table')} <strong>{selectedTable}</strong></span>
          <span>{t('admin.dbViewer.totalRecords')} <strong>{data.length}</strong></span>
          <span>{t('admin.dbViewer.shown')} <strong>{filteredData.length}</strong></span>
        </div>

        {/* Таблица */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-muted-foreground">{t('admin.dbViewer.loading')}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {searchQuery ? t('admin.dbViewer.noResults') : t('admin.dbViewer.noData')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {getColumns().map((column) => (
                    <TableHead key={column} className="whitespace-nowrap">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, index) => (
                  <TableRow key={index}>
                    {getColumns().map((column) => (
                      <TableCell key={column} className="max-w-xs">
                        {formatValue(row[column], column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DatabaseViewer;

