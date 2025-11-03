# ТАБЛИЦА ВХОДНЫХ ДАННЫХ ДЛЯ БАЗЫ ДАННЫХ IMPERIAL TUNES

## Таблица: roles (Роли)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор роли | AUTO (uuid_generate_v4) |
| 2 | role_name | VARCHAR(50) NOT NULL UNIQUE | Название роли: 'слушатель', 'администратор', 'артист', 'дистрибьютор', 'модератор' | Пользователь/SQL скрипт |
| 3 | role_description | TEXT | Описание роли | Пользователь/SQL скрипт |
| 4 | created_at | TIMESTAMPTZ NOT NULL | Дата и время создания записи | DEFAULT now() |
| 5 | updated_at | TIMESTAMPTZ NOT NULL | Дата и время последнего обновления | DEFAULT now() |

---

## Таблица: users (Пользователи)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID PRIMARY KEY | Уникальный идентификатор пользователя | auth.users (Supabase) |
| 2 | username | VARCHAR(50) NOT NULL UNIQUE | Имя пользователя (от 3 до 50 символов) | Триггер handle_new_user() / Пользователь |
| 3 | first_name | VARCHAR(50) | Имя пользователя | Метаданные auth.users / Пользователь |
| 4 | last_name | VARCHAR(50) | Фамилия пользователя | Метаданные auth.users / Пользователь |
| 5 | role_id | UUID | Идентификатор роли пользователя | public.roles (по умолчанию 'слушатель') |
| 6 | avatar_url | TEXT | URL аватара пользователя | Storage bucket 'avatars' |
| 7 | bio | TEXT | Биография пользователя | Пользователь |
| 8 | language | VARCHAR(10) NOT NULL | Язык интерфейса: 'ru', 'en' | DEFAULT 'ru' |
| 9 | is_active | BOOLEAN NOT NULL | Статус активности аккаунта | DEFAULT TRUE |
| 10 | created_at | TIMESTAMPTZ NOT NULL | Дата и время создания аккаунта | DEFAULT now() |
| 11 | updated_at | TIMESTAMPTZ NOT NULL | Дата и время последнего обновления | DEFAULT now() |
| 12 | last_login | TIMESTAMPTZ | Дата и время последнего входа | Триггер на auth.users |

---

## Таблица: genres (Жанры)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор жанра | AUTO (uuid_generate_v4) |
| 2 | genre_name | VARCHAR(50) NOT NULL UNIQUE | Название жанра (от 2 до 50 символов) | SQL скрипт / Администратор |
| 3 | genre_description | TEXT | Описание жанра | SQL скрипт / Администратор |
| 4 | is_active | BOOLEAN NOT NULL | Статус активности жанра | DEFAULT TRUE |
| 5 | created_at | TIMESTAMPTZ NOT NULL | Дата и время создания | DEFAULT now() |
| 6 | updated_at | TIMESTAMPTZ NOT NULL | Дата и время последнего обновления | DEFAULT now() |

---

## Таблица: artists (Артисты)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор артиста | AUTO (uuid_generate_v4) |
| 2 | artist_name | VARCHAR(100) NOT NULL UNIQUE | Название артиста/группы (от 2 до 100 символов) | Функция approve_artist_application() |
| 3 | artist_bio | TEXT | Биография артиста | Функция approve_artist_application() |
| 4 | artist_image_url | TEXT | URL изображения артиста | Storage bucket 'covers' |
| 5 | genre | VARCHAR(50) | Основной жанр артиста | Функция approve_artist_application() |
| 6 | user_id | UUID | Идентификатор пользователя-артиста | public.users |
| 7 | created_at | TIMESTAMPTZ NOT NULL | Дата и время создания | DEFAULT now() |
| 8 | updated_at | TIMESTAMPTZ NOT NULL | Дата и время последнего обновления | DEFAULT now() |

---

