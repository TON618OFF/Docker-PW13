# Инструкция по созданию ERD-диаграмм в Visual Paradigm Online
## База данных Imperial Tunes

### Шаг 1: Подготовка

1. Откройте [Visual Paradigm Online](https://online.visual-paradigm.com/)
2. Создайте новый проект или откройте существующий
3. Выберите **New Diagram** → **ERD** → **Entity Relationship Diagram**

---

## ЧАСТЬ 1: ЛОГИЧЕСКАЯ ERD-ДИАГРАММА

Логическая ERD показывает концептуальную модель данных без технических деталей.

### Шаг 2: Создание сущностей (Entities)

Создайте следующие сущности через **Entity** инструмент:

#### 1. **ROLE (Роль)**
- Атрибуты:
  - role_name (PK) - Название роли
  - role_description - Описание роли

#### 2. **USER (Пользователь)**
- Атрибуты:
  - user_id (PK) - ID пользователя
  - username - Имя пользователя
  - first_name - Имя
  - last_name - Фамилия
  - email - Email (из auth.users)
  - avatar_url - URL аватара
  - bio - Биография
  - language - Язык интерфейса
  - last_login - Дата последнего входа

#### 3. **ARTIST (Артист)**
- Атрибуты:
  - artist_id (PK) - ID артиста
  - artist_name - Имя артиста
  - artist_bio - Биография артиста
  - artist_image_url - URL изображения
  - genre - Жанр

#### 4. **GENRE (Жанр)**
- Атрибуты:
  - genre_id (PK) - ID жанра
  - genre_name - Название жанра
  - genre_description - Описание жанра

#### 5. **ALBUM (Альбом)**
- Атрибуты:
  - album_id (PK) - ID альбома
  - album_title - Название альбома
  - album_release_date - Дата релиза
  - album_cover_url - URL обложки
  - album_description - Описание альбома
  - is_public - Публичность

#### 6. **TRACK (Трек)**
- Атрибуты:
  - track_id (PK) - ID трека
  - track_title - Название трека
  - track_duration - Длительность (секунды)
  - track_audio_url - URL аудио файла
  - track_order - Порядок в альбоме
  - track_play_count - Количество прослушиваний
  - track_like_count - Количество лайков
  - is_public - Публичность

#### 7. **PLAYLIST (Плейлист)**
- Атрибуты:
  - playlist_id (PK) - ID плейлиста
  - playlist_title - Название плейлиста
  - playlist_description - Описание
  - playlist_cover_url - URL обложки
  - is_public - Публичность
  - follow_count - Количество подписчиков

#### 8. **LISTENING_HISTORY (История прослушиваний)**
- Атрибуты:
  - history_id (PK) - ID записи
  - listened_at - Дата прослушивания
  - duration_played - Прослушано секунд
  - completed - Завершено ли прослушивание

#### 9. **ARTIST_APPLICATION (Анкета артиста)**
- Атрибуты:
  - application_id (PK) - ID анкеты
  - artist_name - Имя артиста
  - artist_bio - Биография
  - artist_image_url - URL изображения
  - genre - Жанр
  - portfolio_url - URL портфолио
  - social_media_urls - Социальные сети (JSON)
  - motivation - Мотивация
  - status - Статус (pending/approved/rejected)
  - review_comment - Комментарий при рассмотрении

### Шаг 3: Создание связей (Relationships)

#### Один-ко-многим (One-to-Many):

1. **ROLE** ──< **USER**
   - Роль может иметь множество пользователей
   - Пользователь имеет одну роль

2. **USER** ──< **ARTIST**
   - Пользователь может быть артистом (опционально)
   - Артист связан с одним пользователем

3. **ARTIST** ──< **ALBUM**
   - Артист может иметь множество альбомов
   - Альбом принадлежит одному артисту

4. **ALBUM** ──< **TRACK**
   - Альбом содержит множество треков
   - Трек принадлежит одному альбому

5. **USER** ──< **TRACK**
   - Пользователь может загрузить множество треков
   - Трек загружен одним пользователем

6. **USER** ──< **PLAYLIST**
   - Пользователь может создать множество плейлистов
   - Плейлист принадлежит одному пользователю

7. **USER** ──< **LISTENING_HISTORY**
   - Пользователь имеет множество записей истории
   - Запись истории принадлежит одному пользователю

8. **TRACK** ──< **LISTENING_HISTORY**
   - Трек может иметь множество записей истории
   - Запись истории относится к одному треку

9. **USER** ──< **ARTIST_APPLICATION**
   - Пользователь может подать множество анкет
   - Анкета принадлежит одному пользователю

#### Многие-ко-многим (Many-to-Many):

10. **TRACK** ──< **TRACK_GENRE** >── **GENRE**
    - Трек может иметь множество жанров
    - Жанр может быть у множества треков
    - Связующая сущность: **TRACK_GENRE**
      - track_id (FK)
      - genre_id (FK)

11. **PLAYLIST** ──< **PLAYLIST_TRACK** >── **TRACK**
    - Плейлист содержит множество треков
    - Трек может быть в множестве плейлистов
    - Связующая сущность: **PLAYLIST_TRACK**
      - playlist_id (FK)
      - track_id (FK)
      - order_position - Порядок в плейлисте

12. **USER** ──< **FAVORITE_TRACK** >── **TRACK**
    - Пользователь может добавить множество треков в избранное
    - Трек может быть в избранном у множества пользователей
    - Связующая сущность: **FAVORITE_TRACK**
      - user_id (FK)
      - track_id (FK)

13. **USER** ──< **FAVORITE_ALBUM** >── **ALBUM**
    - Связующая сущность: **FAVORITE_ALBUM**
      - user_id (FK)
      - album_id (FK)

14. **USER** ──< **FAVORITE_PLAYLIST** >── **PLAYLIST**
    - Связующая сущность: **FAVORITE_PLAYLIST**
      - user_id (FK)
      - playlist_id (FK)

---

## ЧАСТЬ 2: ФИЗИЧЕСКАЯ ERD-ДИАГРАММА

Физическая ERD показывает реальную структуру БД с типами данных, ограничениями и индексами.

### Шаг 4: Добавление физических деталей

Для каждой сущности добавьте:

#### Типы данных:

1. **roles**
   - `id`: UUID (PRIMARY KEY)
   - `role_name`: VARCHAR(50) (UNIQUE, NOT NULL)
   - `role_description`: TEXT
   - `created_at`: TIMESTAMPTZ (DEFAULT now())
   - `updated_at`: TIMESTAMPTZ (DEFAULT now())

2. **users**
   - `id`: UUID (PRIMARY KEY, REFERENCES auth.users)
   - `username`: VARCHAR(50) (UNIQUE, NOT NULL, CHECK length >= 3)
   - `first_name`: VARCHAR(50)
   - `last_name`: VARCHAR(50)
   - `role_id`: UUID (FOREIGN KEY → roles.id)
   - `avatar_url`: TEXT
   - `bio`: TEXT
   - `language`: VARCHAR(10) (DEFAULT 'ru', CHECK IN ('ru', 'en'))
   - `is_active`: BOOLEAN (DEFAULT TRUE)
   - `created_at`: TIMESTAMPTZ (DEFAULT now())
   - `updated_at`: TIMESTAMPTZ (DEFAULT now())
   - `last_login`: TIMESTAMPTZ

3. **artists**
   - `id`: UUID (PRIMARY KEY)
   - `artist_name`: VARCHAR(100) (UNIQUE, NOT NULL, CHECK length >= 2)
   - `artist_bio`: TEXT
   - `artist_image_url`: TEXT
   - `genre`: VARCHAR(50)
   - `user_id`: UUID (FOREIGN KEY → users.id, ON DELETE SET NULL)
   - `created_at`: TIMESTAMPTZ (DEFAULT now())
   - `updated_at`: TIMESTAMPTZ (DEFAULT now())

4. **genres**
   - `id`: UUID (PRIMARY KEY)
   - `genre_name`: VARCHAR(50) (UNIQUE, NOT NULL, CHECK length >= 2)
   - `genre_description`: TEXT
   - `is_active`: BOOLEAN (DEFAULT TRUE)
   - `created_at`: TIMESTAMPTZ (DEFAULT now())
   - `updated_at`: TIMESTAMPTZ (DEFAULT now())

5. **albums**
   - `id`: UUID (PRIMARY KEY)
   - `album_title`: VARCHAR(100) (NOT NULL, CHECK length >= 2)
   - `album_release_date`: DATE (NOT NULL, CHECK >= '1900-01-01')
   - `artist_id`: UUID (FOREIGN KEY → artists.id, ON DELETE CASCADE)
   - `created_by`: UUID (FOREIGN KEY → users.id, ON DELETE SET NULL)
   - `album_cover_url`: TEXT
   - `album_description`: TEXT
   - `is_public`: BOOLEAN (DEFAULT TRUE)
   - `is_active`: BOOLEAN (DEFAULT TRUE)
   - `created_at`: TIMESTAMPTZ (DEFAULT now())
   - `updated_at`: TIMESTAMPTZ (DEFAULT now())

6. **tracks**
   - `id`: UUID (PRIMARY KEY)
   - `track_title`: VARCHAR(100) (NOT NULL, CHECK length >= 1)
   - `track_duration`: INTEGER (NOT NULL, CHECK > 0 AND <= 7200)
   - `album_id`: UUID (FOREIGN KEY → albums.id, ON DELETE CASCADE)
   - `track_audio_url`: TEXT (NOT NULL)
   - `track_order`: INTEGER (DEFAULT 1, CHECK > 0)
   - `track_play_count`: INTEGER (DEFAULT 0, CHECK >= 0)
   - `track_like_count`: INTEGER (DEFAULT 0, CHECK >= 0)
   - `is_public`: BOOLEAN (DEFAULT TRUE)
   - `uploaded_by`: UUID (FOREIGN KEY → users.id, ON DELETE SET NULL)
   - `created_at`: TIMESTAMPTZ (DEFAULT now())
   - `updated_at`: TIMESTAMPTZ (DEFAULT now())

7. **playlists**
   - `id`: UUID (PRIMARY KEY)
   - `playlist_title`: VARCHAR(100) (NOT NULL, CHECK length >= 2)
   - `playlist_description`: TEXT
   - `user_id`: UUID (FOREIGN KEY → users.id, ON DELETE CASCADE)
   - `playlist_cover_url`: TEXT
   - `is_public`: BOOLEAN (DEFAULT FALSE)
   - `is_active`: BOOLEAN (DEFAULT TRUE)
   - `follow_count`: INTEGER (DEFAULT 0, CHECK >= 0)
   - `created_at`: TIMESTAMPTZ (DEFAULT now())
   - `updated_at`: TIMESTAMPTZ (DEFAULT now())

8. **track_genres**
   - `id`: UUID (PRIMARY KEY)
   - `track_id`: UUID (FOREIGN KEY → tracks.id, ON DELETE CASCADE)
   - `genre_id`: UUID (FOREIGN KEY → genres.id, ON DELETE CASCADE)
   - `created_at`: TIMESTAMPTZ (DEFAULT now())
   - UNIQUE(track_id, genre_id)

9. **playlist_tracks**
   - `id`: UUID (PRIMARY KEY)
   - `playlist_id`: UUID (FOREIGN KEY → playlists.id, ON DELETE CASCADE)
   - `track_id`: UUID (FOREIGN KEY → tracks.id, ON DELETE CASCADE)
   - `order_position`: INTEGER (NOT NULL, CHECK > 0)
   - `added_at`: TIMESTAMPTZ (DEFAULT now())
   - UNIQUE(playlist_id, track_id)

10. **listening_history**
    - `id`: UUID (PRIMARY KEY)
    - `user_id`: UUID (FOREIGN KEY → users.id, ON DELETE CASCADE)
    - `track_id`: UUID (FOREIGN KEY → tracks.id, ON DELETE CASCADE)
    - `listened_at`: TIMESTAMPTZ (DEFAULT now())
    - `duration_played`: INTEGER (CHECK >= 0)
    - `completed`: BOOLEAN (DEFAULT FALSE)

11. **favorites_tracks**
    - `id`: UUID (PRIMARY KEY)
    - `user_id`: UUID (FOREIGN KEY → users.id, ON DELETE CASCADE, NOT NULL)
    - `track_id`: UUID (FOREIGN KEY → tracks.id, ON DELETE CASCADE, NOT NULL)
    - `created_at`: TIMESTAMPTZ (DEFAULT now())
    - UNIQUE(user_id, track_id)

12. **favorites_albums**
    - `id`: UUID (PRIMARY KEY)
    - `user_id`: UUID (FOREIGN KEY → users.id, ON DELETE CASCADE, NOT NULL)
    - `album_id`: UUID (FOREIGN KEY → albums.id, ON DELETE CASCADE, NOT NULL)
    - `created_at`: TIMESTAMPTZ (DEFAULT now())
    - UNIQUE(user_id, album_id)

13. **favorites_playlists**
    - `id`: UUID (PRIMARY KEY)
    - `user_id`: UUID (FOREIGN KEY → users.id, ON DELETE CASCADE, NOT NULL)
    - `playlist_id`: UUID (FOREIGN KEY → playlists.id, ON DELETE CASCADE, NOT NULL)
    - `created_at`: TIMESTAMPTZ (DEFAULT now())
    - UNIQUE(user_id, playlist_id)

14. **artist_applications**
    - `id`: UUID (PRIMARY KEY)
    - `user_id`: UUID (FOREIGN KEY → users.id, ON DELETE CASCADE, NOT NULL)
    - `artist_name`: VARCHAR(100) (NOT NULL, CHECK length >= 2)
    - `artist_bio`: TEXT
    - `artist_image_url`: TEXT
    - `genre`: VARCHAR(50)
    - `portfolio_url`: TEXT
    - `social_media_urls`: JSONB
    - `motivation`: TEXT
    - `status`: VARCHAR(20) (DEFAULT 'pending', CHECK IN ('pending', 'approved', 'rejected'))
    - `reviewed_by`: UUID (FOREIGN KEY → users.id, ON DELETE SET NULL)
    - `review_comment`: TEXT
    - `reviewed_at`: TIMESTAMPTZ
    - `created_at`: TIMESTAMPTZ (DEFAULT now())
    - `updated_at`: TIMESTAMPTZ (DEFAULT now())

15. **audit_log**
    - `id`: UUID (PRIMARY KEY)
    - `user_id`: UUID (FOREIGN KEY → users.id, ON DELETE SET NULL)
    - `action_type`: VARCHAR(100) (NOT NULL, CHECK IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'LOGIN', 'LOGOUT'))
    - `table_name`: VARCHAR(50) (NOT NULL)
    - `record_id`: UUID
    - `old_value`: JSONB
    - `new_value`: JSONB
    - `timestamp`: TIMESTAMPTZ (DEFAULT now())

