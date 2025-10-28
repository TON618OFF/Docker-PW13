export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          role_name: string
          role_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          role_name: string
          role_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role_name?: string
          role_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          username: string
          first_name: string | null
          last_name: string | null
          role_id: string | null
          avatar_url: string | null
          bio: string | null
          language: string
          is_active: boolean
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          username: string
          first_name?: string | null
          last_name?: string | null
          role_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          language?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          username?: string
          first_name?: string | null
          last_name?: string | null
          role_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          language?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      artists: {
        Row: {
          id: string
          artist_name: string
          artist_bio: string | null
          artist_image_url: string | null
          genre: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_name: string
          artist_bio?: string | null
          artist_image_url?: string | null
          genre?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_name?: string
          artist_bio?: string | null
          artist_image_url?: string | null
          genre?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      genres: {
        Row: {
          id: string
          genre_name: string
          genre_description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          genre_name: string
          genre_description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          genre_name?: string
          genre_description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      albums: {
        Row: {
          id: string
          album_title: string
          album_release_date: string
          artist_id: string
          album_cover_url: string | null
          album_description: string | null
          is_public: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          album_title: string
          album_release_date: string
          artist_id: string
          album_cover_url?: string | null
          album_description?: string | null
          is_public?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          album_title?: string
          album_release_date?: string
          artist_id?: string
          album_cover_url?: string | null
          album_description?: string | null
          is_public?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      tracks: {
        Row: {
          id: string
          track_title: string
          track_duration: number
          album_id: string
          track_audio_url: string
          track_order: number
          track_play_count: number
          track_like_count: number
          is_public: boolean
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          track_title: string
          track_duration: number
          album_id: string
          track_audio_url: string
          track_order?: number
          track_play_count?: number
          track_like_count?: number
          is_public?: boolean
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          track_title?: string
          track_duration?: number
          album_id?: string
          track_audio_url?: string
          track_order?: number
          track_play_count?: number
          track_like_count?: number
          is_public?: boolean
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      playlists: {
        Row: {
          id: string
          playlist_title: string
          playlist_description: string | null
          user_id: string
          playlist_cover_url: string | null
          is_public: boolean
          is_active: boolean
          follow_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          playlist_title: string
          playlist_description?: string | null
          user_id: string
          playlist_cover_url?: string | null
          is_public?: boolean
          is_active?: boolean
          follow_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          playlist_title?: string
          playlist_description?: string | null
          user_id?: string
          playlist_cover_url?: string | null
          is_public?: boolean
          is_active?: boolean
          follow_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      track_genres: {
        Row: {
          id: string
          track_id: string
          genre_id: string
          created_at: string
        }
        Insert: {
          id?: string
          track_id: string
          genre_id: string
          created_at?: string
        }
        Update: {
          id?: string
          track_id?: string
          genre_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_genres_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          }
        ]
      }
      playlist_tracks: {
        Row: {
          id: string
          playlist_id: string
          track_id: string
          order_position: number
          added_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          track_id: string
          order_position: number
          added_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          track_id?: string
          order_position?: number
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          }
        ]
      }
      listening_history: {
        Row: {
          id: string
          user_id: string
          track_id: string
          listened_at: string
          duration_played: number | null
          completed: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          track_id: string
          listened_at?: string
          duration_played?: number | null
          completed?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          track_id?: string
          listened_at?: string
          duration_played?: number | null
          completed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "listening_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listening_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action_type: string
          table_name: string
          record_id: string | null
          old_value: Json | null
          new_value: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action_type: string
          table_name: string
          record_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action_type?: string
          table_name?: string
          record_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      album_duration: {
        Row: {
          id: string
          album_title: string
          artist_id: string
          artist_name: string
          album_release_date: string
          total_duration_seconds: number
          track_count: number
          created_at: string
          updated_at: string
        }
        Relationships: []
      }
      playlist_duration: {
        Row: {
          id: string
          playlist_title: string
          user_id: string
          username: string
          is_public: boolean
          follow_count: number
          total_duration_seconds: number
          track_count: number
          created_at: string
          updated_at: string
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          id: string
          username: string
          email: string | null
          role_name: string | null
          created_at: string
          last_login: string | null
          playlist_count: number
          total_listens: number
          unique_tracks_listened: number
        }
        Relationships: []
      }
      track_statistics: {
        Row: {
          id: string
          track_title: string
          track_duration: number
          track_play_count: number
          track_like_count: number
          album_title: string | null
          artist_name: string | null
          created_at: string
          is_public: boolean
          popularity_level: string
        }
        Relationships: []
      }
    }
    Functions: {
      add_track_to_playlist: {
        Args: {
          _playlist_id: string
          _track_id: string
          _position?: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "слушатель" | "администратор" | "артист" | "дистрибьютор" | "модератор"
      audio_format: "mp3" | "wav" | "flac" | "ogg" | "m4a"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["слушатель", "администратор", "артист", "дистрибьютор", "модератор"],
      audio_format: ["mp3", "wav", "flac", "ogg", "m4a"],
    },
  },
} as const


