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
import ImageUpload from "./ImageUpload";
import { useTranslation } from "@/hooks/useTranslation";

interface CreatePlaylistDialogProps {
  onPlaylistCreated?: () => void;
}

const CreatePlaylistDialog = ({ onPlaylistCreated }: CreatePlaylistDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    playlist_title: "",
    playlist_description: "",
    playlist_cover_url: "",
    is_public: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.playlist_title.trim()) {
      toast.error(t('playlists.name') + ' ' + t('common.confirm'));
      return;
    }

    if (formData.playlist_title.length < 2 || formData.playlist_title.length > 100) {
      toast.error(t('playlists.name') + ' должно быть от 2 до 100 символов');
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error(t('playlist.create.loginRequired'));
        return;
      }

      // Убеждаемся, что пользователь существует в public.users
      await supabase.rpc('ensure_user_exists');

      const { error } = await supabase
        .from("playlists")
        .insert({
          playlist_title: formData.playlist_title.trim(),
          playlist_description: formData.playlist_description.trim() || null,
          playlist_cover_url: formData.playlist_cover_url || null,
          is_public: formData.is_public,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success(t('messages.created'));
      setFormData({ playlist_title: "", playlist_description: "", playlist_cover_url: "", is_public: false });
      setOpen(false);
      onPlaylistCreated?.();
    } catch (error: any) {
      toast.error(`${t('playlist.create.error')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          {t('playlists.create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            {t('playlists.createNew')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist_title">{t('playlists.name')} *</Label>
            <Input
              id="playlist_title"
              value={formData.playlist_title}
              onChange={(e) => setFormData({ ...formData, playlist_title: e.target.value })}
              placeholder={t('playlists.name')}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist_description">{t('playlists.description')}</Label>
            <Textarea
              id="playlist_description"
              value={formData.playlist_description}
              onChange={(e) => setFormData({ ...formData, playlist_description: e.target.value })}
              placeholder={t('playlists.description')}
              rows={3}
            />
          </div>

          <ImageUpload
            currentUrl={formData.playlist_cover_url}
            onUploadComplete={(url) => setFormData({ ...formData, playlist_cover_url: url })}
            bucket="covers"
            maxSizeMB={5}
            aspectRatio="square"
          />

          <div className="flex items-center justify-between">
            <Label htmlFor="is_public">{t('playlists.public')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? t('common.loading') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlaylistDialog;