### Шаг 5: Добавление индексов

В Visual Paradigm Online добавьте индексы через свойства сущности:

**users:**
- idx_users_username (username)
- idx_users_role (role_id)
- idx_users_last_login (last_login)
- idx_users_created_at (created_at)

**tracks:**
- idx_tracks_album (album_id)
- idx_tracks_play_count (track_play_count DESC)
- idx_tracks_like_count (track_like_count DESC)
- idx_tracks_created_at (created_at)
- idx_tracks_is_public (is_public)
- idx_tracks_uploaded_by (uploaded_by)

**albums:**
- idx_albums_created_by (created_by)
- idx_albums_artist (artist_id)

**artists:**
- idx_artists_user (user_id)

**playlists:**
- idx_playlists_user (user_id)
- idx_playlists_is_public (is_public)
- idx_playlists_follow_count (follow_count DESC)
- idx_playlists_created_at (created_at)

**listening_history:**
- idx_listening_user (user_id)
- idx_listening_track (track_id)
- idx_listening_date (listened_at)
- idx_listening_user_date (user_id, listened_at)

**favorites_tracks:**
- idx_favorites_tracks_user (user_id)
- idx_favorites_tracks_track (track_id)

**favorites_albums:**
- idx_favorites_albums_user (user_id)
- idx_favorites_albums_album (album_id)