## Таблица: albums (Альбомы)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор альбома | AUTO (uuid_generate_v4) |
| 2 | album_title | VARCHAR(100) NOT NULL | Название альбома (от 2 до 100 символов) | Артист / Дистрибьютор |
| 3 | album_release_date | DATE NOT NULL | Дата релиза альбома (1900-01-01 до CURRENT_DATE + 1 год) | Артист / Дистрибьютор |
| 4 | artist_id | UUID NOT NULL | Идентификатор артиста | public.artists |
| 5 | created_by | UUID | Идентификатор пользователя, создавшего альбом | public.users |
| 6 | album_cover_url | TEXT | URL обложки альбома | Storage bucket 'covers' |
| 7 | album_description | TEXT | Описание альбома | Артист / Дистрибьютор |
| 8 | is_public | BOOLEAN NOT NULL | Статус публичности | DEFAULT TRUE |
| 9 | is_active | BOOLEAN NOT NULL | Статус активности | DEFAULT TRUE |
| 10 | created_at | TIMESTAMPTZ NOT NULL | Дата и время создания | DEFAULT now() |
| 11 | updated_at | TIMESTAMPTZ NOT NULL | Дата и время последнего обновления | DEFAULT now() |

---

## Таблица: tracks (Треки)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор трека | AUTO (uuid_generate_v4) |
| 2 | track_title | VARCHAR(100) NOT NULL | Название трека (от 1 до 100 символов) | Артист / Дистрибьютор |
| 3 | track_duration | INTEGER NOT NULL | Длительность трека в секундах (1-7200) | Автоматическое определение |
| 4 | album_id | UUID | Идентификатор альбома | public.albums |
| 5 | track_audio_url | TEXT NOT NULL | URL аудио файла | Storage bucket 'songs' |
| 6 | track_order | INTEGER NOT NULL | Порядковый номер в альбоме (более 0) | Артист / Дистрибьютор |
| 7 | track_play_count | INTEGER NOT NULL | Количество прослушиваний | DEFAULT 0, триггер listening_history |
| 8 | track_like_count | INTEGER NOT NULL | Количество лайков | DEFAULT 0, функция toggle_favorite |
| 9 | is_public | BOOLEAN NOT NULL | Статус публичности | DEFAULT TRUE |
| 10 | uploaded_by | UUID | Идентификатор пользователя, загрузившего трек | public.users |
| 11 | created_at | TIMESTAMPTZ NOT NULL | Дата и время создания | DEFAULT now() |
| 12 | updated_at | TIMESTAMPTZ NOT NULL | Дата и время последнего обновления | DEFAULT now() |

---

## Таблица: playlists (Плейлисты)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор плейлиста | AUTO (uuid_generate_v4) |
| 2 | playlist_title | VARCHAR(100) NOT NULL | Название плейлиста (от 2 до 100 символов) | Пользователь |
| 3 | playlist_description | TEXT | Описание плейлиста | Пользователь |
| 4 | user_id | UUID NOT NULL | Идентификатор владельца плейлиста | public.users |
| 5 | playlist_cover_url | TEXT | URL обложки плейлиста | Storage bucket 'covers' |
| 6 | is_public | BOOLEAN NOT NULL | Статус публичности | DEFAULT FALSE |
| 7 | is_active | BOOLEAN NOT NULL | Статус активности | DEFAULT TRUE |
| 8 | follow_count | INTEGER NOT NULL | Количество подписчиков (не менее 0) | DEFAULT 0 |
| 9 | created_at | TIMESTAMPTZ NOT NULL | Дата и время создания | DEFAULT now() |
| 10 | updated_at | TIMESTAMPTZ NOT NULL | Дата и время последнего обновления | DEFAULT now() |

---

## Таблица: track_genres (Связь Трек-Жанр)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор связи | AUTO (uuid_generate_v4) |
| 2 | track_id | UUID NOT NULL | Идентификатор трека (UNIQUE с genre_id) | public.tracks |
| 3 | genre_id | UUID NOT NULL | Идентификатор жанра (UNIQUE с track_id) | public.genres |
| 4 | created_at | TIMESTAMPTZ NOT NULL | Дата и время создания | DEFAULT now() |

