import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import ImageUpload from "./ImageUpload";
import { useRole } from "@/hooks/useRole";
import { useTranslation } from "@/hooks/useTranslation";

interface Artist {
  id: string;
  artist_name: string;
}

interface CreateAlbumDialogProps {
  artists: Artist[];
  onAlbumCreated: () => void;
}

const CreateAlbumDialog = ({ artists, onAlbumCreated }: CreateAlbumDialogProps) => {
  const { isDistributor, isArtist } = useRole();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableArtists, setAvailableArtists] = useState<Artist[]>([]);
  const [formData, setFormData] = useState({
    album_title: "",
    album_release_date: "",
    artist_id: "",
    album_cover_url: "",
    album_description: "",
  });

  useEffect(() => {
    if (open) {
      loadAvailableArtists();
    }
  }, [open, isArtist, isDistributor]);

  const loadAvailableArtists = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Для дистрибьютора - все артисты
      // Для артиста - только его артист
      if (isArtist && !isDistributor) {
        const { data: userArtists, error } = await supabase
          .from("artists")
          .select("id, artist_name")
          .eq("user_id", user.id)
          .order("artist_name");
        
        if (error) {
          // Если поле user_id еще не существует, используем все артисты
          console.warn("Поле user_id может отсутствовать в БД:", error);
          setAvailableArtists(artists);
        } else if (userArtists) {
          setAvailableArtists(userArtists);
        } else {
          setAvailableArtists([]);
        }
      } else {
        // Для дистрибьютора - все артисты
        setAvailableArtists(artists);
      }
    } catch (error) {
      console.error("Ошибка загрузки доступных артистов:", error);
      setAvailableArtists(artists);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.album_title.trim() || !formData.artist_id || !formData.album_release_date) {
      toast.error(t('album.create.fillAll'));
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error(t('album.create.loginRequired'));
        setLoading(false);
        return;
      }

      // Подготавливаем данные для вставки
      const albumData: any = {
        album_title: formData.album_title.trim(),
        album_release_date: formData.album_release_date,
        artist_id: formData.artist_id,
        album_cover_url: formData.album_cover_url.trim() || null,
        album_description: formData.album_description.trim() || null,
        is_public: true,
      };

      // Добавляем created_by только если поле существует в БД
      try {
        const { error: checkError } = await supabase
          .from("albums")
          .select("created_by")
          .limit(0);
        
        // Если запрос не вызвал ошибку структуры БД, поле существует
        if (!checkError || checkError.code !== "42703") {
          albumData.created_by = user.id;
        }
      } catch (e) {
        // Поле может отсутствовать, продолжаем без него
        console.warn("Поле created_by может отсутствовать в БД");
      }

      const { error } = await supabase.from("albums").insert(albumData);

      if (error) throw error;

      toast.success(t('album.create.success'));
      setFormData({ 
        album_title: "", 
        album_release_date: "", 
        artist_id: "", 
        album_cover_url: "", 
        album_description: "" 
      });
      setOpen(false);
      onAlbumCreated();
    } catch (error: any) {
      toast.error(`Ошибка создания альбома: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('albums.addAlbum')}
                </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('album.create.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="album_title">{t('album.create.nameLabel')}</Label>
            <Input
              id="album_title"
              value={formData.album_title}
              onChange={(e) => setFormData({ ...formData, album_title: e.target.value })}
              placeholder={t('album.create.namePlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist_id">{t('album.create.artistLabel')}</Label>
            <Select
              value={formData.artist_id}
              onValueChange={(value) => setFormData({ ...formData, artist_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('album.create.selectArtist')} />
              </SelectTrigger>
              <SelectContent>
                {availableArtists.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      {t('album.create.noArtists')}
                    </div>
                ) : (
                  availableArtists.map((artist) => (
                    <SelectItem key={artist.id} value={artist.id}>
                      {artist.artist_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="album_release_date">{t('album.create.releaseLabel')}</Label>
            <Input
              id="album_release_date"
              type="date"
              value={formData.album_release_date}
              onChange={(e) => setFormData({ ...formData, album_release_date: e.target.value })}
              required
            />
          </div>
          <ImageUpload
            currentUrl={formData.album_cover_url}
            onUploadComplete={(url) => setFormData({ ...formData, album_cover_url: url })}
            bucket="covers"
            maxSizeMB={5}
            aspectRatio="square"
          />
          <div className="space-y-2">
            <Label htmlFor="album_description">{t('album.create.descriptionLabel')}</Label>
            <Textarea
              id="album_description"
              value={formData.album_description}
              onChange={(e) => setFormData({ ...formData, album_description: e.target.value })}
              placeholder={t('album.create.descriptionPlaceholder')}
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAlbumDialog;

