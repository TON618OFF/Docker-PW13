-- =================================================================================================
-- ИСПРАВЛЕНИЕ УПРАВЛЕНИЯ РОЛЯМИ АДМИНИСТРАТОРАМИ И ОГРАНИЧЕНИЕ ДОСТУПА ПОСЛЕ ИЗМЕНЕНИЯ РОЛИ
-- =================================================================================================
-- Эта миграция добавляет политики для администраторов на изменение ролей пользователей
-- и обновляет политики UPDATE/DELETE для треков и альбомов, чтобы они проверяли текущую роль
-- =================================================================================================

-- Удаляем старую политику обновления профиля пользователя
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Политика для пользователей: могут обновлять только свой профиль (кроме role_id)
-- Создаем функцию для проверки, что role_id не изменяется и сброса анкет при изменении роли
CREATE OR REPLACE FUNCTION public.check_role_not_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role_name TEXT;
  new_role_name TEXT;
  current_user_role TEXT;
  is_admin BOOLEAN;
  is_distributor BOOLEAN;
BEGIN
  -- Если role_id изменяется, проверяем права
  IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
    -- Получаем роль текущего пользователя
    SELECT r.role_name INTO current_user_role
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
    
    is_admin := (current_user_role = 'администратор');
    is_distributor := (current_user_role = 'дистрибьютор');

    -- Получаем названия ролей для проверки
    SELECT role_name INTO old_role_name
    FROM public.roles
    WHERE id = OLD.role_id;

    SELECT role_name INTO new_role_name
    FROM public.roles
    WHERE id = NEW.role_id;

    -- Разрешаем изменение роли если:
    -- 1. Пользователь - администратор (может изменять любые роли)
    -- 2. Пользователь - дистрибьютор И роль меняется со "слушатель" на "артист" (одобрение анкеты)
    IF NOT is_admin AND NOT (is_distributor AND old_role_name = 'слушатель' AND new_role_name = 'артист') THEN
      RAISE EXCEPTION 'Only administrators can change user roles, or distributors can approve applications (listener -> artist)';
    END IF;

    -- Если роль изменяется с "артист" на другую (например, "слушатель"),
    -- сбрасываем анкеты пользователя, чтобы он мог подать новую заявку
    IF old_role_name = 'артист' AND new_role_name != 'артист' THEN
      -- Удаляем все анкеты пользователя (approved, rejected, pending)
      -- Это позволит пользователю подать новую заявку
      DELETE FROM public.artist_applications
      WHERE user_id = NEW.id;
      
      -- Примечание: запись в таблице artists НЕ удаляется,
      -- так как карточка артиста должна оставаться доступной для просмотра
      -- и прослушивания, но пользователь больше не может редактировать её
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Создаем триггер для проверки изменения роли
-- Примечание: триггер update_users_updated_at уже существует, поэтому добавляем наш триггер
DROP TRIGGER IF EXISTS check_role_change ON public.users;

CREATE TRIGGER check_role_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  WHEN (OLD.role_id IS DISTINCT FROM NEW.role_id)
  EXECUTE FUNCTION public.check_role_not_changed();

-- Политика для пользователей: могут обновлять только свой профиль
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE TO authenticated USING (auth.uid () = id)
WITH
    CHECK (auth.uid () = id);

-- Удаляем старую политику для администраторов, если она существует
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

-- Политика для администраторов: могут обновлять любые поля любых пользователей
CREATE POLICY "Admins can update any user" ON public.users FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
        WHERE
            u.id = auth.uid ()
            AND r.role_name = 'администратор'
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
                JOIN public.roles r ON u.role_id = r.id
            WHERE
                u.id = auth.uid ()
                AND r.role_name = 'администратор'
        )
    );

-- Политика для дистрибьюторов: могут обновлять role_id при одобрении анкет (слушатель -> артист)
-- Функция approve_artist_application использует SECURITY DEFINER, поэтому RLS политики не применяются
-- Но для дополнительной безопасности добавляем политику (хотя SECURITY DEFINER функции обходят RLS)
-- Примечание: В RLS политиках нельзя использовать OLD и NEW напрямую, поэтому проверяем только роль дистрибьютора
-- Детальная проверка изменения роли выполняется в триггере check_role_not_changed
DROP POLICY IF EXISTS "Distributors can approve applications" ON public.users;

CREATE POLICY "Distributors can approve applications" ON public.users FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
        WHERE
            u.id = auth.uid ()
            AND r.role_name = 'дистрибьютор'
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
                JOIN public.roles r ON u.role_id = r.id
            WHERE
                u.id = auth.uid ()
                AND r.role_name = 'дистрибьютор'
        )
    );

-- =================================================================================================
-- ОБНОВЛЕНИЕ ПОЛИТИК ДЛЯ ТРЕКОВ
-- =================================================================================================

-- Удаляем старые политики для треков
DROP POLICY IF EXISTS "Users can update own tracks" ON public.tracks;

DROP POLICY IF EXISTS "Users can delete own tracks" ON public.tracks;

DROP POLICY IF EXISTS "Artists can update own tracks" ON public.tracks;

