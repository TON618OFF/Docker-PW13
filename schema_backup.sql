


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "public";






CREATE TYPE "public"."app_role" AS ENUM (
    'слушатель',
    'администратор',
    'артист',
    'дистрибьютор',
    'модератор'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."audio_format" AS ENUM (
    'mp3',
    'wav',
    'flac',
    'ogg',
    'm4a'
);


ALTER TYPE "public"."audio_format" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_artist_application"("p_application_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_id UUID;
    application_record RECORD;
    artist_role_id UUID;
    is_distributor BOOLEAN;
    new_artist_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    -- Проверяем, является ли пользователь дистрибьютором
    SELECT EXISTS(
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = current_user_id AND r.role_name = 'дистрибьютор'
    ) INTO is_distributor;
    
    IF NOT is_distributor THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Only distributors can approve applications');
    END IF;
    
    -- Получаем анкету
    SELECT * INTO application_record
    FROM public.artist_applications
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Application not found');
    END IF;
    
    IF application_record.status != 'pending' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Application already reviewed');
    END IF;
    
    -- Проверяем, не существует ли уже артист с таким именем
    IF EXISTS (SELECT 1 FROM public.artists WHERE artist_name = application_record.artist_name) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Artist with this name already exists');
    END IF;
    
    -- Получаем ID роли артиста
    SELECT id INTO artist_role_id
    FROM public.roles
    WHERE role_name = 'артист'
    LIMIT 1;
    
    IF artist_role_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Artist role not found');
    END IF;
    
    -- Создаём артиста из данных анкеты и связываем с пользователем
    INSERT INTO public.artists (
        artist_name,
        artist_bio,
        artist_image_url,
        genre,
        user_id
    ) VALUES (
        application_record.artist_name,
        application_record.artist_bio,
        application_record.artist_image_url,
        application_record.genre,
        application_record.user_id
    ) RETURNING id INTO new_artist_id;
    
    -- Обновляем роль пользователя
    UPDATE public.users
    SET role_id = artist_role_id
    WHERE id = application_record.user_id;
    
    -- Обновляем статус анкеты
    UPDATE public.artist_applications
    SET 
        status = 'approved',
        reviewed_by = current_user_id,
        reviewed_at = now()
    WHERE id = p_application_id;
    
    RETURN jsonb_build_object('success', TRUE, 'message', 'Application approved', 'artist_id', new_artist_id);
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Artist with this name already exists');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."approve_artist_application"("p_application_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action_type, table_name, record_id, new_value)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action_type, table_name, record_id, old_value, new_value)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action_type, table_name, record_id, old_value)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
END;
$$;


ALTER FUNCTION "public"."audit_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_role_not_changed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."check_role_not_changed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_username" "text", "p_first_name" "text" DEFAULT NULL::"text", "p_last_name" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_username" "text", "p_first_name" "text", "p_last_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_user_exists"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."ensure_user_exists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_listening"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.tracks 
  SET track_play_count = track_play_count + 1,
      updated_at = now()
  WHERE id = NEW.track_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_listening"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_artist_application"("p_application_id" "uuid", "p_comment" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_id UUID;
    application_record RECORD;
    is_distributor BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    -- Проверяем, является ли пользователь дистрибьютором
    SELECT EXISTS(
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = current_user_id AND r.role_name = 'дистрибьютор'
    ) INTO is_distributor;
    
    IF NOT is_distributor THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Only distributors can reject applications');
    END IF;
    
    -- Получаем анкету
    SELECT * INTO application_record
    FROM public.artist_applications
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Application not found');
    END IF;
    
    IF application_record.status != 'pending' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Application already reviewed');
    END IF;
    
    -- Обновляем статус анкеты
    UPDATE public.artist_applications
    SET 
        status = 'rejected',
        reviewed_by = current_user_id,
        review_comment = p_comment,
        reviewed_at = now()
    WHERE id = p_application_id;
    
    RETURN jsonb_build_object('success', TRUE, 'message', 'Application rejected');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."reject_artist_application"("p_application_id" "uuid", "p_comment" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_favorite_album"("p_album_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_id UUID;
    exists_check BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM public.favorites_albums 
        WHERE user_id = current_user_id AND album_id = p_album_id
    ) INTO exists_check;
    
    IF exists_check THEN
        DELETE FROM public.favorites_albums 
        WHERE user_id = current_user_id AND album_id = p_album_id;
        RETURN jsonb_build_object('success', TRUE, 'action', 'removed');
    ELSE
        INSERT INTO public.favorites_albums (user_id, album_id)
        VALUES (current_user_id, p_album_id);
        RETURN jsonb_build_object('success', TRUE, 'action', 'added');
    END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_favorite_album"("p_album_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_favorite_playlist"("p_playlist_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_id UUID;
    exists_check BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM public.favorites_playlists 
        WHERE user_id = current_user_id AND playlist_id = p_playlist_id
    ) INTO exists_check;
    
    IF exists_check THEN
        DELETE FROM public.favorites_playlists 
        WHERE user_id = current_user_id AND playlist_id = p_playlist_id;
        RETURN jsonb_build_object('success', TRUE, 'action', 'removed');
    ELSE
        INSERT INTO public.favorites_playlists (user_id, playlist_id)
        VALUES (current_user_id, p_playlist_id);
        RETURN jsonb_build_object('success', TRUE, 'action', 'added');
    END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_favorite_playlist"("p_playlist_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_favorite_track"("p_track_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_id UUID;
    exists_check BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User not authenticated');
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM public.favorites_tracks 
        WHERE user_id = current_user_id AND track_id = p_track_id
    ) INTO exists_check;
    
    IF exists_check THEN
        DELETE FROM public.favorites_tracks 
        WHERE user_id = current_user_id AND track_id = p_track_id;
        RETURN jsonb_build_object('success', TRUE, 'action', 'removed');
    ELSE
        INSERT INTO public.favorites_tracks (user_id, track_id)
        VALUES (current_user_id, p_track_id);
        RETURN jsonb_build_object('success', TRUE, 'action', 'added');
    END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_favorite_track"("p_track_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."albums" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "album_title" character varying(100) NOT NULL,
    "album_release_date" "date" NOT NULL,
    "artist_id" "uuid",
    "created_by" "uuid",
    "album_cover_url" "text",
    "album_description" "text",
    "is_public" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "albums_album_release_date_check" CHECK ((("album_release_date" >= '1900-01-01'::"date") AND ("album_release_date" <= (CURRENT_DATE + '1 year'::interval)))),
    CONSTRAINT "albums_album_title_check" CHECK ((("length"(("album_title")::"text") >= 2) AND ("length"(("album_title")::"text") <= 100)))
);