**favorites_playlists:**
- idx_favorites_playlists_user (user_id)
- idx_favorites_playlists_playlist (playlist_id)

**artist_applications:**
- idx_artist_applications_user (user_id)
- idx_artist_applications_status (status)
- idx_artist_applications_reviewed_by (reviewed_by)

**audit_log:**
- idx_audit_user (user_id)
- idx_audit_table (table_name)
- idx_audit_timestamp (timestamp)
- idx_audit_action (action_type)

### Шаг 6: Настройка кардинальности связей

В Visual Paradigm Online настройте кардинальность:

- **ROLE** ──< **USER**: 1:N (Одна роль - много пользователей)
- **USER** ──< **ARTIST**: 1:0..1 (Один пользователь - ноль или один артист)
- **ARTIST** ──< **ALBUM**: 1:N (Один артист - много альбомов)
- **ALBUM** ──< **TRACK**: 1:N (Один альбом - много треков)
- **USER** ──< **TRACK**: 1:N (Один пользователь - много треков)
- **USER** ──< **PLAYLIST**: 1:N (Один пользователь - много плейлистов)
- **USER** ──< **LISTENING_HISTORY**: 1:N
- **TRACK** ──< **LISTENING_HISTORY**: 1:N
- **USER** ──< **ARTIST_APPLICATION**: 1:N
- **TRACK** ──< **TRACK_GENRE** >── **GENRE**: N:M
- **PLAYLIST** ──< **PLAYLIST_TRACK** >── **TRACK**: N:M
- **USER** ──< **FAVORITE_TRACK** >── **TRACK**: N:M
- **USER** ──< **FAVORITE_ALBUM** >── **ALBUM**: N:M
- **USER** ──< **FAVORITE_PLAYLIST** >── **PLAYLIST**: N:M

