import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Track } from '@/types';

interface PlayerContextType {
  currentTrack: Track | null;
  setCurrentTrack: (track: Track | null) => void;
  playTrack: (track: Track) => void;
  playlist: Track[];
  setPlaylist: (tracks: Track[]) => void;
  currentTrackIndex: number;
  setCurrentTrackIndex: (index: number) => void;
  isShuffled: boolean;
  setIsShuffled: (shuffled: boolean) => void;
  shuffledPlaylist: Track[];
  nextTrack: () => void;
  previousTrack: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Track[]>([]);

  // Функция для перемешивания плейлиста
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    // Находим индекс трека в текущем плейлисте (обычном или перемешанном)
    const activePlaylist = isShuffled ? shuffledPlaylist : playlist;
    const index = activePlaylist.findIndex(t => t.id === track.id);
    if (index !== -1) {
      setCurrentTrackIndex(index);
    }
  };

  const nextTrack = () => {
    const activePlaylist = isShuffled ? shuffledPlaylist : playlist;
    if (activePlaylist.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % activePlaylist.length;
      setCurrentTrackIndex(nextIndex);
      setCurrentTrack(activePlaylist[nextIndex]);
    }
  };

  const previousTrack = () => {
    const activePlaylist = isShuffled ? shuffledPlaylist : playlist;
    if (activePlaylist.length > 0) {
      const prevIndex = currentTrackIndex === 0 ? activePlaylist.length - 1 : currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      setCurrentTrack(activePlaylist[prevIndex]);
    }
  };

  // Обновляем перемешанный плейлист при изменении обычного плейлиста
  useEffect(() => {
    if (playlist.length > 0 && isShuffled) {
      const shuffled = shuffleArray(playlist);
      setShuffledPlaylist(shuffled);
      // Обновляем индекс текущего трека в перемешанном плейлисте
      if (currentTrack) {
        const newIndex = shuffled.findIndex(t => t.id === currentTrack.id);
        if (newIndex !== -1) {
          setCurrentTrackIndex(newIndex);
        }
      }
    }
  }, [playlist, isShuffled, currentTrack]);

  // При включении shuffle перемешиваем плейлист
  const handleSetIsShuffled = (shuffled: boolean) => {
    setIsShuffled(shuffled);
    if (shuffled && playlist.length > 0) {
      const shuffled = shuffleArray(playlist);
      setShuffledPlaylist(shuffled);
      // Обновляем индекс текущего трека в перемешанном плейлисте
      if (currentTrack) {
        const newIndex = shuffled.findIndex(t => t.id === currentTrack.id);
        if (newIndex !== -1) {
          setCurrentTrackIndex(newIndex);
        }
      }
    }
  };

  const value: PlayerContextType = {
    currentTrack,
    setCurrentTrack,
    playTrack,
    playlist,
    setPlaylist,
    currentTrackIndex,
    setCurrentTrackIndex,
    isShuffled,
    setIsShuffled: handleSetIsShuffled,
    shuffledPlaylist,
    nextTrack,
    previousTrack,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};