---

## Таблица: playlist_tracks (Связь Плейлист-Трек)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор связи | AUTO (uuid_generate_v4) |
| 2 | playlist_id | UUID NOT NULL | Идентификатор плейлиста (UNIQUE с track_id) | public.playlists |
| 3 | track_id | UUID NOT NULL | Идентификатор трека (UNIQUE с playlist_id) | public.tracks |
| 4 | order_position | INTEGER NOT NULL | Позиция трека в плейлисте (более 0) | Пользователь |
| 5 | added_at | TIMESTAMPTZ NOT NULL | Дата и время добавления | DEFAULT now() |

---

## Таблица: listening_history (История прослушиваний)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор записи | AUTO (uuid_generate_v4) |
| 2 | user_id | UUID NOT NULL | Идентификатор пользователя | public.users |
| 3 | track_id | UUID NOT NULL | Идентификатор трека | public.tracks |
| 4 | listened_at | TIMESTAMPTZ NOT NULL | Дата и время прослушивания | DEFAULT now() |
| 5 | duration_played | INTEGER | Длительность воспроизведения в секундах (не менее 0) | Медиа-плеер |
| 6 | completed | BOOLEAN | Признак завершения прослушивания | DEFAULT FALSE |

---

## Таблица: audit_log (Лог аудита)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор записи | AUTO (uuid_generate_v4) |
| 2 | user_id | UUID | Идентификатор пользователя, выполнившего действие | public.users / auth.uid() |
| 3 | action_type | VARCHAR(100) NOT NULL | Тип действия: 'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'LOGIN', 'LOGOUT' | Триггер audit_changes() |
| 4 | table_name | VARCHAR(50) NOT NULL | Имя таблицы, над которой выполнено действие | Триггер audit_changes() |
| 5 | record_id | UUID | Идентификатор записи | Триггер audit_changes() |
| 6 | old_value | JSONB | Старое значение записи | Триггер audit_changes() |
| 7 | new_value | JSONB | Новое значение записи | Триггер audit_changes() |
| 8 | timestamp | TIMESTAMPTZ NOT NULL | Дата и время действия | DEFAULT now() |

---

## Таблица: favorites_tracks (Избранные треки)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор записи | AUTO (uuid_generate_v4) |
| 2 | user_id | UUID NOT NULL | Идентификатор пользователя (UNIQUE с track_id) | public.users / auth.uid() |
| 3 | track_id | UUID NOT NULL | Идентификатор трека (UNIQUE с user_id) | public.tracks |
| 4 | created_at | TIMESTAMPTZ NOT NULL | Дата и время добавления в избранное | DEFAULT now() |

---

## Таблица: favorites_albums (Избранные альбомы)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор записи | AUTO (uuid_generate_v4) |
| 2 | user_id | UUID NOT NULL | Идентификатор пользователя (UNIQUE с album_id) | public.users / auth.uid() |
| 3 | album_id | UUID NOT NULL | Идентификатор альбома (UNIQUE с user_id) | public.albums |
| 4 | created_at | TIMESTAMPTZ NOT NULL | Дата и время добавления в избранное | DEFAULT now() |

---

## Таблица: favorites_playlists (Избранные плейлисты)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор записи | AUTO (uuid_generate_v4) |
| 2 | user_id | UUID NOT NULL | Идентификатор пользователя (UNIQUE с playlist_id) | public.users / auth.uid() |
| 3 | playlist_id | UUID NOT NULL | Идентификатор плейлиста (UNIQUE с user_id) | public.playlists |
| 4 | created_at | TIMESTAMPTZ NOT NULL | Дата и время добавления в избранное | DEFAULT now() |

---

## Таблица: artist_applications (Анкеты артистов)

