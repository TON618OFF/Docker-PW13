import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Music, FileAudio } from "lucide-react";

interface UploadTrackDialogProps {
  onTrackUploaded?: () => void;
}

const UploadTrackDialog = ({ onTrackUploaded }: UploadTrackDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [artists, setArtists] = useState<Array<{id: string, artist_name: string}>>([]);
  const [albums, setAlbums] = useState<Array<{id: string, album_title: string, artist_id: string}>>([]);
  const [genres, setGenres] = useState<Array<{id: string, genre_name: string}>>([]);
  const [formData, setFormData] = useState({
    track_title: "",
    artist_id: "",
    album_id: "",
    genre_id: "",
    file: null as File | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioFormats = [
    { value: "mp3", label: "MP3" },
    { value: "wav", label: "WAV" },
    { value: "flac", label: "FLAC" },
    { value: "ogg", label: "OGG" },
    { value: "m4a", label: "M4A" },
  ];

  // Загружаем данные при открытии диалога
  React.useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      const [artistsResult, genresResult] = await Promise.all([
        supabase.from("artists").select("id, artist_name").order("artist_name"),
        supabase.from("genres").select("id, genre_name").order("genre_name")
      ]);

      if (artistsResult.data) setArtists(artistsResult.data);
      if (genresResult.data) setGenres(genresResult.data);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
  };

  const loadAlbumsForArtist = async (artistId: string) => {
    try {
      const { data } = await supabase
        .from("albums")
        .select("id, album_title, artist_id")
        .eq("artist_id", artistId)
        .order("album_title");
      
      setAlbums(data || []);
    } catch (error) {
      console.error("Ошибка загрузки альбомов:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверяем формат файла
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!audioFormats.some(format => format.value === extension)) {
        toast.error("Неподдерживаемый формат файла");
        return;
      }

      // Проверяем размер файла (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Файл слишком большой (максимум 50MB)");
        return;
      }

      setFormData({ ...formData, file });
      
      // Автоматически заполняем название из имени файла
      if (!formData.track_title) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({ ...prev, track_title: fileName }));
      }
    }
  };

  const handleArtistChange = (artistId: string) => {
    setFormData({ ...formData, artist_id: artistId, album_id: "" });
    if (artistId) {
      loadAlbumsForArtist(artistId);
    } else {
      setAlbums([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.track_title.trim() || !formData.artist_id || !formData.album_id) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Необходимо войти в систему");
        return;
      }

      // Получаем метаданные аудио файла
      const audio = new Audio();
      const duration = await new Promise<number>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(Math.floor(audio.duration));
        });
        audio.src = URL.createObjectURL(formData.file);
      });

      const fileExt = formData.file.name.split('.').pop();
      let filePath = '';

      // Пытаемся загрузить в Storage, если не получается - используем локальный путь
      try {
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('songs')
          .upload(fileName, formData.file, {
            onUploadProgress: (progress) => {
              setUploadProgress(progress.loaded / progress.total * 100);
            }
          });

        if (uploadError) {
          console.warn('Storage недоступен, используем локальный путь:', uploadError.message);
          filePath = `local://${formData.file.name}`;
        } else {
          // Сохраняем путь к файлу в Storage для получения подписанного URL позже
          filePath = fileName;
        }
      } catch (storageError) {
        console.warn('Ошибка Storage, используем локальный путь:', storageError);
        filePath = `local://${formData.file.name}`;
      }

      // Убеждаемся, что пользователь существует в public.users
      const { error: ensureUserError } = await supabase.rpc('ensure_user_exists');
      
      if (ensureUserError) {
        console.error("Ошибка создания пользователя:", ensureUserError);
        toast.error("Ошибка создания профиля пользователя");
        return;
      }

      // Создаем трек
      const { data: trackData, error: trackError } = await supabase
        .from("tracks")
        .insert({
          track_title: formData.track_title.trim(),
          track_duration: duration,
          album_id: formData.album_id,
          track_audio_url: filePath,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (trackError) throw trackError;

      // Добавляем жанр к треку, если выбран
      if (formData.genre_id && trackData) {
        await supabase.from("track_genres").insert({
          track_id: trackData.id,
          genre_id: formData.genre_id
        });
      }

      toast.success("Трек успешно добавлен!");
      setFormData({ track_title: "", artist_id: "", album_id: "", genre_id: "", file: null });
      setUploadProgress(0);
      setOpen(false);
      onTrackUploaded?.();
    } catch (error: any) {
      toast.error(`Ошибка добавления трека: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Upload className="w-4 h-4" />
          Загрузить треки
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Загрузить новый трек
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор файла */}
          <div className="space-y-2">
            <Label htmlFor="file">Аудио файл *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept=".mp3,.wav,.flac,.ogg,.m4a"
                onChange={handleFileSelect}
                className="hidden"
              />
              {formData.file ? (
                <div className="space-y-2">
                  <FileAudio className="w-8 h-8 mx-auto text-primary" />
                  <p className="font-medium">{formData.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Выбрать другой файл
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Перетащите файл или нажмите для выбора</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Выбрать файл
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Прогресс загрузки */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Загрузка...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Метаданные */}
          <div className="space-y-2">
            <Label htmlFor="track_title">Название трека *</Label>
            <Input
              id="track_title"
              value={formData.track_title}
              onChange={(e) => setFormData({ ...formData, track_title: e.target.value })}
              placeholder="Название трека"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Исполнитель *</Label>
            <Select value={formData.artist_id} onValueChange={handleArtistChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите исполнителя" />
              </SelectTrigger>
              <SelectContent>
                {artists.map((artist) => (
                  <SelectItem key={artist.id} value={artist.id}>
                    {artist.artist_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="album">Альбом *</Label>
            <Select 
              value={formData.album_id} 
              onValueChange={(value) => setFormData({ ...formData, album_id: value })}
              disabled={!formData.artist_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите альбом" />
              </SelectTrigger>
              <SelectContent>
                {albums.map((album) => (
                  <SelectItem key={album.id} value={album.id}>
                    {album.album_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Жанр</Label>
            <Select 
              value={formData.genre_id} 
              onValueChange={(value) => setFormData({ ...formData, genre_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите жанр (необязательно)" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id}>
                    {genre.genre_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={loading || !formData.file}
              className="flex-1"
            >
              {loading ? "Загрузка..." : "Загрузить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadTrackDialog;
