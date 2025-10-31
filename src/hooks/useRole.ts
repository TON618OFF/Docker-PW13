import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data: userData, error } = await supabase
          .from("users")
          .select(`
            role:roles(role_name)
          `)
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Ошибка получения роли:", error);
          setRole("слушатель"); // По умолчанию
        } else {
          setRole(userData?.role?.role_name || "слушатель");
        }
      } catch (error) {
        console.error("Ошибка получения роли:", error);
        setRole("слушатель");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUserRole();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = role === "администратор";
  const isDistributor = role === "дистрибьютор";
  const isArtist = role === "артист";
  const isListener = role === "слушатель";
  const canManageContent = isAdmin || isDistributor || isArtist;
  const canAccessAdmin = isAdmin;

  return {
    role,
    loading,
    isAdmin,
    isDistributor,
    isArtist,
    isListener,
    canManageContent,
    canAccessAdmin
  };
};