ALTER TABLE "public"."albums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artists" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "artist_name" character varying(100) NOT NULL,
    "artist_bio" "text",
    "artist_image_url" "text",
    "genre" character varying(50),
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "artists_artist_name_check" CHECK ((("length"(("artist_name")::"text") >= 2) AND ("length"(("artist_name")::"text") <= 100)))
);


ALTER TABLE "public"."artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracks" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "track_title" character varying(100) NOT NULL,
    "track_duration" integer NOT NULL,
    "album_id" "uuid",
    "track_audio_url" "text" NOT NULL,
    "track_order" integer DEFAULT 1 NOT NULL,
    "track_play_count" integer DEFAULT 0 NOT NULL,
    "track_like_count" integer DEFAULT 0 NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tracks_track_duration_check" CHECK ((("track_duration" > 0) AND ("track_duration" <= 7200))),
    CONSTRAINT "tracks_track_like_count_check" CHECK (("track_like_count" >= 0)),
    CONSTRAINT "tracks_track_order_check" CHECK (("track_order" > 0)),
    CONSTRAINT "tracks_track_play_count_check" CHECK (("track_play_count" >= 0)),
    CONSTRAINT "tracks_track_title_check" CHECK ((("length"(("track_title")::"text") >= 1) AND ("length"(("track_title")::"text") <= 100)))
);


ALTER TABLE "public"."tracks" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."album_duration" AS
 SELECT "a"."id",
    "a"."album_title",
    "a"."artist_id",
    "ar"."artist_name",
    "a"."album_release_date",
    COALESCE("sum"("t"."track_duration"), (0)::bigint) AS "total_duration_seconds",
    "count"("t"."id") AS "track_count",
    "a"."created_at",
    "a"."updated_at"
   FROM (("public"."albums" "a"
     LEFT JOIN "public"."tracks" "t" ON (("a"."id" = "t"."album_id")))
     LEFT JOIN "public"."artists" "ar" ON (("a"."artist_id" = "ar"."id")))
  WHERE ("a"."is_active" = true)
  GROUP BY "a"."id", "a"."album_title", "a"."artist_id", "ar"."artist_name", "a"."album_release_date", "a"."created_at", "a"."updated_at";


