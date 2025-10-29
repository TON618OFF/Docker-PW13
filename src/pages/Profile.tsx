import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, Save, Mail, Calendar, Clock, Award, Music2, Heart, Edit } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchProfile();
    fetchStats();
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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

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
          avatar_url: profile.avatar_url || null,
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
      <Card className="p-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-32 h-32 rounded-full border-4 border-primary/50 object-cover shadow-2xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-primary/50 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-2xl">
                <User className="w-16 h-16 text-primary/50" />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2">
              <Badge className="bg-primary text-primary-foreground shadow-lg">
                {profile.role_name || "Пользователь"}
              </Badge>
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.username}
            </h1>
            <p className="text-xl text-muted-foreground mb-4">@{profile.username}</p>
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
                  <span>Регистрация: {new Date(profile.created_at).toLocaleDateString("ru-RU")}</span>
                </div>
              )}
              {profile.last_login && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Последний вход: {new Date(profile.last_login).toLocaleDateString("ru-RU")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Мои треки</p>
              <p className="text-3xl font-bold text-primary mt-1">{stats.tracksCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Мои плейлисты</p>
              <p className="text-3xl font-bold text-secondary mt-1">{stats.playlistsCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">В избранном</p>
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
            <h2 className="text-xl font-semibold">Редактировать профиль</h2>
          </div>
          <Button
            onClick={() => navigate("/settings")}
            variant="outline"
            size="sm"
          >
            Все настройки
          </Button>
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
          {saving ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </Card>
    </div>
  );
};

export default Profile;

