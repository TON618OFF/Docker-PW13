import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Music } from "lucide-react";

interface CreatePlaylistDialogProps {
  onPlaylistCreated?: () => void;
}

const CreatePlaylistDialog = ({ onPlaylistCreated }: CreatePlaylistDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    playlist_title: "",
    playlist_description: "",
    is_public: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.playlist_title.trim()) {
      toast.error("Название плейлиста обязательно");
      return;
    }

    if (formData.playlist_title.length < 2 || formData.playlist_title.length > 100) {
      toast.error("Название плейлиста должно быть от 2 до 100 символов");
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Необходимо войти в систему");
        return;
      }

      // Убеждаемся, что пользователь существует в public.users
      await supabase.rpc('ensure_user_exists');

      const { error } = await supabase
        .from("playlists")
        .insert({
          playlist_title: formData.playlist_title.trim(),
          playlist_description: formData.playlist_description.trim() || null,
          is_public: formData.is_public,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success("Плейлист создан успешно!");
      setFormData({ playlist_title: "", playlist_description: "", is_public: false });
      setOpen(false);
      onPlaylistCreated?.();
    } catch (error: any) {
      toast.error(`Ошибка создания плейлиста: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Создать плейлист
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Создать новый плейлист
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist_title">Название *</Label>
            <Input
              id="playlist_title"
              value={formData.playlist_title}
              onChange={(e) => setFormData({ ...formData, playlist_title: e.target.value })}
              placeholder="Введите название плейлиста"
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist_description">Описание</Label>
            <Textarea
              id="playlist_description"
              value={formData.playlist_description}
              onChange={(e) => setFormData({ ...formData, playlist_description: e.target.value })}
              placeholder="Описание плейлиста (необязательно)"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_public">Публичный плейлист</Label>
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Создание..." : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlaylistDialog;

