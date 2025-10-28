import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Database, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const StorageInitializer = () => {
  const [initializing, setInitializing] = useState(false);
  const [bucketsStatus, setBucketsStatus] = useState<{
    songs: boolean | null;
    covers: boolean | null;
  }>({ songs: null, covers: null });

  const checkBuckets = async () => {
    try {
      // Проверяем bucket для песен
      const { data: songsList, error: songsError } = await supabase.storage.listBuckets();
      
      if (songsError) {
        console.error('Ошибка проверки bucket\'ов:', songsError);
        setBucketsStatus({ songs: false, covers: false });
        return;
      }

      const songsExists = songsList?.some(bucket => bucket.name === 'songs') || false;
      const coversExists = songsList?.some(bucket => bucket.name === 'covers') || false;
      
      setBucketsStatus({ songs: songsExists, covers: coversExists });
    } catch (error) {
      console.error('Ошибка проверки bucket\'ов:', error);
      setBucketsStatus({ songs: false, covers: false });
    }
  };

  const initializeStorage = async () => {
    setInitializing(true);
    
    try {
      // Создаем bucket для аудио файлов
      const { error: songsError } = await supabase.storage.createBucket('songs', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4']
      });

      if (songsError && !songsError.message.includes('already exists')) {
        console.error('Ошибка создания bucket songs:', songsError.message);
      }

      // Создаем bucket для обложек
      const { error: coversError } = await supabase.storage.createBucket('covers', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      if (coversError && !coversError.message.includes('already exists')) {
        console.error('Ошибка создания bucket covers:', coversError.message);
      }

      toast.success("Storage инициализирован успешно!");
      await checkBuckets();
      
    } catch (error: any) {
      toast.error(`Ошибка инициализации Storage: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <div className="w-4 h-4 rounded-full bg-gray-400 animate-pulse" />;
    return status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">Проверка...</Badge>;
    return <Badge variant={status ? "default" : "destructive"}>{status ? "Создан" : "Отсутствует"}</Badge>;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Инициализация Storage
        </h3>
        <div className="flex gap-2">
          <Button onClick={checkBuckets} disabled={initializing} size="sm" variant="outline">
            Проверить
          </Button>
          <Button onClick={initializeStorage} disabled={initializing} size="sm">
            {initializing ? "Инициализация..." : "Инициализировать"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Статус bucket'ов */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(bucketsStatus.songs)}
              <span className="font-medium">Bucket "songs"</span>
            </div>
            {getStatusBadge(bucketsStatus.songs)}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(bucketsStatus.covers)}
              <span className="font-medium">Bucket "covers"</span>
            </div>
            {getStatusBadge(bucketsStatus.covers)}
          </div>
        </div>

        {/* Предупреждение */}
        {bucketsStatus.songs === false || bucketsStatus.covers === false ? (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Storage не настроен
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Для загрузки треков необходимо создать bucket'ы в Supabase Storage. 
                  Нажмите "Инициализировать" для автоматического создания.
                </p>
              </div>
            </div>
          </div>
        ) : bucketsStatus.songs && bucketsStatus.covers ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                  Storage настроен
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Все необходимые bucket'ы созданы. Теперь можно загружать треки и обложки.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Инструкции */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Что делает инициализация:
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Создает bucket "songs" для хранения аудио файлов (до 50MB)</li>
            <li>Создает bucket "covers" для хранения обложек (до 5MB)</li>
            <li>Настраивает права доступа и ограничения файлов</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default StorageInitializer;

