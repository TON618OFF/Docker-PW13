import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Track } from '@/types';

interface PlayerContextType {
  currentTrack: Track | null;
  setCurrentTrack: (track: Track | null) => void;
  playTrack: (track: Track) => void;
  playlist: Track[];
  setPlaylist: (tracks: Track[]) => void;
  currentTrackIndex: number;
  setCurrentTrackIndex: (index: number) => void;
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

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    // Находим индекс трека в текущем плейлисте
    const index = playlist.findIndex(t => t.id === track.id);
    if (index !== -1) {
      setCurrentTrackIndex(index);
    }
  };

  const nextTrack = () => {
    if (playlist.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % playlist.length;
      setCurrentTrackIndex(nextIndex);
      setCurrentTrack(playlist[nextIndex]);
    }
  };

  const previousTrack = () => {
    if (playlist.length > 0) {
      const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      setCurrentTrack(playlist[prevIndex]);
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
    nextTrack,
    previousTrack,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};
