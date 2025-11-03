# ТАБЛИЦА ВЫХОДНЫХ ДАННЫХ ДЛЯ БАЗЫ ДАННЫХ IMPERIAL TUNES

## Представление: album_duration (Длительность альбомов)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор альбома | public.albums.id |
| 2 | album_title | VARCHAR(100) | Название альбома | public.albums.album_title |
| 3 | artist_id | UUID | Идентификатор артиста | public.albums.artist_id |
| 4 | artist_name | VARCHAR(100) | Название артиста/группы | public.artists.artist_name |
| 5 | album_release_date | DATE | Дата релиза альбома | public.albums.album_release_date |
| 6 | total_duration_seconds | INTEGER | Общая длительность альбома в секундах (SUM треков) | Вычисляемое: SUM(tracks.track_duration) |
| 7 | track_count | INTEGER | Количество треков в альбоме | Вычисляемое: COUNT(tracks.id) |
| 8 | created_at | TIMESTAMPTZ | Дата и время создания альбома | public.albums.created_at |
| 9 | updated_at | TIMESTAMPTZ | Дата и время последнего обновления | public.albums.updated_at |

**Условие фильтрации**: Только активные альбомы (is_active = TRUE)

---

## Представление: playlist_duration (Длительность плейлистов)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор плейлиста | public.playlists.id |
| 2 | playlist_title | VARCHAR(100) | Название плейлиста | public.playlists.playlist_title |
| 3 | user_id | UUID | Идентификатор владельца плейлиста | public.playlists.user_id |
| 4 | username | VARCHAR(50) | Имя пользователя - владельца | public.users.username |
| 5 | is_public | BOOLEAN | Статус публичности плейлиста | public.playlists.is_public |
| 6 | follow_count | INTEGER | Количество подписчиков | public.playlists.follow_count |
| 7 | total_duration_seconds | INTEGER | Общая длительность плейлиста в секундах | Вычисляемое: SUM(tracks.track_duration) |
| 8 | track_count | INTEGER | Количество треков в плейлисте | Вычисляемое: COUNT(playlist_tracks.track_id) |
| 9 | created_at | TIMESTAMPTZ | Дата и время создания плейлиста | public.playlists.created_at |
| 10 | updated_at | TIMESTAMPTZ | Дата и время последнего обновления | public.playlists.updated_at |

**Условие фильтрации**: Только активные плейлисты (is_active = TRUE)

---

## Представление: user_statistics (Статистика пользователей)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор пользователя | public.users.id |
| 2 | username | VARCHAR(50) | Имя пользователя | public.users.username |
| 3 | email | TEXT | Email пользователя | auth.users.email |
| 4 | role_name | VARCHAR(50) | Название роли пользователя | public.roles.role_name |
| 5 | created_at | TIMESTAMPTZ | Дата и время создания аккаунта | public.users.created_at |
| 6 | last_login | TIMESTAMPTZ | Дата и время последнего входа | public.users.last_login |
| 7 | playlist_count | INTEGER | Количество созданных плейлистов | Вычисляемое: COUNT(DISTINCT playlists.id) |
| 8 | total_listens | INTEGER | Общее количество прослушиваний | Вычисляемое: COUNT(DISTINCT listening_history.id) |
| 9 | unique_tracks_listened | INTEGER | Количество уникальных прослушанных треков | Вычисляемое: COUNT(DISTINCT listening_history.track_id) |

---

## Представление: track_statistics (Статистика треков)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | id | UUID | Уникальный идентификатор трека | public.tracks.id |
| 2 | track_title | VARCHAR(100) | Название трека | public.tracks.track_title |
| 3 | track_duration | INTEGER | Длительность трека в секундах | public.tracks.track_duration |
| 4 | track_play_count | INTEGER | Количество прослушиваний трека | public.tracks.track_play_count |
| 5 | track_like_count | INTEGER | Количество лайков трека | public.tracks.track_like_count |
| 6 | album_title | VARCHAR(100) | Название альбома | public.albums.album_title |
| 7 | artist_name | VARCHAR(100) | Название артиста | public.artists.artist_name |
| 8 | created_at | TIMESTAMPTZ | Дата и время создания трека | public.tracks.created_at |
| 9 | is_public | BOOLEAN | Статус публичности трека | public.tracks.is_public |
| 10 | popularity_level | VARCHAR(20) | Уровень популярности трека | Вычисляемое: CASE WHEN play_count > 10000 THEN 'Популярный' WHEN > 1000 THEN 'Популярный' WHEN > 100 THEN 'Средний' ELSE 'Новый' END |

