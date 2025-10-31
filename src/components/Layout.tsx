import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Music2, Library, ListMusic, BarChart3, User, LogOut, Globe, Crown } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import MusicPlayer from "./MusicPlayer";
import { usePlayer } from "@/contexts/PlayerContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useRole } from "@/hooks/useRole";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Layout = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTrack } = usePlayer();
  const { language, setLanguage } = useAppSettings();
  const { canAccessAdmin, isDistributor } = useRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user && location.pathname !== "/auth") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("common.loggedOut"));
    navigate("/auth");
  };

  if (!user) return null;

  const navItems = [
    { path: "/", icon: Music2, label: t("common.home") },
    { path: "/library", icon: Library, label: t("common.library") },
    { path: "/playlists", icon: ListMusic, label: t("common.playlists") },
    { path: "/analytics", icon: BarChart3, label: t("common.analytics") },
    { path: "/profile", icon: User, label: t("common.profile") },
    ...(canAccessAdmin ? [{ path: "/admin", icon: Crown, label: t('layout.adminPanel') }] : []),
    ...(isDistributor ? [{ path: "/applications", icon: User, label: t('layout.applications') }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Music2 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ImperialTunes
            </h1>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={`gap-2 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="w-4 h-4" />
                  {language === "ru" ? "RU" : "EN"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("ru")}>
                  {t("common.russian")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  {t("common.english")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t("common.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 container mx-auto px-4 py-8 ${currentTrack ? 'pb-32' : 'pb-20'}`}>
        <Outlet />
      </main>

      {/* Music Player */}
      <MusicPlayer track={currentTrack} />

      {/* Mobile Navigation */}
      <nav className={`md:hidden border-t border-border bg-card/90 backdrop-blur-xl fixed bottom-0 left-0 right-0 z-40 ${currentTrack ? 'bottom-20' : ''}`}>
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center p-2">
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-xs mt-1 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