ALTER VIEW "public"."album_duration" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artist_applications" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "artist_name" character varying(100) NOT NULL,
    "artist_bio" "text",
    "artist_image_url" "text",
    "genre" character varying(50),
    "portfolio_url" "text",
    "social_media_urls" "jsonb",
    "motivation" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "reviewed_by" "uuid",
    "review_comment" "text",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "artist_applications_artist_name_check" CHECK ((("length"(("artist_name")::"text") >= 2) AND ("length"(("artist_name")::"text") <= 100))),
    CONSTRAINT "artist_applications_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."artist_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "action_type" character varying(100) NOT NULL,
    "table_name" character varying(50) NOT NULL,
    "record_id" "uuid",
    "old_value" "jsonb",
    "new_value" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_log_action_type_check" CHECK ((("action_type")::"text" = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying, 'SELECT'::character varying, 'LOGIN'::character varying, 'LOGOUT'::character varying])::"text"[]))),
    CONSTRAINT "audit_log_table_name_check" CHECK ((("table_name")::"text" = ANY ((ARRAY['users'::character varying, 'artists'::character varying, 'albums'::character varying, 'tracks'::character varying, 'playlists'::character varying, 'track_genres'::character varying, 'playlist_tracks'::character varying, 'listening_history'::character varying, 'genres'::character varying, 'artist_applications'::character varying])::"text"[])))
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites_albums" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "album_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."favorites_albums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites_playlists" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "playlist_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."favorites_playlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites_tracks" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "track_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."favorites_tracks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."genres" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "genre_name" character varying(50) NOT NULL,
    "genre_description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "genres_genre_name_check" CHECK ((("length"(("genre_name")::"text") >= 2) AND ("length"(("genre_name")::"text") <= 50)))
);


ALTER TABLE "public"."genres" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listening_history" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "track_id" "uuid",
    "listened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "duration_played" integer,
    "completed" boolean DEFAULT false,
    CONSTRAINT "listening_history_duration_played_check" CHECK (("duration_played" >= 0))
);


ALTER TABLE "public"."listening_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playlist_tracks" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "playlist_id" "uuid",
    "track_id" "uuid",
    "order_position" integer NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "playlist_tracks_order_position_check" CHECK (("order_position" > 0))
);


ALTER TABLE "public"."playlist_tracks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playlists" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "playlist_title" character varying(100) NOT NULL,
    "playlist_description" "text",
    "user_id" "uuid",
    "playlist_cover_url" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "follow_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "playlists_follow_count_check" CHECK (("follow_count" >= 0)),
    CONSTRAINT "playlists_playlist_title_check" CHECK ((("length"(("playlist_title")::"text") >= 2) AND ("length"(("playlist_title")::"text") <= 100)))
);


ALTER TABLE "public"."playlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "username" character varying(50) NOT NULL,
    "first_name" character varying(50),
    "last_name" character varying(50),
    "role_id" "uuid",
    "avatar_url" "text",
    "bio" "text",
    "language" character varying(10) DEFAULT 'ru'::character varying NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_login" timestamp with time zone,
    CONSTRAINT "users_language_check" CHECK ((("language")::"text" = ANY ((ARRAY['ru'::character varying, 'en'::character varying])::"text"[]))),
    CONSTRAINT "users_username_check" CHECK ((("length"(("username")::"text") >= 3) AND ("length"(("username")::"text") <= 50)))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."playlist_duration" AS
 SELECT "p"."id",
    "p"."playlist_title",
    "p"."user_id",
    "u"."username",
    "p"."is_public",
    "p"."follow_count",
    COALESCE("sum"("t"."track_duration"), (0)::bigint) AS "total_duration_seconds",
    "count"("pt"."track_id") AS "track_count",
    "p"."created_at",
    "p"."updated_at"
   FROM ((("public"."playlists" "p"
     LEFT JOIN "public"."playlist_tracks" "pt" ON (("p"."id" = "pt"."playlist_id")))
     LEFT JOIN "public"."tracks" "t" ON (("pt"."track_id" = "t"."id")))
     LEFT JOIN "public"."users" "u" ON (("p"."user_id" = "u"."id")))
  WHERE ("p"."is_active" = true)
  GROUP BY "p"."id", "p"."playlist_title", "p"."user_id", "u"."username", "p"."is_public", "p"."follow_count", "p"."created_at", "p"."updated_at";


