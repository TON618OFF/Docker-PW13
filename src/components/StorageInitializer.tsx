import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Database, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

const StorageInitializer = () => {
  const { t } = useTranslation();
  const [initializing, setInitializing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [bucketsStatus, setBucketsStatus] = useState<{
    songs: boolean | null;
    covers: boolean | null;
  }>({ songs: null, covers: null });

  useEffect(() => {
    checkBuckets();
  }, []);

  const checkBuckets = async () => {
    setChecking(true);
    try {
      // Проверяем bucket'ы, пытаясь получить список файлов из каждого
      // Если bucket не существует, получим ошибку "not found" или "Bucket not found"
      const [songsCheck, coversCheck] = await Promise.all([
        supabase.storage.from('songs').list('', { limit: 1 }),
        supabase.storage.from('covers').list('', { limit: 1 }),
      ]);

      // Проверяем наличие bucket'ов по типу ошибки
      // Если bucket существует, ошибка будет связана с доступом (RLS), а не с отсутствием bucket'а
      const songsExists = !songsCheck.error || 
        (songsCheck.error && 
         !songsCheck.error.message?.toLowerCase().includes('not found') && 
         !songsCheck.error.message?.toLowerCase().includes('does not exist') &&
         !songsCheck.error.message?.toLowerCase().includes('bucket not found'));
      
      const coversExists = !coversCheck.error || 
        (coversCheck.error && 
         !coversCheck.error.message?.toLowerCase().includes('not found') && 
         !coversCheck.error.message?.toLowerCase().includes('does not exist') &&
         !coversCheck.error.message?.toLowerCase().includes('bucket not found'));

      setBucketsStatus({ 
        songs: songsExists,
        covers: coversExists
      });

      // Дополнительная проверка через listBuckets (если доступна)
      try {
        const { data: bucketsList, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (!bucketsError && bucketsList && bucketsList.length > 0) {
          const songsInList = bucketsList.some(bucket => 
            bucket.name === 'songs' || bucket.id === 'songs'
          );
          const coversInList = bucketsList.some(bucket => 
            bucket.name === 'covers' || bucket.id === 'covers'
          );
          
          // Используем результат из listBuckets как более точный
          setBucketsStatus({ 
            songs: songsInList,
            covers: coversInList
          });
        }
      } catch (listError) {
        // Игнорируем ошибку listBuckets, используем результат из предыдущей проверки
        console.log('listBuckets не доступен:', listError);
      }
    } catch (error) {
      console.error('Ошибка проверки bucket\'ов:', error);
      // Не устанавливаем false автоматически, оставляем текущее состояние
    } finally {
      setChecking(false);
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

      toast.success(t('admin.storage.success.toast'));
      await checkBuckets();
      
    } catch (error: any) {
      toast.error(`${t('admin.storage.error.toast')}: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <div className="w-4 h-4 rounded-full bg-gray-400 animate-pulse" />;
    return status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">{t('admin.storage.status.checking')}</Badge>;
    return <Badge variant={status ? "default" : "destructive"}>{status ? t('admin.storage.status.created') : t('admin.storage.status.missing')}</Badge>;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          {t('admin.storage.title')}
        </h3>
        <div className="flex gap-2">
          <Button onClick={checkBuckets} disabled={initializing || checking} size="sm" variant="outline">
            {checking ? t('admin.storage.checking') : t('admin.storage.check')}
          </Button>
          <Button onClick={initializeStorage} disabled={initializing} size="sm">
            {initializing ? t('admin.storage.initializing') : t('admin.storage.initialize')}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Статус bucket'ов */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(bucketsStatus.songs)}
              <span className="font-medium">{t('admin.storage.bucket.songs')}</span>
            </div>
            {getStatusBadge(bucketsStatus.songs)}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(bucketsStatus.covers)}
              <span className="font-medium">{t('admin.storage.bucket.covers')}</span>
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
                  {t('admin.storage.warning.title')}
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t('admin.storage.warning.message')}
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
                  {t('admin.storage.success.title')}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t('admin.storage.success.message')}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Инструкции */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            {t('admin.storage.info.title')}
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>{t('admin.storage.info.step1')}</li>
            <li>{t('admin.storage.info.step2')}</li>
            <li>{t('admin.storage.info.step3')}</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default StorageInitializer;

