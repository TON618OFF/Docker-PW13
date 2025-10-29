import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings as SettingsIcon, User, Save, Eye, EyeOff, Heart, Music, Disc, ListMusic, Lock, Globe } from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import DatabaseStatus from "@/components/DatabaseStatus";
import DatabaseViewer from "@/components/DatabaseViewer";
import StorageInitializer from "@/components/StorageInitializer";

const Settings = () => {
  const { theme, language, setTheme, setLanguage } = useAppSettings();
  const [profile, setProfile] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
    avatar_url: "",
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Избранное
  const [favoriteTracks, setFavoriteTracks] = useState<any[]>([]);
  const [favoriteAlbums, setFavoriteAlbums] = useState<any[]>([]);
  const [favoritePlaylists, setFavoritePlaylists] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchFavorites();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
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
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Загружаем избранные треки
      const { data: tracksData } = await supabase
        .from("favorites_tracks")
        .select(`
          id,
          track:tracks(
            id,
            track_title,
            track_duration,
            album:albums(
              album_title,
              artist:artists(artist_name)
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Загружаем избранные альбомы
      const { data: albumsData } = await supabase
        .from("favorites_albums")
        .select(`
          id,
          album:albums(
            id,
            album_title,
            album_cover_url,
            artist:artists(artist_name)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Загружаем избранные плейлисты
      const { data: playlistsData } = await supabase
        .from("favorites_playlists")
        .select(`
          id,
          playlist:playlists(
            id,
            playlist_title,
            playlist_cover_url,
            is_public
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setFavoriteTracks(tracksData?.map(item => item.track).filter(Boolean) || []);
      setFavoriteAlbums(albumsData?.map(item => item.album).filter(Boolean) || []);
      setFavoritePlaylists(playlistsData?.map(item => item.playlist).filter(Boolean) || []);
    } catch (error) {
      console.error("Ошибка загрузки избранного:", error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Проверяем уникальность username
      if (profile.username && profile.username.length < 3) {
        toast.error("Имя пользователя должно быть минимум 3 символа");
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
          avatar_url: profile.avatar_url.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Профиль сохранён");
    } catch (error: any) {
      toast.error(`Ошибка сохранения профиля: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user || !user.email) {
        toast.error("Email не найден");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings`,
      });

      if (error) throw error;
      toast.success("Ссылка для восстановления пароля отправлена на email");
    } catch (error: any) {
      toast.error(`Ошибка восстановления пароля: ${error.message}`);
    }
  };

  const toggleFavoriteTrack = async (trackId: string) => {
    try {
      const { data, error } = await supabase.rpc("toggle_favorite_track", {
        p_track_id: trackId,
      });

      if (error) throw error;
      fetchFavorites();
      toast.success(data.action === "added" ? "Трек добавлен в избранное" : "Трек удалён из избранного");
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    }
  };

  const toggleFavoriteAlbum = async (albumId: string) => {
    try {
      const { data, error } = await supabase.rpc("toggle_favorite_album", {
        p_album_id: albumId,
      });

      if (error) throw error;
      fetchFavorites();
      toast.success(data.action === "added" ? "Альбом добавлен в избранное" : "Альбом удалён из избранного");
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    }
  };

  const toggleFavoritePlaylist = async (playlistId: string) => {
    try {
      const { data, error } = await supabase.rpc("toggle_favorite_playlist", {
        p_playlist_id: playlistId,
      });

      if (error) throw error;
      fetchFavorites();
      toast.success(data.action === "added" ? "Плейлист добавлен в избранное" : "Плейлист удалён из избранного");
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Настройки
        </h1>
        <p className="text-muted-foreground">Управление вашим профилем и предпочтениями</p>
      </div>

      {/* Статус базы данных */}
      <DatabaseStatus />

      {/* Инициализация Storage */}
      <StorageInitializer />

      {/* Просмотр базы данных */}
      <DatabaseViewer />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="favorites">Избранное</TabsTrigger>
          <TabsTrigger value="appearance">Внешний вид</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 space-y-6 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Профиль пользователя</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя *</Label>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  placeholder="username"
                  required
                  minLength={3}
                  maxLength={50}
                  className="bg-input border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Имя</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder="Имя"
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Фамилия</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder="Фамилия"
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">Email нельзя изменить</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">О себе</Label>
                <textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Расскажите о себе..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL аватара</Label>
                <Input
                  id="avatar_url"
                  value={profile.avatar_url}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-input border-border"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4" />
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          <Card className="p-6 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <Heart className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Избранное</h2>
            </div>

            <Tabs defaultValue="tracks" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tracks">
                  <Music className="w-4 h-4 mr-2" />
                  Треки ({favoriteTracks.length})
                </TabsTrigger>
                <TabsTrigger value="albums">
                  <Disc className="w-4 h-4 mr-2" />
                  Альбомы ({favoriteAlbums.length})
                </TabsTrigger>
                <TabsTrigger value="playlists">
                  <ListMusic className="w-4 h-4 mr-2" />
                  Плейлисты ({favoritePlaylists.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tracks" className="mt-4">
                {loadingFavorites ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                  </div>
                ) : favoriteTracks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Нет избранных треков</p>
                ) : (
                  <div className="space-y-2">
                    {favoriteTracks.map((track: any) => (
                      <div key={track.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">{track.track_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {track.album?.artist?.artist_name} • {track.album?.album_title}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFavoriteTrack(track.id)}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="albums" className="mt-4">
                {loadingFavorites ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                  </div>
                ) : favoriteAlbums.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Нет избранных альбомов</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {favoriteAlbums.map((album: any) => (
                      <Card key={album.id} className="p-4">
                        {album.album_cover_url && (
                          <img src={album.album_cover_url} alt={album.album_title} className="w-full aspect-square object-cover rounded-lg mb-2" />
                        )}
                        <p className="font-medium truncate">{album.album_title}</p>
                        <p className="text-sm text-muted-foreground truncate">{album.artist?.artist_name}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 w-full"
                          onClick={() => toggleFavoriteAlbum(album.id)}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500 mr-2" />
                          Удалить из избранного
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="playlists" className="mt-4">
                {loadingFavorites ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                  </div>
                ) : favoritePlaylists.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Нет избранных плейлистов</p>
                ) : (
                  <div className="space-y-2">
                    {favoritePlaylists.map((playlist: any) => (
                      <div key={playlist.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          {playlist.playlist_cover_url ? (
                            <img src={playlist.playlist_cover_url} alt={playlist.playlist_title} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                              <ListMusic className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{playlist.playlist_title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {playlist.is_public ? (
                                <>
                                  <Globe className="w-3 h-3" />
                                  Публичный
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  Приватный
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFavoritePlaylist(playlist.id)}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="p-6 space-y-6 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Внешний вид</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Тема</Label>
                <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
                  <SelectTrigger id="theme" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Тёмная</SelectItem>
                    <SelectItem value="light">Светлая</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Язык интерфейса</Label>
                <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                  <SelectTrigger id="language" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="p-6 space-y-6 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Безопасность</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled
                    className="bg-input border-border pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Пароль нельзя просмотреть по соображениям безопасности</p>
              </div>

              <Button
                onClick={handlePasswordReset}
                variant="outline"
                className="w-full"
              >
                Отправить ссылку для восстановления пароля
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

type Theme = "dark" | "light";
type Language = "ru" | "en";

export default Settings;