ALTER VIEW "public"."playlist_duration" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "role_name" character varying(50) NOT NULL,
    "role_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "roles_role_name_check" CHECK ((("role_name")::"text" = ANY ((ARRAY['слушатель'::character varying, 'дистрибьютор'::character varying, 'администратор'::character varying, 'артист'::character varying, 'модератор'::character varying])::"text"[])))
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."track_genres" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "track_id" "uuid",
    "genre_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."track_genres" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."track_statistics" AS
 SELECT "t"."id",
    "t"."track_title",
    "t"."track_duration",
    "t"."track_play_count",
    "t"."track_like_count",
    "a"."album_title",
    "ar"."artist_name",
    "t"."created_at",
    "t"."is_public",
        CASE
            WHEN ("t"."track_play_count" > 10000) THEN 'Популярный'::"text"
            WHEN ("t"."track_play_count" > 1000) THEN 'Популярный'::"text"
            WHEN ("t"."track_play_count" > 100) THEN 'Средний'::"text"
            ELSE 'Новый'::"text"
        END AS "popularity_level"
   FROM (("public"."tracks" "t"
     LEFT JOIN "public"."albums" "a" ON (("t"."album_id" = "a"."id")))
     LEFT JOIN "public"."artists" "ar" ON (("a"."artist_id" = "ar"."id")));