| № | Наименование входных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор анкеты | AUTO (uuid_generate_v4) |
| 2 | user_id | UUID NOT NULL | Идентификатор пользователя-заявителя | public.users |
| 3 | artist_name | VARCHAR(100) NOT NULL | Предполагаемое имя артиста/группы (от 2 до 100 символов) | Пользователь |
| 4 | artist_bio | TEXT | Биография артиста | Пользователь |
| 5 | artist_image_url | TEXT | URL изображения артиста | Storage bucket 'covers' |
| 6 | genre | VARCHAR(50) | Основной жанр | Пользователь |
| 7 | portfolio_url | TEXT | URL портфолио | Пользователь |
| 8 | social_media_urls | JSONB | Социальные сети в формате JSON | Пользователь |
| 9 | motivation | TEXT | Мотивационное письмо | Пользователь |
| 10 | status | VARCHAR(20) NOT NULL | Статус анкеты: 'pending', 'approved', 'rejected' | DEFAULT 'pending' |
| 11 | reviewed_by | UUID | Идентификатор дистрибьютора, рассмотревшего анкету | public.users (дистрибьютор) |
| 12 | review_comment | TEXT | Комментарий дистрибьютора | Дистрибьютор |
| 13 | reviewed_at | TIMESTAMPTZ | Дата и время рассмотрения | Дистрибьютор / функция approve/reject |
| 14 | created_at | TIMESTAMPTZ NOT NULL | Дата и время создания анкеты | DEFAULT now() |
| 15 | updated_at | TIMESTAMPTZ NOT NULL | Дата и время последнего обновления | DEFAULT now() |

---

## КЛЮЧЕВЫЕ ОГРАНИЧЕНИЯ И ПРАВИЛА

### Общие ограничения:
1. **UUID**: Все ID генерируются автоматически с помощью `uuid_generate_v4()`
2. **TIMESTAMPTZ**: Все временные метки в формате timestamp with timezone
3. **ON DELETE CASCADE**: При удалении родительской записи удаляются связанные записи
4. **ON DELETE SET NULL**: При удалении родительской записи связанное поле становится NULL
5. **ON DELETE RESTRICT**: При удалении родительской записи, если есть связанные записи, операция запрещена
6. **RLS (Row Level Security)**: Включена для всех таблиц

### Специфические проверки (CHECK):
- **username**: От 3 до 50 символов
- **artist_name**: От 2 до 100 символов
- **album_title**: От 2 до 100 символов
- **track_title**: От 1 до 100 символов
- **playlist_title**: От 2 до 100 символов
- **genre_name**: От 2 до 50 символов
- **track_duration**: От 1 до 7200 секунд (2 часа)
- **album_release_date**: От 1900-01-01 до текущей даты + 1 год
- **role_name**: Должно быть одним из: 'слушатель', 'администратор', 'артист', 'дистрибьютор', 'модератор'
- **status (artist_applications)**: Должно быть одним из: 'pending', 'approved', 'rejected'
- **language**: Должно быть 'ru' или 'en'
- **action_type**: Должно быть одним из: 'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'LOGIN', 'LOGOUT'

### Политики безопасности (RLS):
- Только авторизованные пользователи могут выполнять операции
- Пользователи могут видеть только свои личные данные
- Публичные треки и плейлисты доступны всем
- Только артисты и дистрибьюторы могут создавать альбомы
- Только дистрибьюторы могут одобрять/отклонять заявки артистов

### Storage Buckets:
- **songs**: Аудио файлы (макс 50 MB, типы: mp3, wav, flac, ogg, m4a)
- **covers**: Обложки альбомов/артистов (макс 5 MB, типы: jpeg, png, webp)
- **avatars**: Аватары пользователей (макс 5 MB, типы: jpeg, jpg, png, webp)

---

**Дата создания документа**: 2025-01-29  
**Версия БД**: 5.0  
**База данных**: Imperial Tunes (Supabase)
