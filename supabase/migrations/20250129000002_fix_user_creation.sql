-- Исправление функции handle_new_user для правильной работы с метаданными
-- Выполните этот скрипт после основного скрипта миграции

-- =================================================================================================
-- ИСПРАВЛЕНИЕ ФУНКЦИИ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ
-- =================================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id UUID;
  user_username TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
BEGIN
  -- Получаем ID роли "слушатель"
  SELECT id INTO default_role_id FROM public.roles WHERE role_name = 'слушатель' LIMIT 1;
  
  -- Если роль не найдена, создаем её
  IF default_role_id IS NULL THEN
    INSERT INTO public.roles (role_name, role_description) 
    VALUES ('слушатель', 'Обычный пользователь, может слушать музыку и создавать плейлисты')
    RETURNING id INTO default_role_id;
  END IF;

  -- Извлекаем метаданные
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user_' || substr(NEW.id::text, 1, 8)
  );
  
  -- Проверяем уникальность username
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = user_username) LOOP
    user_username := 'user_' || substr(NEW.id::text, 1, 8) || '_' || floor(random() * 10000)::text;
  END LOOP;

  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

  -- Создаем запись пользователя
  INSERT INTO public.users (id, username, first_name, last_name, role_id)
  VALUES (
    NEW.id, 
    user_username,
    NULLIF(user_first_name, ''),
    NULLIF(user_last_name, ''),
    default_role_id
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- В случае ошибки логируем и продолжаем
    RAISE WARNING 'Ошибка создания пользователя: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Функция для явного создания пользователя (для использования из клиента)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_username TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id UUID;
  final_username TEXT;
BEGIN
  -- Получаем ID роли "слушатель"
  SELECT id INTO default_role_id FROM public.roles WHERE role_name = 'слушатель' LIMIT 1;
  
  IF default_role_id IS NULL THEN
    INSERT INTO public.roles (role_name, role_description) 
    VALUES ('слушатель', 'Обычный пользователь, может слушать музыку и создавать плейлисты')
    RETURNING id INTO default_role_id;
  END IF;

  -- Проверяем и генерируем уникальный username
  final_username := COALESCE(p_username, 'user_' || substr(p_user_id::text, 1, 8));
  
  -- Если username занят, добавляем суффикс
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username AND id != p_user_id) LOOP
    final_username := 'user_' || substr(p_user_id::text, 1, 8) || '_' || floor(random() * 10000)::text;
  END LOOP;

  -- Создаём или обновляем пользователя
  INSERT INTO public.users (id, username, first_name, last_name, role_id)
  VALUES (
    p_user_id,
    final_username,
    NULLIF(p_first_name, ''),
    NULLIF(p_last_name, ''),
    default_role_id
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name);
  
  RETURN jsonb_build_object('success', TRUE, 'username', final_username);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- Обновляем функцию ensure_user_exists для работы с метаданными
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  auth_user_record RECORD;
  default_role_id UUID;
  user_exists BOOLEAN;
  final_username TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
  END IF;
  
  -- Проверяем, существует ли пользователь
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = current_user_id) INTO user_exists;
  
  IF user_exists THEN
    RETURN jsonb_build_object('success', TRUE, 'message', 'User already exists');
  END IF;
  
  -- Получаем данные из auth.users
  SELECT 
    id,
    email,
    raw_user_meta_data
  INTO auth_user_record
  FROM auth.users
  WHERE id = current_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Auth user not found');
  END IF;
  
  -- Получаем ID роли "слушатель"
  SELECT id INTO default_role_id FROM public.roles WHERE role_name = 'слушатель' LIMIT 1;
  
  IF default_role_id IS NULL THEN
    INSERT INTO public.roles (role_name, role_description) 
    VALUES ('слушатель', 'Обычный пользователь, может слушать музыку и создавать плейлисты')
    RETURNING id INTO default_role_id;
  END IF;

  -- Генерируем username
  final_username := COALESCE(
    auth_user_record.raw_user_meta_data->>'username',
    split_part(auth_user_record.email, '@', 1),
    'user_' || substr(current_user_id::text, 1, 8)
  );
  
  -- Проверяем уникальность
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    final_username := 'user_' || substr(current_user_id::text, 1, 8) || '_' || floor(random() * 10000)::text;
  END LOOP;

  -- Создаём пользователя
  INSERT INTO public.users (id, username, first_name, last_name, role_id)
  VALUES (
    current_user_id,
    final_username,
    NULLIF(COALESCE(auth_user_record.raw_user_meta_data->>'first_name', ''), ''),
    NULLIF(COALESCE(auth_user_record.raw_user_meta_data->>'last_name', ''), ''),
    default_role_id
  );
  
  RETURN jsonb_build_object('success', TRUE, 'message', 'User created successfully', 'username', final_username);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;