ALTER VIEW "public"."track_statistics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_statistics" AS
 SELECT "u"."id",
    "u"."username",
    "au"."email",
    "r"."role_name",
    "u"."created_at",
    "u"."last_login",
    "count"(DISTINCT "p"."id") AS "playlist_count",
    "count"(DISTINCT "lh"."id") AS "total_listens",
    "count"(DISTINCT "lh"."track_id") AS "unique_tracks_listened"
   FROM (((("public"."users" "u"
     LEFT JOIN "auth"."users" "au" ON (("u"."id" = "au"."id")))
     LEFT JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
     LEFT JOIN "public"."playlists" "p" ON (("u"."id" = "p"."user_id")))
     LEFT JOIN "public"."listening_history" "lh" ON (("u"."id" = "lh"."user_id")))
  GROUP BY "u"."id", "u"."username", "au"."email", "r"."role_name", "u"."created_at", "u"."last_login";


ALTER VIEW "public"."user_statistics" OWNER TO "postgres";


ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_applications"
    ADD CONSTRAINT "artist_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_artist_name_key" UNIQUE ("artist_name");



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites_albums"
    ADD CONSTRAINT "favorites_albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites_albums"
    ADD CONSTRAINT "favorites_albums_user_id_album_id_key" UNIQUE ("user_id", "album_id");



ALTER TABLE ONLY "public"."favorites_playlists"
    ADD CONSTRAINT "favorites_playlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites_playlists"
    ADD CONSTRAINT "favorites_playlists_user_id_playlist_id_key" UNIQUE ("user_id", "playlist_id");



ALTER TABLE ONLY "public"."favorites_tracks"
    ADD CONSTRAINT "favorites_tracks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites_tracks"
    ADD CONSTRAINT "favorites_tracks_user_id_track_id_key" UNIQUE ("user_id", "track_id");



ALTER TABLE ONLY "public"."genres"
    ADD CONSTRAINT "genres_genre_name_key" UNIQUE ("genre_name");



ALTER TABLE ONLY "public"."genres"
    ADD CONSTRAINT "genres_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listening_history"
    ADD CONSTRAINT "listening_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playlist_tracks"
    ADD CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playlist_tracks"
    ADD CONSTRAINT "playlist_tracks_playlist_id_track_id_key" UNIQUE ("playlist_id", "track_id");



ALTER TABLE ONLY "public"."playlists"
    ADD CONSTRAINT "playlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_role_name_key" UNIQUE ("role_name");



ALTER TABLE ONLY "public"."track_genres"
    ADD CONSTRAINT "track_genres_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."track_genres"
    ADD CONSTRAINT "track_genres_track_id_genre_id_key" UNIQUE ("track_id", "genre_id");



ALTER TABLE ONLY "public"."tracks"
    ADD CONSTRAINT "tracks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



CREATE INDEX "idx_albums_artist" ON "public"."albums" USING "btree" ("artist_id");



CREATE INDEX "idx_albums_created_by" ON "public"."albums" USING "btree" ("created_by");



CREATE INDEX "idx_artist_applications_reviewed_by" ON "public"."artist_applications" USING "btree" ("reviewed_by");



CREATE INDEX "idx_artist_applications_status" ON "public"."artist_applications" USING "btree" ("status");



CREATE INDEX "idx_artist_applications_user" ON "public"."artist_applications" USING "btree" ("user_id");



CREATE INDEX "idx_artists_user" ON "public"."artists" USING "btree" ("user_id");



CREATE INDEX "idx_audit_action" ON "public"."audit_log" USING "btree" ("action_type");



CREATE INDEX "idx_audit_table" ON "public"."audit_log" USING "btree" ("table_name");



CREATE INDEX "idx_audit_timestamp" ON "public"."audit_log" USING "btree" ("timestamp");



CREATE INDEX "idx_audit_user" ON "public"."audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_favorites_albums_album" ON "public"."favorites_albums" USING "btree" ("album_id");



CREATE INDEX "idx_favorites_albums_user" ON "public"."favorites_albums" USING "btree" ("user_id");



CREATE INDEX "idx_favorites_playlists_playlist" ON "public"."favorites_playlists" USING "btree" ("playlist_id");



CREATE INDEX "idx_favorites_playlists_user" ON "public"."favorites_playlists" USING "btree" ("user_id");



CREATE INDEX "idx_favorites_tracks_track" ON "public"."favorites_tracks" USING "btree" ("track_id");



CREATE INDEX "idx_favorites_tracks_user" ON "public"."favorites_tracks" USING "btree" ("user_id");



CREATE INDEX "idx_listening_date" ON "public"."listening_history" USING "btree" ("listened_at");



CREATE INDEX "idx_listening_track" ON "public"."listening_history" USING "btree" ("track_id");



CREATE INDEX "idx_listening_user" ON "public"."listening_history" USING "btree" ("user_id");



CREATE INDEX "idx_listening_user_date" ON "public"."listening_history" USING "btree" ("user_id", "listened_at");



CREATE INDEX "idx_playlists_created_at" ON "public"."playlists" USING "btree" ("created_at");



CREATE INDEX "idx_playlists_follow_count" ON "public"."playlists" USING "btree" ("follow_count" DESC);



CREATE INDEX "idx_playlists_is_public" ON "public"."playlists" USING "btree" ("is_public");



CREATE INDEX "idx_playlists_user" ON "public"."playlists" USING "btree" ("user_id");



CREATE INDEX "idx_tracks_album" ON "public"."tracks" USING "btree" ("album_id");



CREATE INDEX "idx_tracks_created_at" ON "public"."tracks" USING "btree" ("created_at");



CREATE INDEX "idx_tracks_is_public" ON "public"."tracks" USING "btree" ("is_public");



CREATE INDEX "idx_tracks_like_count" ON "public"."tracks" USING "btree" ("track_like_count" DESC);



CREATE INDEX "idx_tracks_play_count" ON "public"."tracks" USING "btree" ("track_play_count" DESC);



CREATE INDEX "idx_tracks_uploaded_by" ON "public"."tracks" USING "btree" ("uploaded_by");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at");



CREATE INDEX "idx_users_last_login" ON "public"."users" USING "btree" ("last_login");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role_id");



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");



CREATE OR REPLACE TRIGGER "audit_playlists_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."playlists" FOR EACH ROW EXECUTE FUNCTION "public"."audit_changes"();



CREATE OR REPLACE TRIGGER "audit_tracks_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."tracks" FOR EACH ROW EXECUTE FUNCTION "public"."audit_changes"();



CREATE OR REPLACE TRIGGER "check_role_change" BEFORE UPDATE ON "public"."users" FOR EACH ROW WHEN (("old"."role_id" IS DISTINCT FROM "new"."role_id")) EXECUTE FUNCTION "public"."check_role_not_changed"();



CREATE OR REPLACE TRIGGER "listening_history_trigger" AFTER INSERT ON "public"."listening_history" FOR EACH ROW EXECUTE FUNCTION "public"."log_listening"();



CREATE OR REPLACE TRIGGER "update_albums_updated_at" BEFORE UPDATE ON "public"."albums" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_artist_applications_updated_at" BEFORE UPDATE ON "public"."artist_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_artists_updated_at" BEFORE UPDATE ON "public"."artists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_playlists_updated_at" BEFORE UPDATE ON "public"."playlists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tracks_updated_at" BEFORE UPDATE ON "public"."tracks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artist_applications"
    ADD CONSTRAINT "artist_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artist_applications"
    ADD CONSTRAINT "artist_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."favorites_albums"
    ADD CONSTRAINT "favorites_albums_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites_albums"
    ADD CONSTRAINT "favorites_albums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites_playlists"
    ADD CONSTRAINT "favorites_playlists_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites_playlists"
    ADD CONSTRAINT "favorites_playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites_tracks"
    ADD CONSTRAINT "favorites_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites_tracks"
    ADD CONSTRAINT "favorites_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listening_history"
    ADD CONSTRAINT "listening_history_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listening_history"
    ADD CONSTRAINT "listening_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playlist_tracks"
    ADD CONSTRAINT "playlist_tracks_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playlist_tracks"
    ADD CONSTRAINT "playlist_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playlists"
    ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."track_genres"
    ADD CONSTRAINT "track_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."track_genres"
    ADD CONSTRAINT "track_genres_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracks"
    ADD CONSTRAINT "tracks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracks"
    ADD CONSTRAINT "tracks_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT;



CREATE POLICY "Admins can update any user" ON "public"."users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'администратор'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'администратор'::"text")))));



CREATE POLICY "Anyone can view artists" ON "public"."artists" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view genres" ON "public"."genres" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view public albums" ON "public"."albums" FOR SELECT TO "authenticated" USING ((("is_public" = true) OR ("is_active" = true)));



CREATE POLICY "Anyone can view public playlists" ON "public"."playlists" FOR SELECT TO "authenticated" USING (("is_public" = true));



CREATE POLICY "Anyone can view public tracks" ON "public"."tracks" FOR SELECT TO "authenticated" USING (("is_public" = true));



CREATE POLICY "Anyone can view roles" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view track genres" ON "public"."track_genres" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Artists can delete own albums" ON "public"."albums" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("r"."role_name")::"text" = 'дистрибьютор'::"text") OR (("r"."role_name")::"text" = 'администратор'::"text"))))) OR ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'артист'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."artists" "ar"
  WHERE (("ar"."id" = "albums"."artist_id") AND ("ar"."user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."artist_applications" "aa"
          WHERE (("aa"."user_id" = "auth"."uid"()) AND (("aa"."status")::"text" = 'approved'::"text") AND (("aa"."artist_name")::"text" = ("ar"."artist_name")::"text")))))))))));



