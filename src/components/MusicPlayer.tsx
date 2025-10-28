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

interface MusicPlayerProps {
  track?: Track;
  onTrackEnd?: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ track, onTrackEnd }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { nextTrack, previousTrack, playlist } = usePlayer();

  // Получаем подписанный URL для приватного файла
  const getSignedUrl = async (filePath: string): Promise<string> => {
    try {
      // Проверяем, что filePath существует и является строкой
      if (!filePath || typeof filePath !== 'string') {
        console.error('Invalid file path:', filePath);
        toast.error('Неверный путь к аудио файлу');
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
        toast.error('Локальные файлы не поддерживаются для воспроизведения');
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
        toast.error('Ошибка загрузки аудио файла');
        return '';
      }

      console.log('Signed URL created:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Ошибка получения подписанного URL:', error);
      toast.error('Ошибка загрузки аудио файла');
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

  // Загружаем трек
  useEffect(() => {
    if (!track || !track.track_audio_url) return;

    const loadTrack = async () => {
      setIsLoading(true);
      try {
        console.log('Loading track with URL:', track.track_audio_url);
        const signedUrl = await getSignedUrl(track.track_audio_url);
        if (signedUrl) {
          setAudioUrl(signedUrl);
          setDuration(track.track_duration);
          console.log('Audio URL is set:', signedUrl);
        } else {
          console.error('Failed to get audio URL');
          toast.error('Не удалось получить ссылку на аудио файл');
        }
      } catch (error) {
        console.error('Ошибка загрузки трека:', error);
        toast.error('Ошибка загрузки трека');
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

    const handleCanPlay = () => {
      console.log('Audio can play');
    };

    const handleEnded = () => {
      console.log('Audio ended, repeat mode:', repeatMode);
      
      if (repeatMode === 'one') {
        // Повторяем текущий трек
        console.log('Repeating current track');
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        }
      } else if (repeatMode === 'all') {
        // Переходим к следующему треку в плейлисте
        console.log('Repeating playlist - going to next track');
        if (playlist.length > 0) {
          nextTrack();
        } else {
          // Если плейлист пустой, повторяем текущий трек
          const audio = audioRef.current;
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(console.error);
          }
        }
      } else {
        // Обычное поведение - переходим к следующему треку или останавливаем
        console.log('Normal playback - going to next track or stopping');
        if (playlist.length > 0) {
          nextTrack();
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
          onTrackEnd?.();
        }
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      console.error('Audio error details:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src
      });
      toast.error('Ошибка воспроизведения аудио');
      setIsPlaying(false);
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
  }, [audioUrl, onTrackEnd]);

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
    } else {
      try {
        // Проверяем готовность аудио
        if (audio.readyState < 2) {
          console.log('Audio not ready, waiting...');
          toast.info('Загрузка аудио...');
          return;
        }

        await audio.play();
        setIsPlaying(true);
        console.log('Audio started playing');
        
        // Логируем прослушивание
        await logListening();
      } catch (error: any) {
        console.error('Ошибка воспроизведения:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
        
        if (error.name === 'NotSupportedError') {
          toast.error('Формат аудио не поддерживается браузером');
        } else if (error.name === 'NotAllowedError') {
          toast.error('Автовоспроизведение заблокировано браузером');
        } else {
          toast.error(`Ошибка воспроизведения: ${error.message}`);
        }
      }
    }
  };

  // Логирование прослушивания
  const logListening = async () => {
    if (!track) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      await supabase.from('listening_history').insert({
        user_id: user.id,
        track_id: track.id,
        duration_played: Math.floor(currentTime),
        completed: false
      });
    } catch (error) {
      console.error('Ошибка логирования прослушивания:', error);
    }
  };

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
          Выберите трек для воспроизведения
        </div>
      </Card>
    );
  }

  return (
    <>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata"
        crossOrigin="anonymous"
        onError={(e) => console.error('Audio element error:', e)}
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

            <Button variant="ghost" size="sm">
              <Heart className="w-4 h-4" />
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
                  repeatMode === 'none' ? 'Повтор: Выключен' :
                  repeatMode === 'one' ? 'Повтор: Один трек' :
                  'Повтор: Весь плейлист'
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
