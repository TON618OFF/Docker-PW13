import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings as SettingsIcon, User, Save } from "lucide-react";
import DatabaseStatus from "@/components/DatabaseStatus";
import DatabaseViewer from "@/components/DatabaseViewer";
import StorageInitializer from "@/components/StorageInitializer";

const Settings = () => {
  const [profile, setProfile] = useState({
    display_name: "",
    theme: "dark",
    language: "ru",
    page_size: 20,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          display_name: data.display_name || "",
          theme: data.theme || "dark",
          language: data.language || "ru",
          page_size: data.page_size || 20,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Настройки сохранены");
    } catch (error: any) {
      toast.error("Ошибка сохранения настроек");
    } finally {
      setSaving(false);
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

      <Card className="p-6 space-y-6 bg-card/50 backdrop-blur">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Профиль</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Отображаемое имя</Label>
            <Input
              id="display_name"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Введите имя"
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Тема</Label>
            <Select
              value={profile.theme}
              onValueChange={(value) => setProfile({ ...profile, theme: value })}
            >
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
            <Label htmlFor="language">Язык</Label>
            <Select
              value={profile.language}
              onValueChange={(value) => setProfile({ ...profile, language: value })}
            >
              <SelectTrigger id="language" className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="page_size">Элементов на странице</Label>
            <Select
              value={profile.page_size.toString()}
              onValueChange={(value) => setProfile({ ...profile, page_size: parseInt(value) })}
            >
              <SelectTrigger id="page_size" className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSave}
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

export default Settings;