CREATE POLICY "Artists can delete own tracks" ON "public"."tracks" FOR DELETE TO "authenticated" USING ((("uploaded_by" = "auth"."uid"()) AND ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("r"."role_name")::"text" = 'дистрибьютор'::"text") OR (("r"."role_name")::"text" = 'администратор'::"text"))))) OR ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'артист'::"text")))) AND (EXISTS ( SELECT 1
   FROM ("public"."albums" "a"
     JOIN "public"."artists" "ar" ON (("a"."artist_id" = "ar"."id")))
  WHERE (("a"."id" = "tracks"."album_id") AND ("ar"."user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."artist_applications" "aa"
          WHERE (("aa"."user_id" = "auth"."uid"()) AND (("aa"."status")::"text" = 'approved'::"text") AND (("aa"."artist_name")::"text" = ("ar"."artist_name")::"text")))))))))));



CREATE POLICY "Artists can insert albums" ON "public"."albums" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("r"."role_name")::"text" = 'дистрибьютор'::"text") OR (("r"."role_name")::"text" = 'администратор'::"text"))))) OR ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'артист'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."artists" "ar"
  WHERE (("ar"."id" = "albums"."artist_id") AND ("ar"."user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."artist_applications" "aa"
          WHERE (("aa"."user_id" = "auth"."uid"()) AND (("aa"."status")::"text" = 'approved'::"text") AND (("aa"."artist_name")::"text" = ("ar"."artist_name")::"text")))))))))));



CREATE POLICY "Artists can insert tracks" ON "public"."tracks" FOR INSERT TO "authenticated" WITH CHECK ((("uploaded_by" = "auth"."uid"()) AND ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("r"."role_name")::"text" = 'дистрибьютор'::"text") OR (("r"."role_name")::"text" = 'администратор'::"text"))))) OR ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'артист'::"text")))) AND (EXISTS ( SELECT 1
   FROM ("public"."albums" "a"
     JOIN "public"."artists" "ar" ON (("a"."artist_id" = "ar"."id")))
  WHERE (("a"."id" = "tracks"."album_id") AND ("ar"."user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."artist_applications" "aa"
          WHERE (("aa"."user_id" = "auth"."uid"()) AND (("aa"."status")::"text" = 'approved'::"text") AND (("aa"."artist_name")::"text" = ("ar"."artist_name")::"text")))))))))));



CREATE POLICY "Artists can update own albums" ON "public"."albums" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("r"."role_name")::"text" = 'дистрибьютор'::"text") OR (("r"."role_name")::"text" = 'администратор'::"text"))))) OR ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'артист'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."artists" "ar"
  WHERE (("ar"."id" = "albums"."artist_id") AND ("ar"."user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."artist_applications" "aa"
          WHERE (("aa"."user_id" = "auth"."uid"()) AND (("aa"."status")::"text" = 'approved'::"text") AND (("aa"."artist_name")::"text" = ("ar"."artist_name")::"text")))))))))));



