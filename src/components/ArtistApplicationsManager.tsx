import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, Search, User, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

interface Application {
  id: string;
  user_id: string;
  artist_name: string;
  artist_bio: string | null;
  artist_image_url: string | null;
  genre: string | null;
  portfolio_url: string | null;
  social_media_urls: any;
  motivation: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  review_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  user: {
    username: string;
    email: string;
  };
}

const ArtistApplicationsManager = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("artist_applications")
        .select(`
          *,
          user:users!artist_applications_user_id_fkey(
            username,
            id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Email недоступен напрямую через клиентский API
      const applicationsWithEmail = (data || []).map((app: any) => ({
        ...app,
        user: {
          ...app.user,
          email: "N/A", // Email недоступен напрямую через клиентский API
        },
      }));

      setApplications(applicationsWithEmail as Application[]);
    } catch (error: any) {
      console.error("Ошибка загрузки анкет:", error);
      toast.error(t('applications.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      const { data, error } = await supabase.rpc("approve_artist_application", {
        p_application_id: applicationId,
      });

      if (error) throw error;

      if (data.success) {
        toast.success(t('applications.approveSuccess'));
        fetchApplications();
      } else {
        toast.error(data.error || t('applications.approveError'));
      }
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    }
  };

  const handleReject = async (applicationId: string, comment: string) => {
    try {
      const { data, error } = await supabase.rpc("reject_artist_application", {
        p_application_id: applicationId,
        p_comment: comment || null,
      });

      if (error) throw error;

      if (data.success) {
        toast.success(t('applications.rejectSuccess'));
        fetchApplications();
      } else {
        toast.error(data.error || t('applications.rejectError'));
      }
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { text: t('applications.status.pending'), color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
      approved: { text: t('applications.status.approved'), color: "bg-green-500/20 text-green-300 border-green-500/30" },
      rejected: { text: t('applications.status.rejected'), color: "bg-red-500/20 text-red-300 border-red-500/30" },
    };
    const config = configs[status as keyof typeof configs];
    return (
      <Badge className={`${config.color} border`}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('applications.title')}</h2>
        <p className="text-muted-foreground">{t('applications.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t('applications.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            size="sm"
          >
            {t('applications.filter.all')}
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            onClick={() => setFilterStatus("pending")}
            size="sm"
          >
            {t('applications.filter.pending')}
          </Button>
          <Button
            variant={filterStatus === "approved" ? "default" : "outline"}
            onClick={() => setFilterStatus("approved")}
            size="sm"
          >
            {t('applications.filter.approved')}
          </Button>
          <Button
            variant={filterStatus === "rejected" ? "default" : "outline"}
            onClick={() => setFilterStatus("rejected")}
            size="sm"
          >
            {t('applications.filter.rejected')}
          </Button>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 backdrop-blur">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('applications.empty')}</h3>
          <p className="text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? t('applications.emptyFiltered')
              : t('applications.empty')}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {app.artist_image_url && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={app.artist_image_url}
                      alt={app.artist_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{app.artist_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="w-4 h-4" />
                        <span>{app.user?.username}</span>
                        <span>•</span>
                        <span>{app.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {t('applications.submitted')} {new Date(app.created_at).toLocaleDateString(t('common.russian') === 'Русский' ? "ru-RU" : "en-US")}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  {app.artist_bio && (
                    <div>
                      <Label className="text-sm font-semibold">{t('applications.biography')}</Label>
                      <p className="text-muted-foreground">{app.artist_bio}</p>
                    </div>
                  )}

                  {app.genre && (
                    <div>
                      <Label className="text-sm font-semibold">{t('applications.genre')}</Label>
                      <Badge variant="secondary" className="ml-2">
                        {app.genre}
                      </Badge>
                    </div>
                  )}

                  {app.motivation && (
                    <div>
                      <Label className="text-sm font-semibold">{t('applications.motivation')}</Label>
                      <p className="text-muted-foreground">{app.motivation}</p>
                    </div>
                  )}

                  {(app.portfolio_url || app.social_media_urls) && (
                    <div>
                      <Label className="text-sm font-semibold">{t('applications.links')}</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {app.portfolio_url && (
                          <a
                            href={app.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            {t('applications.portfolio')}
                          </a>
                        )}
                        {app.social_media_urls?.instagram && (
                          <a
                            href={app.social_media_urls.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            Instagram
                          </a>
                        )}
                        {app.social_media_urls?.youtube && (
                          <a
                            href={app.social_media_urls.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            YouTube
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {app.status === "rejected" && app.review_comment && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <Label className="text-sm font-semibold text-red-300">{t('applications.rejectionComment')}</Label>
                      <p className="text-red-200 text-sm mt-1">{app.review_comment}</p>
                    </div>
                  )}

                  {app.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <RejectDialog
                        applicationId={app.id}
                        onReject={(comment) => handleReject(app.id, comment)}
                      />
                      <Button
                        onClick={() => handleApprove(app.id)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        {t('applications.approve')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Dialog для отклонения анкеты
const RejectDialog = ({
  applicationId,
  onReject,
}: {
  applicationId: string;
  onReject: (comment: string) => void;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  const handleReject = () => {
    onReject(comment);
    setComment("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <X className="w-4 h-4" />
          {t('applications.reject')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('applications.reject')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">{t('applications.rejectComment')} ({t('common.no')})</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('applications.rejectCommentPlaceholder')}
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              {t('applications.reject')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistApplicationsManager;

