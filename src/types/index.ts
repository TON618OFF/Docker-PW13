export interface Track {
  id: string;
  track_title: string;
  track_duration: number;
  track_play_count: number;
  track_like_count: number;
  track_audio_url: string;
  album: {
    id: string;
    album_title: string;
    album_cover_url: string | null;
    artist: {
      id: string;
      artist_name: string;
    };
  };
  genres: Array<{
    id: string;
    genre_name: string;
  }>;
  created_at?: string;
}

export interface Artist {
  id: string;
  artist_name: string;
  artist_bio?: string;
  created_at: string;
}

export interface Album {
  id: string;
  album_title: string;
  album_release_date?: string;
  album_cover_url?: string | null;
  artist_id: string;
  created_at: string;
  artist?: Artist;
}

export interface Genre {
  id: string;
  genre_name: string;
  genre_description?: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  playlist_name: string;
  playlist_description?: string;
  user_id: string;
  created_at: string;
  song_count?: number;
}

export interface User {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role_id: string;
  created_at: string;
  last_login?: string;
}