**Уровни популярности**: 'Новый' (0-100), 'Средний' (101-1000), 'Популярный' (более 1000 прослушиваний)

---

## Функция: toggle_favorite_track() (Переключение избранного трека)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | success | BOOLEAN | Успешность выполнения операции | RETURN jsonb_build_object |
| 2 | action | VARCHAR(10) | Действие: 'added' или 'removed' | RETURN jsonb_build_object |
| 3 | error | TEXT | Сообщение об ошибке (если есть) | RETURN jsonb_build_object |

**Возможные значения action**: 'added' - трек добавлен в избранное, 'removed' - трек удален из избранного

---

## Функция: toggle_favorite_album() (Переключение избранного альбома)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | success | BOOLEAN | Успешность выполнения операции | RETURN jsonb_build_object |
| 2 | action | VARCHAR(10) | Действие: 'added' или 'removed' | RETURN jsonb_build_object |
| 3 | error | TEXT | Сообщение об ошибке (если есть) | RETURN jsonb_build_object |

**Возможные значения action**: 'added' - альбом добавлен в избранное, 'removed' - альбом удален из избранного

---

## Функция: toggle_favorite_playlist() (Переключение избранного плейлиста)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | success | BOOLEAN | Успешность выполнения операции | RETURN jsonb_build_object |
| 2 | action | VARCHAR(10) | Действие: 'added' или 'removed' | RETURN jsonb_build_object |
| 3 | error | TEXT | Сообщение об ошибке (если есть) | RETURN jsonb_build_object |

**Возможные значения action**: 'added' - плейлист добавлен в избранное, 'removed' - плейлист удален из избранного

---

## Функция: approve_artist_application() (Одобрение заявки артиста)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | success | BOOLEAN | Успешность выполнения операции | RETURN jsonb_build_object |
| 2 | message | TEXT | Сообщение о результате | RETURN jsonb_build_object |
| 3 | artist_id | UUID | Идентификатор созданного артиста | RETURN jsonb_build_object |
| 4 | error | TEXT | Сообщение об ошибке (если есть) | RETURN jsonb_build_object |

**Побочный эффект**: Обновление роли пользователя на 'артист', создание записи в таблице artists

---

## Функция: reject_artist_application() (Отклонение заявки артиста)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | success | BOOLEAN | Успешность выполнения операции | RETURN jsonb_build_object |
| 2 | message | TEXT | Сообщение о результате | RETURN jsonb_build_object |
| 3 | error | TEXT | Сообщение об ошибке (если есть) | RETURN jsonb_build_object |

**Побочный эффект**: Обновление статуса анкеты на 'rejected', добавление комментария дистрибьютора

---

## Функция: ensure_user_exists() (Проверка существования пользователя)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | success | BOOLEAN | Успешность выполнения операции | RETURN jsonb_build_object |
| 2 | message | TEXT | Сообщение о результате | RETURN jsonb_build_object |
| 3 | username | TEXT | Имя пользователя (если создан) | RETURN jsonb_build_object |
| 4 | error | TEXT | Сообщение об ошибке (если есть) | RETURN jsonb_build_object |

**Побочный эффект**: Автоматическое создание записи пользователя в public.users при первом вызове

---

## Функция: create_user_profile() (Создание профиля пользователя)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | success | BOOLEAN | Успешность выполнения операции | RETURN jsonb_build_object |
| 2 | username | TEXT | Имя созданного пользователя | RETURN jsonb_build_object |
| 3 | error | TEXT | Сообщение об ошибке (если есть) | RETURN jsonb_build_object |

**Побочный эффект**: Создание или обновление записи пользователя в public.users

---

## Триггер: listening_history_trigger (Автообновление счетчика прослушиваний)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | track_play_count | INTEGER | Обновленное количество прослушиваний трека | UPDATE tracks SET track_play_count = track_play_count + 1 |
| 2 | updated_at | TIMESTAMPTZ | Обновленное время изменения трека | UPDATE tracks SET updated_at = now() |

**Условие срабатывания**: AFTER INSERT ON public.listening_history

---

## Триггер: audit_tracks_trigger (Логирование изменений треков)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | Audit log record | RECORD | Запись в таблице audit_log для трека | INSERT INTO audit_log |

**Условие срабатывания**: AFTER INSERT OR UPDATE OR DELETE ON public.tracks

**Содержимое записи**: user_id, action_type, table_name='tracks', record_id, old_value (JSONB), new_value (JSONB), timestamp

---

## Триггер: audit_playlists_trigger (Логирование изменений плейлистов)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | Audit log record | RECORD | Запись в таблице audit_log для плейлиста | INSERT INTO audit_log |