CREATE POLICY "Artists can update own tracks" ON "public"."tracks" FOR UPDATE TO "authenticated" USING ((("uploaded_by" = "auth"."uid"()) AND ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("r"."role_name")::"text" = 'дистрибьютор'::"text") OR (("r"."role_name")::"text" = 'администратор'::"text"))))) OR ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'артист'::"text")))) AND (EXISTS ( SELECT 1
   FROM ("public"."albums" "a"
     JOIN "public"."artists" "ar" ON (("a"."artist_id" = "ar"."id")))
  WHERE (("a"."id" = "tracks"."album_id") AND ("ar"."user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."artist_applications" "aa"
          WHERE (("aa"."user_id" = "auth"."uid"()) AND (("aa"."status")::"text" = 'approved'::"text") AND (("aa"."artist_name")::"text" = ("ar"."artist_name")::"text")))))))))));



CREATE POLICY "Authenticated users can insert track genres" ON "public"."track_genres" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Distributors can approve applications" ON "public"."users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'дистрибьютор'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'дистрибьютор'::"text")))));



CREATE POLICY "Distributors can update artist applications" ON "public"."artist_applications" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'дистрибьютор'::"text")))));



CREATE POLICY "Distributors can view all artist applications" ON "public"."artist_applications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."roles" "r" ON (("u"."role_id" = "r"."id")))
  WHERE (("u"."id" = "auth"."uid"()) AND (("r"."role_name")::"text" = 'дистрибьютор'::"text")))));



CREATE POLICY "Users can create artist applications" ON "public"."artist_applications" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (("status")::"text" = 'pending'::"text")));



CREATE POLICY "Users can create playlists" ON "public"."playlists" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own playlists" ON "public"."playlists" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own listening history" ON "public"."listening_history" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own favorite albums" ON "public"."favorites_albums" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own favorite playlists" ON "public"."favorites_playlists" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own favorite tracks" ON "public"."favorites_tracks" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage tracks in own playlists" ON "public"."playlist_tracks" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."playlists"
  WHERE (("playlists"."id" = "playlist_tracks"."playlist_id") AND ("playlists"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own playlists" ON "public"."playlists" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own artist applications" ON "public"."artist_applications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own audit logs" ON "public"."audit_log" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own favorite albums" ON "public"."favorites_albums" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own favorite playlists" ON "public"."favorites_playlists" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own favorite tracks" ON "public"."favorites_tracks" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own listening history" ON "public"."listening_history" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own playlists" ON "public"."playlists" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own tracks" ON "public"."tracks" FOR SELECT TO "authenticated" USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can view public user info" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view tracks in accessible playlists" ON "public"."playlist_tracks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."playlists"
  WHERE (("playlists"."id" = "playlist_tracks"."playlist_id") AND (("playlists"."user_id" = "auth"."uid"()) OR ("playlists"."is_public" = true))))));



ALTER TABLE "public"."albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites_albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites_playlists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites_tracks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."genres" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listening_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playlist_tracks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playlists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."track_genres" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tracks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";