DROP POLICY IF EXISTS "Artists can delete own tracks" ON public.tracks;

DROP POLICY IF EXISTS "Authenticated users can insert tracks" ON public.tracks;

-- Политика INSERT: пользователь может создавать треки только для альбомов текущего активного артиста
-- Дистрибьюторы могут создавать треки для любых артистов
CREATE POLICY "Artists can insert tracks" ON public.tracks FOR
INSERT
    TO authenticated
WITH
    CHECK (
        uploaded_by = auth.uid ()
        AND (
            -- Дистрибьюторы и администраторы могут создавать треки для любых артистов
            EXISTS (
                SELECT 1
                FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                WHERE
                    u.id = auth.uid ()
                    AND (
                        r.role_name = 'дистрибьютор'
                        OR r.role_name = 'администратор'
                    )
            )
            OR
            -- Артисты могут создавать треки только для альбомов текущего активного артиста (одобренной анкетой)
            (
                EXISTS (
                    SELECT 1
                    FROM public.users u
                        JOIN public.roles r ON u.role_id = r.id
                    WHERE
                        u.id = auth.uid ()
                        AND r.role_name = 'артист'
                )
                AND EXISTS (
                    SELECT 1
                    FROM public.albums a
                        JOIN public.artists ar ON a.artist_id = ar.id
                    WHERE
                        a.id = tracks.album_id
                        AND ar.user_id = auth.uid ()
                        AND EXISTS (
                            SELECT 1
                            FROM public.artist_applications aa
                            WHERE
                                aa.user_id = auth.uid ()
                                AND aa.status = 'approved'
                                AND aa.artist_name = ar.artist_name
                        )
                )
            )
        )
    );

-- Политика UPDATE: пользователь может обновлять свои треки
-- Дистрибьюторы и администраторы могут обновлять любые треки, которые они загрузили
-- Артисты могут обновлять только треки текущего активного артиста (одобренной анкетой)
CREATE POLICY "Artists can update own tracks" ON public.tracks FOR
UPDATE TO authenticated USING (
    uploaded_by = auth.uid ()
    AND (
        -- Дистрибьюторы и администраторы могут обновлять любые треки
        EXISTS (
            SELECT 1
            FROM public.users u
                JOIN public.roles r ON u.role_id = r.id
            WHERE
                u.id = auth.uid ()
                AND (
                    r.role_name = 'дистрибьютор'
                    OR r.role_name = 'администратор'
                )
        )
        OR
        -- Артисты могут обновлять только треки текущего активного артиста (одобренной анкетой)
        (
            EXISTS (
                SELECT 1
                FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                WHERE
                    u.id = auth.uid ()
                    AND r.role_name = 'артист'
            )
            AND EXISTS (
                SELECT 1
                FROM public.albums a
                    JOIN public.artists ar ON a.artist_id = ar.id
                WHERE
                    a.id = tracks.album_id
                    AND ar.user_id = auth.uid ()
                    AND EXISTS (
                        SELECT 1
                        FROM public.artist_applications aa
                        WHERE
                            aa.user_id = auth.uid ()
                            AND aa.status = 'approved'
                            AND aa.artist_name = ar.artist_name
                    )
            )
        )
    )
);

-- Политика DELETE: пользователь может удалять свои треки
-- Дистрибьюторы и администраторы могут удалять любые треки, которые они загрузили
-- Артисты могут удалять только треки текущего активного артиста (одобренной анкетой)
CREATE POLICY "Artists can delete own tracks" ON public.tracks FOR DELETE TO authenticated USING (
    uploaded_by = auth.uid ()
    AND (
        -- Дистрибьюторы и администраторы могут удалять любые треки
        EXISTS (
            SELECT 1
            FROM public.users u
                JOIN public.roles r ON u.role_id = r.id
            WHERE
                u.id = auth.uid ()
                AND (
                    r.role_name = 'дистрибьютор'
                    OR r.role_name = 'администратор'
                )
        )
        OR
        -- Артисты могут удалять только треки текущего активного артиста (одобренной анкетой)
        (
            EXISTS (
                SELECT 1
                FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                WHERE
                    u.id = auth.uid ()
                    AND r.role_name = 'артист'
            )
            AND EXISTS (
                SELECT 1
                FROM public.albums a
                    JOIN public.artists ar ON a.artist_id = ar.id
                WHERE
                    a.id = tracks.album_id
                    AND ar.user_id = auth.uid ()
                    AND EXISTS (
                        SELECT 1
                        FROM public.artist_applications aa
                        WHERE
                            aa.user_id = auth.uid ()
                            AND aa.status = 'approved'
                            AND aa.artist_name = ar.artist_name
                    )
            )
        )
    )
);

-- =================================================================================================
-- ОБНОВЛЕНИЕ ПОЛИТИК ДЛЯ АЛЬБОМОВ
-- =================================================================================================

-- Удаляем старые политики для альбомов
DROP POLICY IF EXISTS "Users can delete own albums" ON public.albums;

DROP POLICY IF EXISTS "Artists can update own albums" ON public.albums;

DROP POLICY IF EXISTS "Artists can delete own albums" ON public.albums;

