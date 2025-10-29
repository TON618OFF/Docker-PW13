import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Music, User, Calendar, Search, Edit, Trash2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

interface Artist {
  id: string;
  artist_name: string;
  artist_bio: string | null;
  artist_image_url: string | null;
  genre: string | null;
  created_at: string;
  isOwner?: boolean;
}

interface Album {
  id: string;
  album_title: string;
  album_release_date: string;
  album_cover_url: string | null;
  album_description: string | null;
  artist: {
    id: string;
    artist_name: string;
  };
  created_at: string;
}

const ArtistsAlbumsManager = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("artists");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const initUser = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    initUser();
    fetchData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchData();
    }
  }, [currentUserId]);

  const fetchData = async () => {
    try {
      const [artistsResult, albumsResult] = await Promise.all([
        supabase.from("artists").select("*").order("artist_name"),
        supabase.from("albums")
          .select(`
            id,
            album_title,
            album_release_date,
            album_cover_url,
            album_description,
            created_at,
            artist:artists(
              id,
              artist_name
            )
          `)
          .order("album_title")
      ]);

      if (artistsResult.data) {
        // Получаем треки для определения владельца артистов
        if (currentUserId) {
          const { data: tracksData } = await supabase
            .from("tracks")
            .select("album_id, uploaded_by")
            .eq("uploaded_by", currentUserId);
          
          const userAlbumIds = new Set((tracksData || []).map(t => t.album_id));
          
          // Получаем артистов, связанных с альбомами пользователя
          const { data: userArtists } = await supabase
            .from("albums")
            .select("artist_id")
            .in("id", Array.from(userAlbumIds));
          
          const userArtistIds = new Set((userArtists || []).map(a => a.artist_id));
          
          const artistsWithOwnership = artistsResult.data.map(artist => ({
            ...artist,
            isOwner: userArtistIds.has(artist.id)
          }));
          setArtists(artistsWithOwnership);
        } else {
          setArtists(artistsResult.data);
        }
      }
      if (albumsResult.data) setAlbums(albumsResult.data);
    } catch (error: any) {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter(artist =>
    artist.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAlbums = albums.filter(album =>
    album.album_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.artist.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Артисты и альбомы</h2>
          <p className="text-muted-foreground">Управление исполнителями и их альбомами</p>
        </div>
        <div className="flex gap-2">
          <CreateArtistDialog onArtistCreated={fetchData} />
          <CreateAlbumDialog artists={artists} onAlbumCreated={fetchData} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="artists">Артисты ({artists.length})</TabsTrigger>
          <TabsTrigger value="albums">Альбомы ({albums.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="artists" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Поиск артистов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
            </div>
          ) : filteredArtists.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur">
              <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "Артисты не найдены" : "Нет артистов"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Попробуйте изменить запрос" : "Добавьте первого артиста"}
              </p>
              {!searchQuery && <CreateArtistDialog onArtistCreated={fetchData} />}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtists.map((artist) => (
                <Card key={artist.id} className="group hover:bg-card/80 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {artist.artist_image_url && (
                        <img
                          src={artist.artist_image_url}
                          alt={artist.artist_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg truncate">{artist.artist_name}</CardTitle>
                          {artist.isOwner && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              <EditArtistDialog artist={artist} onArtistUpdated={fetchData} />
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {artist.artist_bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {artist.artist_bio}
                      </p>
                    )}
                    {artist.genre && (
                      <span className="inline-block px-2 py-1 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 rounded-full text-xs text-yellow-300 font-medium">
                        {artist.genre}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="albums" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Поиск альбомов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
            </div>
          ) : filteredAlbums.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur">
              <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "Альбомы не найдены" : "Нет альбомов"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Попробуйте изменить запрос" : "Добавьте первый альбом"}
              </p>
              {!searchQuery && <CreateAlbumDialog artists={artists} onAlbumCreated={fetchData} />}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlbums.map((album) => (
                <Card key={album.id} className="group hover:bg-card/80 transition-all">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 relative overflow-hidden">
                    {album.album_cover_url ? (
                      <img
                        src={album.album_cover_url}
                        alt={album.album_title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-20 h-20 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{album.album_title}</CardTitle>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <EditAlbumDialog album={album} artists={artists} onAlbumUpdated={fetchData} />
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{album.artist.artist_name}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(album.album_release_date).toLocaleDateString()}</span>
                    </div>
                    {album.album_description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {album.album_description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Компонент создания артиста
const CreateArtistDialog = ({ onArtistCreated }: { onArtistCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<Array<{id: string, genre_name: string}>>([]);
  const [formData, setFormData] = useState({
    artist_name: "",
    artist_bio: "",
    artist_image_url: "",
    genre: "none",
  });

  useEffect(() => {
    if (open) {
      loadGenres();
    }
  }, [open]);

  const loadGenres = async () => {
    try {
      const { data } = await supabase
        .from("genres")
        .select("id, genre_name")
        .order("genre_name");
      if (data) setGenres(data);
    } catch (error) {
      console.error("Ошибка загрузки жанров:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.artist_name.trim()) {
      toast.error("Введите имя артиста");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("artists").insert({
        artist_name: formData.artist_name.trim(),
        artist_bio: formData.artist_bio.trim() || null,
        artist_image_url: formData.artist_image_url.trim() || null,
        genre: formData.genre === "none" ? null : formData.genre.trim() || null,
      });

      if (error) throw error;

      toast.success("Артист создан!");
      setFormData({ artist_name: "", artist_bio: "", artist_image_url: "", genre: "none" });
      setOpen(false);
      onArtistCreated();
    } catch (error: any) {
      toast.error(`Ошибка создания артиста: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Добавить артиста
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать артиста</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="artist_name">Имя артиста *</Label>
            <Input
              id="artist_name"
              value={formData.artist_name}
              onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
              placeholder="Имя исполнителя"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist_bio">Биография</Label>
            <Textarea
              id="artist_bio"
              value={formData.artist_bio}
              onChange={(e) => setFormData({ ...formData, artist_bio: e.target.value })}
              placeholder="Краткая биография артиста"
              rows={3}
            />
          </div>
          <ImageUpload
            currentUrl={formData.artist_image_url}
            onUploadComplete={(url) => setFormData({ ...formData, artist_image_url: url })}
            bucket="covers"
            maxSizeMB={5}
            aspectRatio="square"
          />
          <div className="space-y-2">
            <Label htmlFor="genre">Жанр</Label>
            <Select
              value={formData.genre}
              onValueChange={(value) => setFormData({ ...formData, genre: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите жанр (необязательно)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без жанра</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.genre_name}>
                    {genre.genre_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Создание..." : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Компонент создания альбома
const CreateAlbumDialog = ({ 
  artists, 
  onAlbumCreated 
}: { 
  artists: Artist[]; 
  onAlbumCreated: () => void; 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    album_title: "",
    album_release_date: "",
    artist_id: "",
    album_cover_url: "",
    album_description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.album_title.trim() || !formData.artist_id || !formData.album_release_date) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("albums").insert({
        album_title: formData.album_title.trim(),
        album_release_date: formData.album_release_date,
        artist_id: formData.artist_id,
        album_cover_url: formData.album_cover_url.trim() || null,
        album_description: formData.album_description.trim() || null,
        is_public: true, // По умолчанию публичный
      });

      if (error) throw error;

      toast.success("Альбом создан!");
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
          Добавить альбом
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать альбом</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="album_title">Название альбома *</Label>
            <Input
              id="album_title"
              value={formData.album_title}
              onChange={(e) => setFormData({ ...formData, album_title: e.target.value })}
              placeholder="Название альбома"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist_id">Артист *</Label>
            <select
              id="artist_id"
              value={formData.artist_id}
              onChange={(e) => setFormData({ ...formData, artist_id: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            >
              <option value="">Выберите артиста</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.artist_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="album_release_date">Дата выпуска *</Label>
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
            <Label htmlFor="album_description">Описание</Label>
            <Textarea
              id="album_description"
              value={formData.album_description}
              onChange={(e) => setFormData({ ...formData, album_description: e.target.value })}
              placeholder="Описание альбома"
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Создание..." : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Компонент редактирования артиста
const EditArtistDialog = ({ 
  artist, 
  onArtistUpdated 
}: { 
  artist: Artist; 
  onArtistUpdated: () => void; 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<Array<{id: string, genre_name: string}>>([]);
  const [formData, setFormData] = useState({
    artist_name: artist.artist_name,
    artist_bio: artist.artist_bio || "",
    artist_image_url: artist.artist_image_url || "",
    genre: artist.genre || "none",
  });

  useEffect(() => {
    if (open) {
      loadGenres();
    }
  }, [open]);

  const loadGenres = async () => {
    try {
      const { data } = await supabase
        .from("genres")
        .select("id, genre_name")
        .order("genre_name");
      if (data) setGenres(data);
    } catch (error) {
      console.error("Ошибка загрузки жанров:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.artist_name.trim()) {
      toast.error("Введите имя артиста");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("artists")
        .update({
          artist_name: formData.artist_name.trim(),
          artist_bio: formData.artist_bio.trim() || null,
          artist_image_url: formData.artist_image_url.trim() || null,
          genre: formData.genre === "none" ? null : formData.genre.trim() || null,
        })
        .eq("id", artist.id);

      if (error) throw error;

      toast.success("Артист обновлен!");
      setOpen(false);
      onArtistUpdated();
    } catch (error: any) {
      toast.error(`Ошибка обновления артиста: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать артиста</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_artist_name">Имя артиста *</Label>
            <Input
              id="edit_artist_name"
              value={formData.artist_name}
              onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
              placeholder="Имя исполнителя"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_artist_bio">Биография</Label>
            <Textarea
              id="edit_artist_bio"
              value={formData.artist_bio}
              onChange={(e) => setFormData({ ...formData, artist_bio: e.target.value })}
              placeholder="Краткая биография артиста"
              rows={3}
            />
          </div>
          <ImageUpload
            currentUrl={formData.artist_image_url}
            onUploadComplete={(url) => setFormData({ ...formData, artist_image_url: url })}
            bucket="covers"
            maxSizeMB={5}
            aspectRatio="square"
          />
          <div className="space-y-2">
            <Label htmlFor="edit_genre">Жанр</Label>
            <Select
              value={formData.genre}
              onValueChange={(value) => setFormData({ ...formData, genre: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите жанр (необязательно)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без жанра</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.genre_name}>
                    {genre.genre_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Компонент редактирования альбома
const EditAlbumDialog = ({ 
  album, 
  artists, 
  onAlbumUpdated 
}: { 
  album: Album; 
  artists: Artist[]; 
  onAlbumUpdated: () => void; 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    album_title: album.album_title,
    album_release_date: album.album_release_date,
    artist_id: album.artist.id,
    album_cover_url: album.album_cover_url || "",
    album_description: album.album_description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.album_title.trim() || !formData.artist_id || !formData.album_release_date) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("albums")
        .update({
          album_title: formData.album_title.trim(),
          album_release_date: formData.album_release_date,
          artist_id: formData.artist_id,
          album_cover_url: formData.album_cover_url.trim() || null,
          album_description: formData.album_description.trim() || null,
        })
        .eq("id", album.id);

      if (error) throw error;

      toast.success("Альбом обновлен!");
      setOpen(false);
      onAlbumUpdated();
    } catch (error: any) {
      toast.error(`Ошибка обновления альбома: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать альбом</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_album_title">Название альбома *</Label>
            <Input
              id="edit_album_title"
              value={formData.album_title}
              onChange={(e) => setFormData({ ...formData, album_title: e.target.value })}
              placeholder="Название альбома"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_artist_id">Артист *</Label>
            <select
              id="edit_artist_id"
              value={formData.artist_id}
              onChange={(e) => setFormData({ ...formData, artist_id: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            >
              <option value="">Выберите артиста</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.artist_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_album_release_date">Дата выпуска *</Label>
            <Input
              id="edit_album_release_date"
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
            <Label htmlFor="edit_album_description">Описание</Label>
            <Textarea
              id="edit_album_description"
              value={formData.album_description}
              onChange={(e) => setFormData({ ...formData, album_description: e.target.value })}
              placeholder="Описание альбома"
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistsAlbumsManager;

