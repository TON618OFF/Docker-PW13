import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Music, User, Award } from "lucide-react";
import ImageUpload from "./ImageUpload";
import { useRole } from "@/hooks/useRole";
import { useTranslation } from "@/hooks/useTranslation";

interface ArtistApplication {
  id: string;
  artist_name: string;
  artist_bio: string | null;
  artist_image_url: string | null;
  genre: string | null;
  portfolio_url: string | null;
  social_media_urls: any;
  motivation: string | null;
  status: "pending" | "approved" | "rejected";
  review_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const BecomeArtistForm = () => {
  const { role, isListener } = useRole();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<ArtistApplication | null>(null);
  const [genres, setGenres] = useState<Array<{id: string, genre_name: string}>>([]);
  const [formData, setFormData] = useState({
    artist_name: "",
    artist_bio: "",
    artist_image_url: "",
    genre: "none",
    portfolio_url: "",
    instagram_url: "",
    youtube_url: "",
    motivation: "",
  });

  useEffect(() => {
    fetchApplication();
    loadGenres();
  }, []);

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

  const fetchApplication = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("artist_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setApplication(data);
        setFormData({
          artist_name: data.artist_name || "",
          artist_bio: data.artist_bio || "",
          artist_image_url: data.artist_image_url || "",
          genre: data.genre || "none",
          portfolio_url: data.portfolio_url || "",
          instagram_url: data.social_media_urls?.instagram || "",
          youtube_url: data.social_media_urls?.youtube || "",
          motivation: data.motivation || "",
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки анкеты:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.artist_name.trim()) {
      toast.error(t('becomeArtist.error.enterName'));
      return;
    }

    if (application && application.status === "pending") {
      toast.error(t('becomeArtist.error.pending'));
      return;
    }

    if (application && application.status === "approved") {
      toast.error(t('becomeArtist.error.approved'));
      return;
    }

    setSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error(t('becomeArtist.error.loginRequired'));
        return;
      }

      const socialMediaUrls = {};
      if (formData.instagram_url) {
        (socialMediaUrls as any).instagram = formData.instagram_url;
      }
      if (formData.youtube_url) {
        (socialMediaUrls as any).youtube = formData.youtube_url;
      }

      const { error } = await supabase.from("artist_applications").insert({
        user_id: user.id,
        artist_name: formData.artist_name.trim(),
        artist_bio: formData.artist_bio.trim() || null,
        artist_image_url: formData.artist_image_url.trim() || null,
        genre: formData.genre === "none" ? null : formData.genre.trim() || null,
        portfolio_url: formData.portfolio_url.trim() || null,
        social_media_urls: Object.keys(socialMediaUrls).length > 0 ? socialMediaUrls : null,
        motivation: formData.motivation.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success(t('becomeArtist.success'));
      fetchApplication();
    } catch (error: any) {
      toast.error(t('becomeArtist.errorSubmit', { message: error.message }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isListener) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">{t('becomeArtist.title')}</h2>
        </div>
        <p className="text-muted-foreground">
          {t('becomeArtist.alreadyRole', { 
            role: role === "артист" ? "артистом" : 
                  role === "дистрибьютор" ? "дистрибьютором" : 
                  "пользователем с расширенными правами" 
          })}
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!application) return null;

    const statusConfig = {
      pending: { text: "На рассмотрении", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
      approved: { text: "Одобрено", color: "bg-green-500/20 text-green-300 border-green-500/30" },
      rejected: { text: "Отклонено", color: "bg-red-500/20 text-red-300 border-red-500/30" },
    };

    const config = statusConfig[application.status];
    return (
      <div className={`px-3 py-1 rounded-full border ${config.color} text-sm font-medium`}>
        {config.text}
      </div>
    );
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">{t('becomeArtist.title')}</h2>
        </div>
        {application && getStatusBadge()}
      </div>

      {application && application.status === "approved" && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-300 font-medium">{t('becomeArtist.approvedMessage')}</p>
        </div>
      )}

      {application && application.status === "rejected" && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg space-y-2">
          <p className="text-red-300 font-medium">{t('becomeArtist.rejectedMessage')}</p>
          {application.review_comment && (
            <p className="text-red-200 text-sm">{t('becomeArtist.rejectedComment')} {application.review_comment}</p>
          )}
          {application.reviewed_at && (
            <p className="text-red-200 text-xs">
              {t('becomeArtist.reviewedAt')} {new Date(application.reviewed_at).toLocaleDateString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US")}
            </p>
          )}
        </div>
      )}

      {application && application.status === "pending" && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-300">{t('becomeArtist.pendingMessage')}</p>
          <p className="text-yellow-200 text-sm mt-1">
            {t('becomeArtist.submittedAt')} {new Date(application.created_at).toLocaleDateString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US")}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="artist_name">{t('becomeArtist.nameLabel')} {t('common.required')}</Label>
          <Input
            id="artist_name"
            value={formData.artist_name}
            onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
            placeholder={t('becomeArtist.namePlaceholder')}
            required
            disabled={application?.status === "pending" || application?.status === "approved"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist_bio">{t('becomeArtist.bioLabel')}</Label>
          <Textarea
            id="artist_bio"
            value={formData.artist_bio}
            onChange={(e) => setFormData({ ...formData, artist_bio: e.target.value })}
            placeholder={t('becomeArtist.bioPlaceholder')}
            rows={4}
            disabled={application?.status === "pending" || application?.status === "approved"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist_image_url">{t('becomeArtist.imageLabel')}</Label>
          <ImageUpload
            currentUrl={formData.artist_image_url}
            onUploadComplete={(url) => setFormData({ ...formData, artist_image_url: url })}
            bucket="covers"
            maxSizeMB={5}
            aspectRatio="square"
            disabled={application?.status === "pending" || application?.status === "approved"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="genre">{t('becomeArtist.genreLabel')}</Label>
          <Select
            value={formData.genre}
            onValueChange={(value) => setFormData({ ...formData, genre: value })}
            disabled={application?.status === "pending" || application?.status === "approved"}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('becomeArtist.selectGenre')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('common.none')}</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre.id} value={genre.genre_name}>
                  {genre.genre_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="portfolio_url">{t('becomeArtist.portfolioLabelPlaceholder')}</Label>
          <Input
            id="portfolio_url"
            type="url"
            value={formData.portfolio_url}
            onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
            placeholder="https://..."
            disabled={application?.status === "pending" || application?.status === "approved"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagram_url">{t('becomeArtist.instagramLabel')}</Label>
            <Input
              id="instagram_url"
              type="url"
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="https://instagram.com/..."
              disabled={application?.status === "pending" || application?.status === "approved"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube_url">{t('becomeArtist.youtubeLabel')}</Label>
            <Input
              id="youtube_url"
              type="url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://youtube.com/..."
              disabled={application?.status === "pending" || application?.status === "approved"}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivation">{t('becomeArtist.motivationLabel')}</Label>
          <Textarea
            id="motivation"
            value={formData.motivation}
            onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
            placeholder={t('becomeArtist.motivationPlaceholder')}
            rows={3}
            disabled={application?.status === "pending" || application?.status === "approved"}
          />
        </div>

        {(application?.status !== "pending" && application?.status !== "approved") && (
          <Button
            type="submit"
            disabled={submitting}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <User className="w-4 h-4" />
            {submitting ? t('becomeArtist.submitting') : t('becomeArtist.submit')}
          </Button>
        )}
      </form>
    </Card>
  );
};

export default BecomeArtistForm;

