import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Music2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;

        // Убеждаемся, что пользователь существует в public.users
        const user = signInData.user;
        if (user) {
          // Проверяем существование пользователя
          const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("id", user.id)
            .single();

          // Если пользователя нет, создаём его
          if (!userData) {
            await supabase.rpc('ensure_user_exists');
          } else {
            // Обновляем last_login
            await supabase
              .from("users")
              .update({ last_login: new Date().toISOString() })
              .eq("id", user.id);
          }
        }
        
        toast.success("Добро пожаловать!");
        navigate("/");
      } else {
        // Валидация username
        if (!username.trim() || username.length < 3 || username.length > 50) {
          toast.error("Имя пользователя должно быть от 3 до 50 символов");
          setLoading(false);
          return;
        }

        // Проверяем, существует ли username
        const { data: existingUser } = await supabase
          .from("users")
          .select("username")
          .eq("username", username.trim())
          .single();

        if (existingUser) {
          toast.error("Имя пользователя уже занято");
          setLoading(false);
          return;
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username.trim(),
              first_name: firstName.trim() || null,
              last_name: lastName.trim() || null,
            },
          },
        });
        
        if (signUpError) throw signUpError;

        if (!authData.user) {
          throw new Error("Не удалось создать пользователя");
        }

        // Пытаемся создать пользователя в public.users
        // Используем create_user_profile для явного создания с метаданными
        const { data: createResult, error: createError } = await supabase.rpc('create_user_profile', {
          p_user_id: authData.user.id,
          p_username: username.trim(),
          p_first_name: firstName.trim() || null,
          p_last_name: lastName.trim() || null,
        });

        if (createError) {
          console.error("Ошибка create_user_profile:", createError);
          // Пробуем через ensure_user_exists как запасной вариант
          await supabase.rpc('ensure_user_exists');
        } else if (createResult?.success) {
          console.log("Пользователь создан:", createResult);
        }

        toast.success("Регистрация успешна! Проверьте email для подтверждения.");
        
        // Если email подтверждение не требуется, сразу входим
        if (authData.session) {
          navigate("/");
        } else {
          // Ждём подтверждения email
          toast.info("Пожалуйста, подтвердите email для входа. После подтверждения вы сможете войти.");
          // Не перенаправляем, пользователь останется на странице входа
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Ошибка аутентификации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6 border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Music2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            ImperialTunes Player
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Войдите в свой аккаунт" : "Создайте новый аккаунт"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя *</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username (3-50 символов)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={50}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Введите имя"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Введите фамилию"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-input border-border"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Зарегистрироваться"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войдите"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
