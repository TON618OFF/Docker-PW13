import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, Save, Mail, Calendar, Clock, Award, Music2, Heart, Edit, Play, History } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { Badge } from "@/components/ui/badge";
import BecomeArtistForm from "@/components/BecomeArtistForm";
import { useRole } from "@/hooks/useRole";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Track } from "@/types";

const Profile = () => {
  const navigate = useNavigate();
  const { isListener } = useRole();
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
    avatar_url: "",
    role_name: "",
    created_at: "",
    last_login: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    tracksCount: 0,
    playlistsCount: 0,
    favoritesCount: 0,
  });
  const [listeningHistory, setListeningHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { playTrack } = usePlayer();

  useEffect(() => {
    fetchProfile();
    fetchStats();
    fetchListeningHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: userData, error } = await supabase
        .from("users")
        .select(`
          *,
          role:roles(role_name)
        `)
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (userData) {
        setProfile({
          username: userData.username || "",
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: user.email || "",
          bio: userData.bio || "",
          avatar_url: userData.avatar_url || "",
          role_name: userData.role?.role_name || "",
          created_at: userData.created_at || "",
          last_login: userData.last_login || "",
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const [tracksRes, playlistsRes, favoritesRes] = await Promise.all([
        supabase
          .from("tracks")
          .select("id", { count: "exact", head: true })
          .eq("uploaded_by", user.id),
        supabase
          .from("playlists")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("favorites_tracks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      setStats({
        tracksCount: tracksRes.count || 0,
        playlistsCount: playlistsRes.count || 0,
        favoritesCount: favoritesRes.count || 0,
      });
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
    }
  };

  const fetchListeningHistory = async () => {
    setLoadingHistory(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: historyData, error } = await supabase
        .from("listening_history")
        .select(`
          id,
          listened_at,
          duration_played,
          completed,
          track:tracks(
            id,
            track_title,
            track_duration,
            track_audio_url,
            album:albums(
              id,
              album_title,
              album_cover_url,
              artist:artists(
                id,
                artist_name
              )
            )
          )
        `)
        .eq("user_id", user.id)
        .order("listened_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setListeningHistory(historyData || []);
    } catch (error: any) {
      console.error("Ошибка загрузки истории:", error);
      toast.error(t('profile.listeningHistory.error'));
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayTrack = (historyItem: any) => {
    if (historyItem.track) {
      const track = historyItem.track;
      // Преобразуем данные трека в формат Track
      const trackData: Track = {
        id: track.id,
        track_title: track.track_title,
        track_duration: track.track_duration,
        track_play_count: 0,
        track_like_count: 0,
        track_audio_url: track.track_audio_url,
        album: {
          id: track.album?.id || '',
          album_title: track.album?.album_title || '',
          album_cover_url: track.album?.album_cover_url || null,
          artist: {
            id: track.album?.artist?.id || '',
            artist_name: track.album?.artist?.artist_name || '',
          },
        },
        genres: [],
      };
      playTrack(trackData);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      if (profile.username && profile.username.length < 3) {
        toast.error(t('profile.usernameMinLength'));
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          username: profile.username.trim(),
          first_name: profile.first_name.trim() || null,
          last_name: profile.last_name.trim() || null,
          bio: profile.bio.trim() || null,
          avatar_url: profile.avatar_url || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(t('profile.saveSuccess'));
    } catch (error: any) {
      toast.error(t('profile.errorSave', { message: error.message }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Hero Section */}
      <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-primary/50 object-cover shadow-2xl"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-primary/50 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-2xl">
                <User className="w-12 h-12 sm:w-16 sm:h-16 text-primary/50" />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2">
              <Badge className="bg-primary text-primary-foreground shadow-lg text-xs sm:text-sm">
                {profile.role_name || t('profile.user')}
              </Badge>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.username}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-4 truncate">@{profile.username}</p>
            {profile.bio && (
              <p className="text-muted-foreground mb-4">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{profile.email}</span>
              </div>
              {profile.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('profile.registration')}: {new Date(profile.created_at).toLocaleDateString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US")}</span>
                </div>
              )}
              {profile.last_login && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{t('profile.lastLogin')}: {new Date(profile.last_login).toLocaleDateString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:scale-105 transition-transform cursor-pointer"
          onClick={() => navigate("/profile/my-tracks")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.myTracks')}</p>
              <p className="text-3xl font-bold text-primary mt-1">{stats.tracksCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:scale-105 transition-transform cursor-pointer"
          onClick={() => navigate("/profile/my-playlists")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.myPlaylists')}</p>
              <p className="text-3xl font-bold text-secondary mt-1">{stats.playlistsCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:scale-105 transition-transform cursor-pointer"
          onClick={() => navigate("/profile/my-favorites")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.favorites')}</p>
              <p className="text-3xl font-bold text-accent mt-1">{stats.favoritesCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Profile Form */}
      <Card className="p-6 space-y-6 bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">{t('profile.edit')}</h2>
          </div>
          <Button
            onClick={() => navigate("/settings")}
            variant="outline"
            size="sm"
          >
            {t('settings.title')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t('profile.username')} {t('common.required')}</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder={t('profile.username')}
              required
              minLength={3}
              maxLength={50}
              className="bg-input border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t('profile.firstName')}</Label>
              <Input
                id="first_name"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                placeholder={t('profile.firstNamePlaceholder')}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{t('profile.lastName')}</Label>
              <Input
                id="last_name"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                placeholder={t('profile.lastNamePlaceholder')}
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t('profile.bio')}</Label>
            <textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder={t('profile.bioPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md bg-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url">Аватар</Label>
            <ImageUpload
              currentUrl={profile.avatar_url}
              onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
              bucket="avatars"
              maxSizeMB={5}
              aspectRatio="square"
            />
          </div>
        </div>

        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full gap-2 bg-primary hover:bg-primary/90"
        >
          <Save className="w-4 h-4" />
          {saving ? t('profile.saving') : t('profile.save')}
        </Button>
      </Card>

      {/* Listening History Section */}
      <Card className="p-6 space-y-6 bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">{t('profile.listeningHistory.title')}</h2>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <span className="ml-3 text-muted-foreground">{t('profile.listeningHistory.loading')}</span>
          </div>
        ) : listeningHistory.length === 0 ? (
          <div className="text-center py-12">
            <Music2 className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-semibold text-muted-foreground mb-2">
              {t('profile.listeningHistory.empty')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('profile.listeningHistory.emptyMessage')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {listeningHistory.map((historyItem) => {
              if (!historyItem.track) return null;
              const track = historyItem.track;
              return (
                <div
                  key={historyItem.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-card/50 transition-colors group"
                >
                  {track.album?.album_cover_url ? (
                    <img
                      src={track.album.album_cover_url}
                      alt={track.album.album_title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Music2 className="w-8 h-8 text-primary/50" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{track.track_title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.album?.artist?.artist_name} • {track.album?.album_title}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {t('profile.listeningHistory.played')}: {formatDuration(historyItem.duration_played || 0)}
                          {track.track_duration && ` / ${formatDuration(track.track_duration)}`}
                        </span>
                      </div>
                      {historyItem.completed ? (
                        <Badge variant="default" className="text-xs">
                          {t('profile.listeningHistory.completed')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {t('profile.listeningHistory.notCompleted')}
                        </Badge>
                      )}
                      <span>
                        {new Date(historyItem.listened_at).toLocaleString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US")}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePlayTrack(historyItem)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={!track.track_audio_url}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Become Artist Section */}
      {isListener && (
        <BecomeArtistForm />
      )}
    </div>
  );
};

export default Profile;