### Шаг 7: Добавление ограничений (Constraints)

В свойствах сущностей добавьте:

- **CHECK constraints** (уже указаны в типах данных выше)
- **UNIQUE constraints** (для уникальных полей)
- **NOT NULL constraints** (для обязательных полей)
- **DEFAULT values** (значения по умолчанию)
- **ON DELETE CASCADE/SET NULL** (для внешних ключей)

### Шаг 8: Оформление диаграммы

1. **Группировка**: Создайте группы для логического разделения:
   - Пользователи и роли
   - Музыкальный контент (Артисты, Альбомы, Треки)
   - Плейлисты и избранное
   - История и аудит

2. **Цветовое кодирование**:
   - Основные сущности - синий
   - Связующие таблицы - оранжевый
   - Вспомогательные таблицы - серый

3. **Легенда**: Добавьте легенду, объясняющую:
   - Типы связей (1:1, 1:N, N:M)
   - Обозначения (PK, FK, UNIQUE)
   - Цвета

---

## Советы по работе в Visual Paradigm Online

1. **Импорт из SQL**: Visual Paradigm поддерживает импорт SQL скриптов
   - Выберите **Database** → **Reverse Engineer**
   - Вставьте SQL скрипт или подключитесь к БД

2. **Автоматическая генерация связей**: При импорте связи создаются автоматически на основе внешних ключей

3. **Экспорт**: Можете экспортировать диаграмму в PNG, PDF, SVG или другие форматы

4. **Документация**: Добавьте описания к каждой сущности через свойства (Properties → Documentation)

---

## Итоговая структура

**Основные сущности:**
- roles, users, artists, genres, albums, tracks, playlists

**Связующие таблицы:**
- track_genres, playlist_tracks, favorites_tracks, favorites_albums, favorites_playlists

**Вспомогательные таблицы:**
- listening_history, artist_applications, audit_log

**Общее количество сущностей: 15**

**Основные связи:**
- Иерархия: roles → users → artists → albums → tracks
- Связи многие-ко-многим: tracks ↔ genres, playlists ↔ tracks
- Связи избранного: users ↔ tracks/albums/playlists

---

Удачи в создании диаграмм! 🎵