GRANT ALL ON FUNCTION "public"."approve_artist_application"("p_application_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_artist_application"("p_application_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_artist_application"("p_application_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."armor"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."armor"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."armor"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."armor"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."armor"("bytea", "text"[], "text"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."armor"("bytea", "text"[], "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."armor"("bytea", "text"[], "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."armor"("bytea", "text"[], "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_role_not_changed"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_role_not_changed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_role_not_changed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_username" "text", "p_first_name" "text", "p_last_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_username" "text", "p_first_name" "text", "p_last_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_username" "text", "p_first_name" "text", "p_last_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."crypt"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."crypt"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."crypt"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."crypt"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."dearmor"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."dearmor"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."dearmor"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dearmor"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt"("bytea", "bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."decrypt"("bytea", "bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt"("bytea", "bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt"("bytea", "bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."digest"("bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."digest"("bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."digest"("bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."digest"("bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."digest"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."digest"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."digest"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."digest"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt"("bytea", "bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."encrypt"("bytea", "bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt"("bytea", "bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt"("bytea", "bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_user_exists"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_user_exists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_user_exists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gen_random_bytes"(integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."gen_random_bytes"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gen_random_bytes"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gen_random_bytes"(integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gen_random_uuid"() TO "postgres";
GRANT ALL ON FUNCTION "public"."gen_random_uuid"() TO "anon";
GRANT ALL ON FUNCTION "public"."gen_random_uuid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."gen_random_uuid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gen_salt"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."gen_salt"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."gen_salt"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gen_salt"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."gen_salt"("text", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."gen_salt"("text", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gen_salt"("text", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gen_salt"("text", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hmac"("bytea", "bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."hmac"("bytea", "bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hmac"("bytea", "bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hmac"("bytea", "bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hmac"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."hmac"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hmac"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hmac"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_listening"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_listening"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_listening"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_key_id"("bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_key_id"("bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_key_id"("bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_key_id"("bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt"("text", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt"("text", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt"("text", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt"("text", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt"("text", "bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt"("text", "bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt"("text", "bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt"("text", "bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt"("bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt"("bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt"("bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt"("bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt"("bytea", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt"("bytea", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt"("bytea", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt"("bytea", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt_bytea"("bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt_bytea"("bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt_bytea"("bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt_bytea"("bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt"("text", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt"("text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt"("text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt"("text", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt_bytea"("bytea", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt_bytea"("bytea", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt_bytea"("bytea", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt_bytea"("bytea", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_artist_application"("p_application_id" "uuid", "p_comment" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_artist_application"("p_application_id" "uuid", "p_comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_artist_application"("p_application_id" "uuid", "p_comment" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_favorite_album"("p_album_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_favorite_album"("p_album_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_favorite_album"("p_album_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_favorite_playlist"("p_playlist_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_favorite_playlist"("p_playlist_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_favorite_playlist"("p_playlist_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_favorite_track"("p_track_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_favorite_track"("p_track_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_favorite_track"("p_track_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_generate_v1"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_generate_v1mc"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1mc"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1mc"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1mc"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_nil"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_nil"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_nil"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_nil"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_ns_dns"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_ns_dns"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_ns_dns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_ns_dns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_ns_oid"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_ns_oid"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_ns_oid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_ns_oid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_ns_url"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_ns_url"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_ns_url"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_ns_url"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_ns_x500"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_ns_x500"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_ns_x500"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_ns_x500"() TO "service_role";


















GRANT ALL ON TABLE "public"."albums" TO "anon";
GRANT ALL ON TABLE "public"."albums" TO "authenticated";
GRANT ALL ON TABLE "public"."albums" TO "service_role";



GRANT ALL ON TABLE "public"."artists" TO "anon";
GRANT ALL ON TABLE "public"."artists" TO "authenticated";
GRANT ALL ON TABLE "public"."artists" TO "service_role";



GRANT ALL ON TABLE "public"."tracks" TO "anon";
GRANT ALL ON TABLE "public"."tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."tracks" TO "service_role";



GRANT ALL ON TABLE "public"."album_duration" TO "anon";
GRANT ALL ON TABLE "public"."album_duration" TO "authenticated";
GRANT ALL ON TABLE "public"."album_duration" TO "service_role";



GRANT ALL ON TABLE "public"."artist_applications" TO "anon";
GRANT ALL ON TABLE "public"."artist_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_applications" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."favorites_albums" TO "anon";
GRANT ALL ON TABLE "public"."favorites_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites_albums" TO "service_role";



GRANT ALL ON TABLE "public"."favorites_playlists" TO "anon";
GRANT ALL ON TABLE "public"."favorites_playlists" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites_playlists" TO "service_role";



GRANT ALL ON TABLE "public"."favorites_tracks" TO "anon";
GRANT ALL ON TABLE "public"."favorites_tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites_tracks" TO "service_role";



GRANT ALL ON TABLE "public"."genres" TO "anon";
GRANT ALL ON TABLE "public"."genres" TO "authenticated";
GRANT ALL ON TABLE "public"."genres" TO "service_role";



GRANT ALL ON TABLE "public"."listening_history" TO "anon";
GRANT ALL ON TABLE "public"."listening_history" TO "authenticated";
GRANT ALL ON TABLE "public"."listening_history" TO "service_role";



GRANT ALL ON TABLE "public"."playlist_tracks" TO "anon";
GRANT ALL ON TABLE "public"."playlist_tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."playlist_tracks" TO "service_role";



GRANT ALL ON TABLE "public"."playlists" TO "anon";
GRANT ALL ON TABLE "public"."playlists" TO "authenticated";
GRANT ALL ON TABLE "public"."playlists" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."playlist_duration" TO "anon";
GRANT ALL ON TABLE "public"."playlist_duration" TO "authenticated";
GRANT ALL ON TABLE "public"."playlist_duration" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."track_genres" TO "anon";
GRANT ALL ON TABLE "public"."track_genres" TO "authenticated";
GRANT ALL ON TABLE "public"."track_genres" TO "service_role";



GRANT ALL ON TABLE "public"."track_statistics" TO "anon";
GRANT ALL ON TABLE "public"."track_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."track_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."user_statistics" TO "anon";
GRANT ALL ON TABLE "public"."user_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_statistics" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































