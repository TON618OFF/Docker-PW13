import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Music2, Library, ListMusic, BarChart3, User, LogOut, Globe, Crown, Menu, X } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Layout = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Основные разделы, которые всегда показываются в нижней панели
  const mainNavItems = [
    { path: "/", icon: Music2, label: t("common.home") },
    { path: "/library", icon: Library, label: t("common.library") },
    { path: "/playlists", icon: ListMusic, label: t("common.playlists") },
    { path: "/profile", icon: User, label: t("common.profile") },
  ];

  // Дополнительные разделы (показываются через меню)
  const additionalNavItems = [
    { path: "/analytics", icon: BarChart3, label: t("common.analytics") },
    ...(canAccessAdmin ? [{ path: "/admin", icon: Crown, label: t('layout.adminPanel') }] : []),
    ...(isDistributor ? [{ path: "/applications", icon: User, label: t('layout.applications') }] : []),
  ];

  // Все разделы для десктопной навигации
  const navItems = [...mainNavItems, ...additionalNavItems];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
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
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Music2 className="w-6 h-6 text-primary" />
                    ImperialTunes
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={`w-full justify-start gap-3 ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                  <div className="pt-4 border-t mt-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-3">
                          <Globe className="w-5 h-5" />
                          {language === "ru" ? "Русский" : "English"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
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
                      className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive mt-2"
                    >
                      <LogOut className="w-5 h-5" />
                      {t("common.logout")}
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Language and Logout */}
            <div className="hidden md:flex items-center gap-2">
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
                {t("common.logout")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-8 ${currentTrack ? 'pb-32 md:pb-24' : 'pb-20 md:pb-8'}`}>
        <Outlet />
      </main>

      {/* Music Player */}
      <MusicPlayer track={currentTrack} />

      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden border-t border-border bg-card/90 backdrop-blur-xl fixed bottom-0 left-0 right-0 z-40 ${currentTrack ? 'bottom-20' : ''}`}>
        <div className="flex justify-around items-center py-2 px-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className="flex flex-col items-center justify-center p-2 min-w-0 flex-1"
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 truncate w-full text-center ${
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          {/* Menu button for additional items (Analytics, Admin Panel, Applications) */}
          {additionalNavItems.length > 0 && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 ${
                  additionalNavItems.some(item => location.pathname === item.path) ? 'text-primary' : ''
                }`}>
                  <Menu className="w-5 h-5" />
                  <span className={`text-[10px] mt-1 ${
                    additionalNavItems.some(item => location.pathname === item.path) 
                      ? "text-primary font-medium" 
                      : "text-muted-foreground"
                  }`}>
                    Ещё
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Навигация</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={`w-full justify-start gap-3 h-14 ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-base">{item.label}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
