import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import type { Track } from '@/types';
import { usePlayer } from '@/contexts/PlayerContext';
import { useTranslation } from '@/hooks/useTranslation';

interface MusicPlayerProps {
  track?: Track;
  onTrackEnd?: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ track: trackProp, onTrackEnd }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastLoggedTimeRef = useRef<number>(0);
  const logIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playCountLoggedRef = useRef<string | null>(null); // ID трека, для которого уже засчитано прослушивание
  const { 
    currentTrack, 
    nextTrack, 
    previousTrack, 
    playlist, 
    isShuffled, 
    setIsShuffled,
    shuffledPlaylist
  } = usePlayer();

  // Используем трек из контекста, если он есть, иначе из пропсов
  const track = currentTrack || trackProp;

  // Получаем подписанный URL для приватного файла
  const getSignedUrl = async (filePath: string): Promise<string> => {
    try {
      // Проверяем, что filePath существует и является строкой
      if (!filePath || typeof filePath !== 'string') {
        console.error('Invalid file path:', filePath);
        toast.error(t('musicPlayer.error.invalidPath'));
        return '';
      }

      // Если это уже публичный URL, но он не работает, попробуем получить подписанный URL
      if (filePath.startsWith('http')) {
        console.log('Public URL detected, checking if it works...');
        
        // Проверяем, работает ли публичный URL
        try {
          const response = await fetch(filePath, { method: 'HEAD' });
          if (response.ok) {
            console.log('Public URL works:', filePath);
            return filePath;
          } else {
            console.log('Public URL failed, trying to get signed URL');
            // Если публичный URL не работает, извлекаем путь и получаем подписанный URL
            const urlParts = filePath.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const userId = urlParts[urlParts.length - 2];
            
            const { data, error } = await supabase.storage
              .from('songs')
              .createSignedUrl(`${userId}/${fileName}`, 3600);
              
            if (error) {
              console.error('Error creating signed URL:', error);
              return '';
            }
            
            console.log('Signed URL created:', data.signedUrl);
            return data.signedUrl;
          }
        } catch (error) {
          console.log('Error checking public URL, trying signed URL');
          // Если проверка публичного URL не удалась, получаем подписанный URL
          const urlParts = filePath.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const userId = urlParts[urlParts.length - 2];
          
          const { data, error: signedUrlError } = await supabase.storage
            .from('songs')
            .createSignedUrl(`${userId}/${fileName}`, 3600);
            
          if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
            return '';
          }
          
          console.log('Signed URL created:', data.signedUrl);
          return data.signedUrl;
        }
      }

      // Если это локальный путь, возвращаем пустую строку
      if (filePath.startsWith('local://')) {
        toast.error(t('musicPlayer.error.localFiles'));
        return '';
      }

      // Извлекаем путь к файлу из URL
      const urlParts = filePath.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 2];

      console.log('Creating signed URL for:', `${userId}/${fileName}`);

      // Получаем подписанный URL
      const { data, error } = await supabase.storage
        .from('songs')
        .createSignedUrl(`${userId}/${fileName}`, 3600); // URL действителен 1 час

      if (error) {
        console.error('Ошибка получения подписанного URL:', error);
        toast.error(t('musicPlayer.error.loadAudio'));
        return '';
      }

      console.log('Signed URL created:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Ошибка получения подписанного URL:', error);
      toast.error(t('musicPlayer.error.loadAudio'));
      return '';
    }
  };

  // Проверяем доступность аудио URL
  const checkAudioUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log('Audio URL check:', {
        url,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
      return response.ok;
    } catch (error) {
      console.error('Error checking audio URL:', error);
      return false;
    }
  };

  // Проверяем, добавлен ли трек в избранное
  useEffect(() => {
    const checkFavorite = async () => {
      if (!track) {
        setIsFavorite(false);
        return;
      }
      
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
          setIsFavorite(false);
          return;
        }

        const { data, error } = await supabase
          .from('favorites_tracks')
          .select('id')
          .eq('user_id', user.id)
          .eq('track_id', track.id)
          .maybeSingle();

        // maybeSingle возвращает null если записи нет, но не ошибку
        setIsFavorite(!error && data !== null);
      } catch (error) {
        console.error('Error checking favorite:', error);
        setIsFavorite(false);
      }
    };

    checkFavorite();
  }, [track]);

  // Загружаем трек
  useEffect(() => {
    if (!track || !track.track_audio_url) return;

    const loadTrack = async () => {
      setIsLoading(true);
      setIsPlaying(false); // Останавливаем предыдущий трек
      setCurrentTime(0); // Сбрасываем время
      
      try {
        console.log('Loading track with URL:', track.track_audio_url);
        const signedUrl = await getSignedUrl(track.track_audio_url);
        if (signedUrl) {
          setAudioUrl(signedUrl);
          setDuration(track.track_duration);
          console.log('Audio URL is set:', signedUrl);
        } else {
          console.error('Failed to get audio URL');
          toast.error(t('musicPlayer.error.noLink'));
        }
      } catch (error) {
        console.error('Ошибка загрузки трека:', error);
        toast.error(t('musicPlayer.error.loadTrack'));
      } finally {
        setIsLoading(false);
      }
    };

    loadTrack();
  }, [track]);

  // Обработчики аудио
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
    };

    const handleCanPlay = async () => {
      console.log('Audio can play');
      setIsLoading(false);
      
      // Автоматически начинаем воспроизведение, если трек готов
      if (audio && !isPlaying && track) {
        try {
          await audio.play();
          setIsPlaying(true);
          console.log('Auto-playing track');
          
          // Сбрасываем время последнего логирования
          lastLoggedTimeRef.current = 0;
          
          // Сбрасываем флаг засчитанного прослушивания при смене трека
          if (playCountLoggedRef.current !== track?.id) {
            playCountLoggedRef.current = null;
          }
          
          // Начисляем прослушивание один раз через 5-10 секунд
          setTimeout(() => {
            const audio = audioRef.current;
            if (audio && track && !audio.paused && audio.currentTime >= 5 && playCountLoggedRef.current !== track.id) {
              incrementPlayCount(track.id);
              playCountLoggedRef.current = track.id;
            }
          }, 5000);
          
          // Запускаем периодическое логирование только для истории (без начисления play_count)
          startLoggingInterval();
        } catch (error: any) {
          // Если автовоспроизведение заблокировано браузером, просто логируем
          // Это нормальное поведение для многих браузеров
          console.warn('Autoplay blocked or failed:', error?.message || error);
          // Не показываем ошибку пользователю, так как это нормальное поведение браузера
        }
      }
    };

    const handleEnded = async () => {
      console.log('Audio ended, repeat mode:', repeatMode);
      
      const audio = audioRef.current;
      if (!audio) return;

      // Логируем завершенное прослушивание и начисляем play_count если еще не засчитано
      if (track && audio.duration > 0) {
        // Если play_count еще не засчитан, начисляем его
        if (playCountLoggedRef.current !== track.id) {
          await incrementPlayCount(track.id);
          playCountLoggedRef.current = track.id;
        }
        // Логируем в историю (триггер не сработает, так как play_count уже засчитан)
        await logListening(audio.duration, true);
        console.log('Logged completed listening');
      }
      
      // Останавливаем периодическое логирование
      stopLoggingInterval();
      lastLoggedTimeRef.current = 0;
      
      if (repeatMode === 'one') {
        // Повторяем текущий трек
        console.log('Repeating current track');
        audio.currentTime = 0;
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Error replaying track:', error);
        }
      } else if (repeatMode === 'all') {
        // Переходим к следующему треку в плейлисте, или к первому если это был последний
        console.log('Repeating playlist - going to next track');
        const activePlaylist = isShuffled && shuffledPlaylist.length > 0 ? shuffledPlaylist : playlist;
        if (activePlaylist.length > 0) {
          // Вызываем nextTrack, который обновит currentTrack
          nextTrack();
        } else {
          // Если плейлист пустой, повторяем текущий трек
          audio.currentTime = 0;
          try {
            await audio.play();
            setIsPlaying(true);
          } catch (error) {
            console.error('Error replaying track:', error);
          }
        }
      } else {
        // Обычное поведение - переходим к следующему треку или останавливаем
        console.log('Normal playback - going to next track or stopping');
        const activePlaylist = isShuffled && shuffledPlaylist.length > 0 ? shuffledPlaylist : playlist;
        if (activePlaylist.length > 1) {
          // Если есть еще треки, переходим к следующему
          nextTrack();
        } else {
          // Если это был последний трек, останавливаем
          setIsPlaying(false);
          setCurrentTime(0);
          onTrackEnd?.();
        }
      }
    };

    const handleError = (e: Event) => {
      const audioError = audio.error;
      if (audioError) {
        let errorMessage = t('musicPlayer.error.playback');
        
        switch (audioError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = t('musicPlayer.error.aborted');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = t('musicPlayer.error.network');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = t('musicPlayer.error.decode');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = t('musicPlayer.error.unsupported');
            break;
          default:
            errorMessage = t('musicPlayer.error.playback');
        }
        
        console.error('Audio error:', {
          code: audioError.code,
          message: audioError.message || errorMessage,
          networkState: audio.networkState,
          readyState: audio.readyState,
          src: audio.src
        });
        
        toast.error(errorMessage);
        setIsPlaying(false);
        setIsLoading(false);
      }
    };

    const handleLoadStart = () => {
      console.log('Audio load started');
    };

    const handleLoadedData = () => {
      console.log('Audio data loaded');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };

    // Очистка интервала при размонтировании
    return () => {
      stopLoggingInterval();
    };
  }, [audioUrl, onTrackEnd, isPlaying, track, repeatMode, playlist, isShuffled, shuffledPlaylist]);

  // Очистка интервала при смене трека
  useEffect(() => {
    return () => {
      stopLoggingInterval();
      // Логируем прослушивание при смене трека
      const audio = audioRef.current;
      if (audio && track && audio.currentTime > 5) { // Логируем только если прослушано больше 5 секунд
        logListening(audio.currentTime, false);
      }
    };
  }, [track?.id]);

  // Управление воспроизведением
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      console.error('No audio element or URL');
      return;
    }

    console.log('Toggle play/pause, current state:', isPlaying);
    console.log('Audio URL:', audioUrl);
    console.log('Audio ready state:', audio.readyState);

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      
      // Логируем прослушивание при паузе (только если прослушано больше 5 секунд)
      if (track && audio.currentTime >= 5) {
        // Если play_count еще не засчитан, начисляем его
        if (playCountLoggedRef.current !== track.id) {
          incrementPlayCount(track.id);
          playCountLoggedRef.current = track.id;
        }
        // Логируем в историю
        logListening(audio.currentTime, false);
      }
      
      // Останавливаем периодическое логирование
      stopLoggingInterval();
    } else {
      try {
        // Проверяем готовность аудио
        if (audio.readyState < 2) {
          console.log('Audio not ready, waiting...');
          toast.info(t('musicPlayer.info.loading'));
          return;
        }

        await audio.play();
        setIsPlaying(true);
        console.log('Audio started playing');
        
        // Сбрасываем время последшего логирования
        lastLoggedTimeRef.current = 0;
        
        // Запускаем периодическое логирование
        startLoggingInterval();
        
          // Первое логирование через 10 секунд
          setTimeout(() => {
            const audio = audioRef.current;
            if (audio && isPlaying && audio.currentTime >= 10 && track) {
              logListening(audio.currentTime, false);
            }
          }, 10000);
      } catch (error: any) {
        console.error('Ошибка воспроизведения:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
        
        if (error.name === 'NotSupportedError') {
          toast.error(t('musicPlayer.error.format'));
        } else if (error.name === 'NotAllowedError') {
          toast.error(t('musicPlayer.error.autoplay'));
        } else {
          toast.error(t('musicPlayer.error.playback'));
        }
      }
    }
  };

  // Логирование прослушивания
  const logListening = async (duration: number, completed: boolean = false) => {
    if (!track) {
      console.warn('logListening: No track available');
      return;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.warn('logListening: No user available');
        return;
      }

      const durationSeconds = Math.floor(duration);
      // Логируем даже если duration очень маленький (например, 1 секунда), но не 0
      if (durationSeconds < 1) {
        console.log('logListening: Duration is less than 1 second, skipping');
        return;
      }

      // Логируем только для отладки при необходимости
      // console.log('Logging listening:', {
      //   trackId: track.id,
      //   trackTitle: track.track_title,
      //   duration: durationSeconds,
      //   completed,
      //   userId: user.id
      // });

      // Если play_count уже засчитан, уменьшаем его перед логированием, чтобы триггер не увеличил его снова
      // Но это сложно, поэтому лучше просто не логировать если play_count уже засчитан
      // Или логировать только финальную запись при завершении/паузе
      
      // Если play_count уже засчитан, логируем историю (триггер не увеличит счетчик еще раз)
      // Если play_count еще не засчитан, логируем только после начисления play_count
      const { data, error } = await supabase.from('listening_history').insert({
        user_id: user.id,
        track_id: track.id,
        duration_played: durationSeconds,
        completed: completed
      }).select();

      if (error) {
        console.error('Ошибка логирования прослушивания:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        // Успешное логирование - обновляем время последнего логирования
        lastLoggedTimeRef.current = durationSeconds;
        
        // Если play_count уже засчитан через incrementPlayCount, но триггер его увеличил еще раз
        // Уменьшаем его обратно (получаем текущее значение и уменьшаем на 1)
        if (playCountLoggedRef.current === track.id) {
          // play_count уже засчитан, триггер увеличил его еще раз - уменьшаем обратно
          const { data: trackData } = await supabase
            .from('tracks')
            .select('track_play_count')
            .eq('id', track.id)
            .single();
          
          if (trackData && trackData.track_play_count > 0) {
            const { error: decrementError } = await supabase
              .from('tracks')
              .update({ track_play_count: trackData.track_play_count - 1 })
              .eq('id', track.id);
            
            if (decrementError) {
              console.error('Error decrementing play count after trigger:', decrementError);
            }
          }
        } else {
          // play_count еще не засчитан, триггер увеличил его - это нормально, оставляем как есть
          playCountLoggedRef.current = track.id;
        }
      }
    } catch (error: any) {
      console.error('Ошибка логирования прослушивания:', error);
      toast.error(`Ошибка сохранения истории: ${error?.message || 'Unknown error'}`);
    }
  };

  // Начисление прослушивания (одно на трек)
  const incrementPlayCount = React.useCallback(async (trackId: string) => {
    try {
      // Получаем текущее значение и увеличиваем на 1
      const { data: trackData } = await supabase
        .from('tracks')
        .select('track_play_count')
        .eq('id', trackId)
        .single();
      
      if (trackData) {
        const { error: updateError } = await supabase
          .from('tracks')
          .update({ track_play_count: (trackData.track_play_count || 0) + 1 })
          .eq('id', trackId);
        
        if (updateError) {
          console.error('Error incrementing play count:', updateError);
        } else {
          console.log('Play count incremented for track:', trackId);
        }
      }
    } catch (error: any) {
      console.error('Error incrementing play count:', error);
    }
  }, []);

  // Запуск логирования прослушивания (только для истории, без начисления play_count)
  const startLoggingInterval = React.useCallback(() => {
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
    }

    // Сбрасываем флаг засчитанного прослушивания при смене трека
    if (playCountLoggedRef.current !== track?.id) {
      playCountLoggedRef.current = null;
    }

    // Начисляем прослушивание один раз после 5-10 секунд
    const playCountTimeout = setTimeout(() => {
      const audio = audioRef.current;
      if (audio && track && !audio.paused && audio.currentTime >= 5 && playCountLoggedRef.current !== track.id) {
        incrementPlayCount(track.id);
        playCountLoggedRef.current = track.id;
      }
    }, 5000); // Проверяем через 5 секунд

    // НЕ логируем периодически, чтобы триггер БД не увеличивал play_count многократно
    // Логируем только при завершении/паузе/смене трека
    logIntervalRef.current = null;
  }, [track, incrementPlayCount]);

  // Остановка периодического логирования
  const stopLoggingInterval = React.useCallback(() => {
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  }, []);

  // Перемотка
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Изменение громкости
  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Переключение звука
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Переключение избранного
  const toggleFavorite = async () => {
    if (!track) return;

    try {
      const { data, error } = await supabase.rpc("toggle_favorite_track", {
        p_track_id: track.id,
      });

      if (error) throw error;

      setIsFavorite(data.action === "added");
      toast.success(
        data.action === "added" 
          ? t('messages.addedToFavorites') 
          : t('messages.removedFromFavorites')
      );
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error(`${t('messages.error')}: ${error.message}`);
    }
  };

  // Форматирование времени
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return (
      <Card className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur border-t">
        <div className="text-center text-muted-foreground">
          {t('musicPlayer.selectTrack')}
        </div>
      </Card>
    );
  }

  return (
    <>
      <audio 
        ref={audioRef} 
        src={audioUrl || undefined} 
        preload="metadata"
        crossOrigin="anonymous"
        onError={(e) => {
          // Ошибка уже обрабатывается в useEffect через addEventListener
          // Этот обработчик нужен для React, но логирование дублируется
          const audio = audioRef.current;
          if (audio?.error) {
            // Ошибка уже обработана в handleError из useEffect
            console.warn('Audio element error event triggered');
          }
        }}
      />
      
      <Card className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur border-t shadow-player">
        <div className="flex items-center gap-4">
          {/* Обложка и информация о треке */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center overflow-hidden">
              {track.album.album_cover_url ? (
                <img
                  src={track.album.album_cover_url}
                  alt={track.album.album_title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-primary text-lg">♪</span>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold truncate">{track.track_title}</h4>
              <p className="text-sm text-muted-foreground truncate">
                {track.album.artist.artist_name}
              </p>
            </div>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleFavorite}
              className={isFavorite ? 'text-red-500 hover:text-red-600' : ''}
              title={isFavorite ? t('messages.removeFromFavorites') : t('messages.addToFavorites')}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
            
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Основные элементы управления */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
            {/* Кнопки управления */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsShuffled(!isShuffled)}
                className={isShuffled ? 'text-primary' : ''}
                title={isShuffled ? t('musicPlayer.shuffleOff') : t('musicPlayer.shuffleOn')}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={previousTrack}>
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={togglePlayPause}
                disabled={isLoading || !audioUrl}
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>
              
              <Button variant="ghost" size="sm" onClick={nextTrack}>
                <SkipForward className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
                  const currentIndex = modes.indexOf(repeatMode);
                  setRepeatMode(modes[(currentIndex + 1) % modes.length]);
                }}
                className={repeatMode !== 'none' ? 'text-primary' : ''}
                title={
                  repeatMode === 'none' ? t('musicPlayer.repeatOff') :
                  repeatMode === 'one' ? t('musicPlayer.repeatOne') :
                  t('musicPlayer.repeatAll')
                }
              >
                <div className="relative">
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-4 h-4" />
                  ) : (
                    <Repeat className="w-4 h-4" />
                  )}
                  {repeatMode === 'all' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </Button>
            </div>

            {/* Прогресс-бар */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground min-w-[40px]">
                {formatTime(currentTime)}
              </span>
              
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                max={duration}
                step={1}
                className="flex-1"
              />
              
              <span className="text-xs text-muted-foreground min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Громкость */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            <Button variant="ghost" size="sm" onClick={toggleMute}>
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.01}
              className="w-20"
            />
          </div>
        </div>
      </Card>
    </>
  );
};

export default MusicPlayer;
