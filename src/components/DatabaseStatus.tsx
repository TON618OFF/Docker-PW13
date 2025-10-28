import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Database, Users, Music, Play } from "lucide-react";

interface DatabaseStats {
  profiles: number;
  songs: number;
  playlists: number;
  listenHistory: number;
}

const DatabaseStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      // Проверяем переменные окружения
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!url || !key) {
        setError("Переменные окружения не настроены");
        setIsConnected(false);
        return;
      }

      // Проверяем подключение к базе данных
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("count", { count: "exact", head: true });

      if (profilesError) throw profilesError;

      // Получаем статистику по всем таблицам
      const [songsResult, playlistsResult, historyResult] = await Promise.all([
        supabase.from("songs").select("count", { count: "exact", head: true }),
        supabase.from("playlists").select("count", { count: "exact", head: true }),
        supabase.from("listen_history").select("count", { count: "exact", head: true }),
      ]);

      setStats({
        profiles: profiles?.count || 0,
        songs: songsResult.data?.count || 0,
        playlists: playlistsResult.data?.count || 0,
        listenHistory: historyResult.data?.count || 0,
      });

      setIsConnected(true);
    } catch (err: any) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Статус базы данных
        </h3>
        <Button onClick={checkConnection} disabled={loading} size="sm">
          {loading ? "Проверка..." : "Обновить"}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Статус подключения */}
        <div className="flex items-center gap-2">
          {isConnected === null ? (
            <div className="w-4 h-4 rounded-full bg-gray-400 animate-pulse" />
          ) : isConnected ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="font-medium">
            {isConnected === null
              ? "Проверка подключения..."
              : isConnected
              ? "Подключено"
              : "Не подключено"}
          </span>
          {isConnected !== null && (
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Активно" : "Ошибка"}
            </Badge>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Ошибка:</strong> {error}
            </p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-1">
              Убедитесь, что переменные VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY настроены в файле .env.local
            </p>
          </div>
        )}

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.profiles}</div>
              <div className="text-xs text-muted-foreground">Пользователи</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Music className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.songs}</div>
              <div className="text-xs text-muted-foreground">Треки</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Play className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{stats.playlists}</div>
              <div className="text-xs text-muted-foreground">Плейлисты</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Database className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.listenHistory}</div>
              <div className="text-xs text-muted-foreground">Прослушивания</div>
            </div>
          </div>
        )}

        {/* Инструкции по настройке */}
        {!isConnected && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Как настроить Supabase:
            </h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Создайте аккаунт на <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
              <li>Создайте новый проект</li>
              <li>Скопируйте URL проекта и anon key</li>
              <li>Создайте файл .env.local в корне проекта</li>
              <li>Добавьте переменные VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY</li>
              <li>Запустите миграции: npx supabase db push</li>
            </ol>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DatabaseStatus;

