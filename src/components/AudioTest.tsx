import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause } from 'lucide-react';

const AudioTest: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [testUrl, setTestUrl] = useState('');

  const testAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio test error:', error);
    }
  };

  return (
    <Card className="p-4 m-4">
      <h3 className="text-lg font-semibold mb-4">Тест аудио</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">URL для тестирования:</label>
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Введите URL аудио файла"
            className="w-full p-2 border rounded"
          />
        </div>

        <audio
          ref={audioRef}
          src={testUrl}
          preload="metadata"
          crossOrigin="anonymous"
          onError={(e) => console.error('Audio error:', e)}
          onLoadedMetadata={() => console.log('Audio metadata loaded')}
          onCanPlay={() => console.log('Audio can play')}
        />

        <Button onClick={testAudio} className="gap-2">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Пауза' : 'Воспроизведение'}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>URL: {testUrl || 'Не указан'}</p>
          <p>Состояние: {isPlaying ? 'Воспроизводится' : 'Остановлено'}</p>
        </div>
      </div>
    </Card>
  );
};

export default AudioTest;
