import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "dark" | "light";
type Language = "ru" | "en";

interface AppSettingsContextType {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [language, setLanguageState] = useState<Language>("ru");

  // Загружаем настройки из БД при монтировании
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        const { data: userData } = await supabase
          .from("users")
          .select("language")
          .eq("id", user.id)
          .single();

        if (userData?.language) {
          setLanguageState(userData.language as Language);
        }

        // Загружаем тему из localStorage (может быть настроена пользователем)
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error("Ошибка загрузки настроек:", error);
      }
    };

    loadSettings();
  }, []);

  // Применяем тему к документу
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);

    // Сохраняем в БД если пользователь авторизован
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await supabase
          .from("users")
          .update({ language: language }) // Сохраняем язык тоже
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Ошибка сохранения темы:", error);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);

    // Сохраняем в БД
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await supabase
          .from("users")
          .update({ language: newLanguage })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Ошибка сохранения языка:", error);
    }
  };

  return (
    <AppSettingsContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
};