DROP POLICY IF EXISTS "Artists and distributors can insert albums" ON public.albums;

-- Политика INSERT: пользователь может создавать альбомы
-- Дистрибьюторы и администраторы могут создавать альбомы для любых артистов
-- Артисты могут создавать альбомы только для текущего активного артиста (одобренной анкетой)
CREATE POLICY "Artists can insert albums" ON public.albums FOR
INSERT
    TO authenticated
WITH
    CHECK (
        created_by = auth.uid ()
        AND (
            -- Дистрибьюторы и администраторы могут создавать альбомы для любых артистов
            EXISTS (
                SELECT 1
                FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                WHERE
                    u.id = auth.uid ()
                    AND (
                        r.role_name = 'дистрибьютор'
                        OR r.role_name = 'администратор'
                    )
            )
            OR
            -- Артисты могут создавать альбомы только для текущего активного артиста (одобренной анкетой)
            (
                EXISTS (
                    SELECT 1
                    FROM public.users u
                        JOIN public.roles r ON u.role_id = r.id
                    WHERE
                        u.id = auth.uid ()
                        AND r.role_name = 'артист'
                )
                AND EXISTS (
                    SELECT 1
                    FROM public.artists ar
                    WHERE
                        ar.id = albums.artist_id
                        AND ar.user_id = auth.uid ()
                        AND EXISTS (
                            SELECT 1
                            FROM public.artist_applications aa
                            WHERE
                                aa.user_id = auth.uid ()
                                AND aa.status = 'approved'
                                AND aa.artist_name = ar.artist_name
                        )
                )
            )
        )
    );

-- Добавляем политику UPDATE для альбомов
-- Дистрибьюторы и администраторы могут обновлять любые альбомы, которые они создали
-- Артисты могут обновлять только альбомы текущего активного артиста (одобренной анкетой)
CREATE POLICY "Artists can update own albums" ON public.albums FOR
UPDATE TO authenticated USING (
    created_by = auth.uid ()
    AND (
        -- Дистрибьюторы и администраторы могут обновлять любые альбомы
        EXISTS (
            SELECT 1
            FROM public.users u
                JOIN public.roles r ON u.role_id = r.id
            WHERE
                u.id = auth.uid ()
                AND (
                    r.role_name = 'дистрибьютор'
                    OR r.role_name = 'администратор'
                )
        )
        OR
        -- Артисты могут обновлять только альбомы текущего активного артиста (одобренной анкетой)
        (
            EXISTS (
                SELECT 1
                FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                WHERE
                    u.id = auth.uid ()
                    AND r.role_name = 'артист'
            )
            AND EXISTS (
                SELECT 1
                FROM public.artists ar
                WHERE
                    ar.id = albums.artist_id
                    AND ar.user_id = auth.uid ()
                    AND EXISTS (
                        SELECT 1
                        FROM public.artist_applications aa
                        WHERE
                            aa.user_id = auth.uid ()
                            AND aa.status = 'approved'
                            AND aa.artist_name = ar.artist_name
                    )
            )
        )
    )
);

-- Политика DELETE: пользователь может удалять альбомы
-- Дистрибьюторы и администраторы могут удалять любые альбомы, которые они создали
-- Артисты могут удалять только альбомы текущего активного артиста (одобренной анкетой)
CREATE POLICY "Artists can delete own albums" ON public.albums FOR DELETE TO authenticated USING (
    created_by = auth.uid ()
    AND (
        -- Дистрибьюторы и администраторы могут удалять любые альбомы
        EXISTS (
            SELECT 1
            FROM public.users u
                JOIN public.roles r ON u.role_id = r.id
            WHERE
                u.id = auth.uid ()
                AND (
                    r.role_name = 'дистрибьютор'
                    OR r.role_name = 'администратор'
                )
        )
        OR
        -- Артисты могут удалять только альбомы текущего активного артиста (одобренной анкетой)
        (
            EXISTS (
                SELECT 1
                FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                WHERE
                    u.id = auth.uid ()
                    AND r.role_name = 'артист'
            )
            AND EXISTS (
                SELECT 1
                FROM public.artists ar
                WHERE
                    ar.id = albums.artist_id
                    AND ar.user_id = auth.uid ()
                    AND EXISTS (
                        SELECT 1
                        FROM public.artist_applications aa
                        WHERE
                            aa.user_id = auth.uid ()
                            AND aa.status = 'approved'
                            AND aa.artist_name = ar.artist_name
                    )
            )
        )
    )
);

-- =================================================================================================
-- ОБНОВЛЕНИЕ ПОЛИТИК ДЛЯ ПЛЕЙЛИСТОВ
-- =================================================================================================

-- Политики для плейлистов остаются без изменений, так как плейлисты могут создавать все пользователи
-- Но можно добавить ограничение, если нужно

-- Политика UPDATE для плейлистов остается прежней - любой пользователь может обновлять свои плейлисты
-- Политика DELETE для плейлистов остается прежней - любой пользователь может удалять свои плейлисты

-- =================================================================================================
-- КОНЕЦ МИГРАЦИИ
-- =================================================================================================