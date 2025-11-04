import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import DatabaseStatus from "@/components/DatabaseStatus";
import StorageInitializer from "@/components/StorageInitializer";
import DatabaseViewer from "@/components/DatabaseViewer";
import {
  Users,
  Music,
  ListMusic,
  UserPlus,
  Trash2,
  Edit,
  Search,
  Shield,
  Crown,
  User
} from "lucide-react";

interface User {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
  role_name: string;
  created_at: string;
  last_login: string | null;
}

interface Stats {
  totalUsers: number;
  totalTracks: number;
  totalPlaylists: number;
  totalArtists: number;
  totalAlbums: number;
}

const AdminPanel = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTracks: 0,
    totalPlaylists: 0,
    totalArtists: 0,
    totalAlbums: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResult, tracksResult, playlistsResult, artistsResult, albumsResult] = await Promise.all([
        supabase
          .from("users")
          .select(`
            id,
            username,
            first_name,
            last_name,
            created_at,
            last_login,
            role:roles(role_name)
          `, { count: "exact" })
          .order("created_at", { ascending: false }),
        supabase
          .from("tracks")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("playlists")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("artists")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("albums")
          .select("id", { count: "exact", head: true })
      ]);

      if (usersResult.data) {
        const usersWithRoles = usersResult.data.map((user: any) => ({
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: '', // Email недоступен из public.users, можно получить через RPC если нужно
          role_name: user.role?.role_name || t('admin.role.listener'),
          created_at: user.created_at,
          last_login: user.last_login
        }));
        setUsers(usersWithRoles);
      }

      setStats({
        totalUsers: usersResult.count || 0,
        totalTracks: tracksResult.count || 0,
        totalPlaylists: playlistsResult.count || 0,
        totalArtists: artistsResult.count || 0,
        totalAlbums: albumsResult.count || 0
      });
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoleName: string) => {
    try {
      // Получаем ID роли
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("role_name", newRoleName)
        .single();

      if (roleError || !roleData) {
        console.error("Ошибка получения роли:", roleError);
        toast.error(t('admin.roleNotFound'));
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ role_id: roleData.id })
        .eq("id", userId);

      if (updateError) {
        console.error("Ошибка обновления роли:", updateError);
        toast.error(`${t('admin.roleUpdateError')}: ${updateError.message}`);
        return;
      }

      toast.success(t('admin.roleUpdateSuccess'));
      fetchData();
    } catch (error: any) {
      console.error("Неожиданная ошибка при изменении роли:", error);
      toast.error(`${t('admin.roleUpdateError')}: ${error.message || t('admin.unknownError')}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('admin.deleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast.success(t('admin.deleteSuccess'));
      fetchData();
    } catch (error: any) {
      toast.error(`${t('admin.deleteError')}: ${error.message}`);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "администратор":
        return <Crown className="w-4 h-4 text-red-500" />;
      case "дистрибьютор":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "артист":
        return <Music className="w-4 h-4 text-purple-500" />;
      case "модератор":
        return <Shield className="w-4 h-4 text-orange-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "администратор":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "дистрибьютор":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "артист":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "модератор":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => a.username.localeCompare(b.username));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Crown className="w-8 h-8 text-red-500 flex-shrink-0" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('admin.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.stats.users')}</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.stats.tracks')}</p>
              <p className="text-2xl font-bold">{stats.totalTracks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ListMusic className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.stats.playlists')}</p>
              <p className="text-2xl font-bold">{stats.totalPlaylists}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.stats.artists')}</p>
              <p className="text-2xl font-bold">{stats.totalArtists}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.stats.albums')}</p>
              <p className="text-2xl font-bold">{stats.totalAlbums}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Статус базы данных */}
      <DatabaseStatus />

      {/* Инициализация Storage */}
      <StorageInitializer />

      {/* Просмотр базы данных */}
      <DatabaseViewer />

      {/* Управление пользователями */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('admin.userManagement')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-card/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold truncate">
                          @{user.username}
                        </h3>
                        <Badge className={getRoleBadgeColor(user.role_name)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role_name)}
                            <span className="hidden sm:inline">{user.role_name}</span>
                          </div>
                        </Badge>
                      </div>
                      {(user.first_name || user.last_name) && (
                        <p className="text-sm text-muted-foreground truncate">
                          {user.first_name || ''} {user.last_name || ''}
                        </p>
                      )}
                      {user.email && <p className="text-sm text-muted-foreground truncate">{user.email}</p>}
                      <p className="text-xs text-muted-foreground">
                        {t('admin.registration')}: {new Date(user.created_at).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select
                      value={user.role_name}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="слушатель">{t('admin.role.listener')}</SelectItem>
                        <SelectItem value="дистрибьютор">{t('admin.role.distributor')}</SelectItem>
                        <SelectItem value="администратор">{t('admin.role.admin')}</SelectItem>
                        <SelectItem value="артист">{t('admin.role.artist')}</SelectItem>
                        <SelectItem value="модератор">{t('admin.role.moderator')}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteUser(user.id)}
                      className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