**Условие срабатывания**: AFTER INSERT OR UPDATE OR DELETE ON public.playlists

**Содержимое записи**: user_id, action_type, table_name='playlists', record_id, old_value (JSONB), new_value (JSONB), timestamp

---

## Триггер: handle_new_user() (Автосоздание профиля при регистрации)

| № | Наименование выходных данных | Тип данных | Описание | Источник |
|---|----------------------------|------------|----------|----------|
| 1 | User profile record | RECORD | Созданный профиль пользователя | INSERT INTO public.users |

**Условие срабатывания**: AFTER INSERT ON auth.users

**Содержимое записи**: id (из auth.users), username, first_name, last_name, role_id (по умолчанию 'слушатель')

---

## Индексы для оптимизации запросов

### Индексы таблицы users:
- idx_users_username - индекс по username для быстрого поиска пользователей
- idx_users_role - индекс по role_id для фильтрации по ролям
- idx_users_last_login - индекс по last_login для сортировки по активности
- idx_users_created_at - индекс по created_at для сортировки по дате регистрации

### Индексы таблицы tracks:
- idx_tracks_album - индекс по album_id для поиска треков альбома
- idx_tracks_play_count DESC - индекс по track_play_count для топ-чартов
- idx_tracks_like_count DESC - индекс по track_like_count для популярных треков
- idx_tracks_created_at - индекс по created_at для новых треков
- idx_tracks_is_public - индекс по is_public для фильтрации публичных треков
- idx_tracks_uploaded_by - индекс по uploaded_by для поиска треков пользователя

### Индексы таблицы albums:
- idx_albums_created_by - индекс по created_by для поиска альбомов пользователя
- idx_albums_artist - индекс по artist_id для поиска альбомов артиста

### Индексы таблицы artists:
- idx_artists_user - индекс по user_id для связи с пользователем

### Индексы таблицы playlists:
- idx_playlists_user - индекс по user_id для поиска плейлистов пользователя
- idx_playlists_is_public - индекс по is_public для фильтрации публичных плейлистов
- idx_playlists_follow_count DESC - индекс по follow_count для популярных плейлистов
- idx_playlists_created_at - индекс по created_at для сортировки по дате

### Индексы таблицы listening_history:
- idx_listening_user - индекс по user_id для истории пользователя
- idx_listening_track - индекс по track_id для статистики трека
- idx_listening_date - индекс по listened_at для временной сортировки
- idx_listening_user_date - составной индекс по (user_id, listened_at) для истории пользователя

### Индексы таблицы audit_log:
- idx_audit_user - индекс по user_id для аудита действий пользователя
- idx_audit_table - индекс по table_name для фильтрации по таблицам
- idx_audit_timestamp - индекс по timestamp для временной сортировки
- idx_audit_action - индекс по action_type для фильтрации по типам действий

### Индексы таблицы favorites:
- idx_favorites_tracks_user - индекс по user_id для избранных треков
- idx_favorites_tracks_track - индекс по track_id для статистики трека
- idx_favorites_albums_user - индекс по user_id для избранных альбомов
- idx_favorites_albums_album - индекс по album_id для статистики альбома
- idx_favorites_playlists_user - индекс по user_id для избранных плейлистов
- idx_favorites_playlists_playlist - индекс по playlist_id для статистики плейлиста

### Индексы таблицы artist_applications:
- idx_artist_applications_user - индекс по user_id для заявок пользователя
- idx_artist_applications_status - индекс по status для фильтрации по статусам
- idx_artist_applications_reviewed_by - индекс по reviewed_by для работы дистрибьюторов

---

## КЛЮЧЕВЫЕ ОСОБЕННОСТИ ВЫХОДНЫХ ДАННЫХ

### Представления (Views):
- **Виртуальные таблицы** на основе JOIN нескольких таблиц
- Обновляются автоматически при изменении исходных данных
- Используют агрегатные функции (SUM, COUNT, DISTINCT)
- Применяют фильтрацию по is_active = TRUE

### Функции возвращают JSONB:
- Единый формат ответа с полями success, message, action, error
- Удобен для API и клиентских приложений
- Обработка ошибок через поле error

### Триггеры автоматизируют:
- Обновление счетчиков прослушиваний
- Логирование изменений в audit_log
- Создание профилей пользователей
- Обновление меток времени updated_at

### Индексы оптимизируют:
- Поиск по ключевым полям
- Сортировку по популярности (DESC)
- Составные запросы (JOIN)
- Агрегатные функции

---

**Дата создания документа**: 2025-01-29  
**Версия БД**: 5.0  
**База данных**: Imperial Tunes (Supabase)












