import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Database, Users, Music, Play } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface DatabaseStats {
  users: number;
  tracks: number;
  playlists: number;
  listenHistory: number;
}

const DatabaseStatus = () => {
  const { t } = useTranslation();
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
        setError(t('admin.dbStatus.errorMessage'));
        setIsConnected(false);
        return;
      }

      // Проверяем подключение к базе данных и получаем статистику по всем таблицам
      const [usersResult, tracksResult, playlistsResult, tracksDataResult] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("tracks").select("id", { count: "exact", head: true }),
        supabase.from("playlists").select("id", { count: "exact", head: true }),
        supabase.from("tracks").select("track_play_count"),
      ]);

      if (usersResult.error) throw usersResult.error;

      // Суммируем общее количество прослушиваний по всем трекам
      const totalListens = tracksDataResult.data?.reduce((sum, track) => {
        return sum + (track.track_play_count || 0);
      }, 0) || 0;

      setStats({
        users: usersResult.count || 0,
        tracks: tracksResult.count || 0,
        playlists: playlistsResult.count || 0,
        listenHistory: totalListens,
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
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          {t('admin.dbStatus.title')}
        </h3>
        <Button onClick={checkConnection} disabled={loading} size="sm">
          {loading ? t('admin.dbStatus.checking') : t('admin.dbStatus.update')}
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
              ? t('admin.dbStatus.checkingConnection')
              : isConnected
              ? t('admin.dbStatus.connected')
              : t('admin.dbStatus.notConnected')}
          </span>
          {isConnected !== null && (
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? t('admin.dbStatus.active') : t('admin.dbStatus.error')}
            </Badge>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>{t('admin.dbStatus.errorTitle')}</strong> {error}
            </p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-1">
              {t('admin.dbStatus.errorMessage')}
            </p>
          </div>
        )}

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.users}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dbStatus.stats.users')}</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Music className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.tracks}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dbStatus.stats.tracks')}</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Play className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{stats.playlists}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dbStatus.stats.playlists')}</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Database className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.listenHistory}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dbStatus.stats.listenHistory')}</div>
            </div>
          </div>
        )}

        {/* Инструкции по настройке */}
        {!isConnected && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              {t('admin.dbStatus.setup.title')}
            </h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>{t('admin.dbStatus.setup.step1')} <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
              <li>{t('admin.dbStatus.setup.step2')}</li>
              <li>{t('admin.dbStatus.setup.step3')}</li>
              <li>{t('admin.dbStatus.setup.step4')}</li>
              <li>{t('admin.dbStatus.setup.step5')}</li>
              <li>{t('admin.dbStatus.setup.step6')}</li>
            </ol>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DatabaseStatus;

