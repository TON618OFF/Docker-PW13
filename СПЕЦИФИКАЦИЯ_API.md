# Спецификация API ImperialTunes

## Версия документа: 1.0
## Дата создания: 11.10.2025
## Последнее обновление: 11.10.2025
## База данных: PostgreSQL (Supabase)
## Тип API: REST API (Supabase PostgREST)

---

## Оглавление

1. [Общая информация](#общая-информация)
2. [Аутентификация](#аутентификация)
3. [Таблицы и CRUD операции](#таблицы-и-crud-операции)
4. [RPC функции (Stored Procedures)](#rpc-функции-stored-procedures)
5. [Представления (Views)](#представления-views)
6. [Storage API](#storage-api)
7. [Коды ошибок](#коды-ошибок)
8. [Примеры запросов](#примеры-запросов)
9. [Работа с Postman](#работа-с-postman)
10. [Дополнительная информация](#дополнительная-информация)

---

## Общая информация

### Базовый URL

```
https://[project-ref].supabase.co/rest/v1/
```

Где `[project-ref]` - уникальный идентификатор проекта Supabase.

### Заголовки запросов

Все запросы к API требуют следующих заголовков:

```
apikey: [SUPABASE_ANON_KEY или SUPABASE_SERVICE_ROLE_KEY]
Authorization: Bearer [JWT_TOKEN]
Content-Type: application/json
Prefer: return=representation
```

### Аутентификация через Supabase Auth

Для получения JWT токена используйте Supabase Auth API:

**Базовый URL Auth:**
```
https://[project-ref].supabase.co/auth/v1/
```

**Методы:**
- `POST /auth/v1/token` - получение токена (login)
- `POST /auth/v1/signup` - регистрация нового пользователя
- `POST /auth/v1/logout` - выход из системы
- `GET /auth/v1/user` - получение информации о текущем пользователе

---

## Аутентификация

### Регистрация пользователя

**Endpoint:** `POST /auth/v1/signup`

**Запрос:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "data": {
    "first_name": "Иван",
    "last_name": "Иванов",
    "username": "ivan_user"
  }
}
```

**Ответ:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-02-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

### Вход в систему

**Endpoint:** `POST /auth/v1/token?grant_type=password`

**Запрос:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Ответ:**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Получение текущего пользователя

**Endpoint:** `GET /auth/v1/user`

**Заголовки:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Ответ:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "user_metadata": {
    "first_name": "Иван",
    "last_name": "Иванов"
  }
}
```

---

## Таблицы и CRUD операции

### 1. Таблица: roles (Роли)

**Endpoint:** `/rest/v1/roles`

#### GET - Получение списка ролей

**Запрос:**
```http
GET /rest/v1/roles
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "role_name": "слушатель",
    "role_description": "Обычный пользователь",
    "created_at": "2025-02-01T00:00:00Z",
    "updated_at": "2025-02-01T00:00:00Z"
  }
]
```

#### GET - Получение роли по ID

**Запрос:**
```http
GET /rest/v1/roles?id=eq.[role_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

#### POST - Создание роли (только для администраторов)

**Запрос:**
```http
POST /rest/v1/roles
Authorization: Bearer [JWT_TOKEN]
apikey: [SERVICE_ROLE_KEY]
Content-Type: application/json

{
  "role_name": "модератор",
  "role_description": "Модератор контента"
}
```

#### PATCH - Обновление роли (только для администраторов)

**Запрос:**
```http
PATCH /rest/v1/roles?id=eq.[role_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [SERVICE_ROLE_KEY]
Content-Type: application/json

{
  "role_description": "Обновленное описание"
}
```

#### DELETE - Удаление роли (только для администраторов)

**Запрос:**
```http
DELETE /rest/v1/roles?id=eq.[role_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [SERVICE_ROLE_KEY]
```

---

### 2. Таблица: users (Пользователи)

**Endpoint:** `/rest/v1/users`

#### GET - Получение информации о пользователе

**Запрос:**
```http
GET /rest/v1/users?id=eq.[user_id]&select=*,role:roles(*)
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "username": "ivan_user",
    "first_name": "Иван",
    "last_name": "Иванов",
    "role_id": "uuid",
    "avatar_url": "https://...",
    "bio": "Описание пользователя",
    "language": "ru",
    "is_active": true,
    "created_at": "2025-02-01T00:00:00Z",
    "updated_at": "2025-02-01T00:00:00Z",
    "last_login": "2025-02-01T12:00:00Z",
    "role": {
      "id": "uuid",
      "role_name": "слушатель",
      "role_description": "Обычный пользователь"
    }
  }
]
```

#### PATCH - Обновление профиля пользователя

**Запрос:**
```http
PATCH /rest/v1/users?id=eq.[user_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "first_name": "Иван",
  "last_name": "Иванов",
  "bio": "Новое описание",
  "language": "ru"
}
```

**Ограничения:**
- Пользователь может обновлять только свой профиль
- Роль может изменяться только администраторами/дистрибьюторами

---

### 3. Таблица: artists (Артисты)

**Endpoint:** `/rest/v1/artists`

#### GET - Получение списка артистов

**Запрос:**
```http
GET /rest/v1/artists?select=*&order=artist_name.asc
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Параметры запроса:**
- `select` - выбор полей (поддерживается вложенный select для связей)
- `order` - сортировка (например: `artist_name.asc`, `created_at.desc`)
- `limit` - ограничение количества результатов
- `offset` - смещение для пагинации
- `artist_name.ilike.*search*` - поиск по имени (case-insensitive)

**Ответ:**
```json
[
  {
    "id": "uuid",
    "artist_name": "Исполнитель",
    "artist_bio": "Биография артиста",
    "artist_image_url": "https://...",
    "genre": "Рок",
    "created_at": "2025-02-01T00:00:00Z",
    "updated_at": "2025-02-01T00:00:00Z"
  }
]
```

#### POST - Создание артиста (только для дистрибьюторов)

**Запрос:**
```http
POST /rest/v1/artists
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "artist_name": "Новый артист",
  "artist_bio": "Биография",
  "artist_image_url": "https://...",
  "genre": "Рок"
}
```

#### PATCH - Обновление артиста

**Запрос:**
```http
PATCH /rest/v1/artists?id=eq.[artist_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "artist_bio": "Обновленная биография"
}
```

**Ограничения:**
- Артист может обновлять только свой профиль
- Дистрибьюторы могут обновлять любые профили артистов

#### DELETE - Удаление артиста (только для дистрибьюторов)

**Запрос:**
```http
DELETE /rest/v1/artists?id=eq.[artist_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [SERVICE_ROLE_KEY]
```

---

### 4. Таблица: genres (Жанры)

**Endpoint:** `/rest/v1/genres`

#### GET - Получение списка жанров

**Запрос:**
```http
GET /rest/v1/genres?select=*&is_active=eq.true&order=genre_name.asc
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "genre_name": "Рок",
    "genre_description": "Описание жанра",
    "is_active": true,
    "created_at": "2025-02-01T00:00:00Z",
    "updated_at": "2025-02-01T00:00:00Z"
  }
]
```

#### POST - Создание жанра (только для администраторов)

**Запрос:**
```http
POST /rest/v1/genres
Authorization: Bearer [JWT_TOKEN]
apikey: [SERVICE_ROLE_KEY]
Content-Type: application/json

{
  "genre_name": "Джаз",
  "genre_description": "Описание жанра джаз",
  "is_active": true
}
```

---

### 5. Таблица: albums (Альбомы)

**Endpoint:** `/rest/v1/albums`

#### GET - Получение списка альбомов

**Запрос:**
```http
GET /rest/v1/albums?select=*,artist:artists(*),tracks:tracks(*))&is_public=eq.true&is_active=eq.true
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "album_title": "Название альбома",
    "album_release_date": "2025-01-01",
    "artist_id": "uuid",
    "album_cover_url": "https://...",
    "album_description": "Описание альбома",
    "is_public": true,
    "is_active": true,
    "created_at": "2025-02-01T00:00:00Z",
    "updated_at": "2025-02-01T00:00:00Z",
    "artist": {
      "id": "uuid",
      "artist_name": "Исполнитель",
      "artist_bio": "Биография"
    },
    "tracks": [
      {
        "id": "uuid",
        "track_title": "Трек 1",
        "track_duration": 180
      }
    ]
  }
]
```

#### POST - Создание альбома (только для артистов/дистрибьюторов)

**Запрос:**
```http
POST /rest/v1/albums
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "album_title": "Новый альбом",
  "album_release_date": "2025-02-01",
  "artist_id": "uuid",
  "album_cover_url": "https://...",
  "album_description": "Описание",
  "is_public": true,
  "is_active": true
}
```

#### PATCH - Обновление альбома

**Запрос:**
```http
PATCH /rest/v1/albums?id=eq.[album_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "album_description": "Обновленное описание"
}
```

#### DELETE - Удаление альбома (каскадное удаление треков)

**Запрос:**
```http
DELETE /rest/v1/albums?id=eq.[album_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [SERVICE_ROLE_KEY]
```

---

### 6. Таблица: tracks (Треки)

**Endpoint:** `/rest/v1/tracks`

#### GET - Получение списка треков

**Запрос:**
```http
GET /rest/v1/tracks?select=*,album:albums(album_title,artist:artists(artist_name)),genres:track_genres(genre:genres(genre_name)))&is_public=eq.true&order=track_play_count.desc
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Параметры запроса:**
- `select` - выбор полей и вложенных связей
- `order` - сортировка (например: `track_play_count.desc`, `created_at.desc`)
- `limit` - ограничение количества
- `offset` - смещение для пагинации
- `track_title.ilike.*search*` - поиск по названию
- `is_public=eq.true` - только публичные треки

**Ответ:**
```json
[
  {
    "id": "uuid",
    "track_title": "Название трека",
    "track_duration": 180,
    "album_id": "uuid",
    "track_audio_url": "https://...",
    "track_order": 1,
    "track_play_count": 100,
    "track_like_count": 50,
    "is_public": true,
    "uploaded_by": "uuid",
    "created_at": "2025-02-01T00:00:00Z",
    "updated_at": "2025-02-01T00:00:00Z",
    "album": {
      "album_title": "Название альбома",
      "artist": {
        "artist_name": "Исполнитель"
      }
    },
    "genres": [
      {
        "genre": {
          "genre_name": "Рок"
        }
      }
    ]
  }
]
```

#### POST - Создание трека (только для артистов/дистрибьюторов)

**Запрос:**
```http
POST /rest/v1/tracks
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "track_title": "Новый трек",
  "track_duration": 180,
  "album_id": "uuid",
  "track_audio_url": "https://...",
  "track_order": 1,
  "is_public": true
}
```

**Валидация:**
- `track_duration` должен быть от 1 до 7200 секунд
- `track_title` должен быть от 1 до 100 символов
- `track_order` должен быть больше 0

#### PATCH - Обновление трека

**Запрос:**
```http
PATCH /rest/v1/tracks?id=eq.[track_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "track_title": "Обновленное название",
  "is_public": true
}
```

#### DELETE - Удаление трека

**Запрос:**
```http
DELETE /rest/v1/tracks?id=eq.[track_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [SERVICE_ROLE_KEY]
```

---

### 7. Таблица: playlists (Плейлисты)

**Endpoint:** `/rest/v1/playlists`

#### GET - Получение списка плейлистов

**Запрос:**
```http
GET /rest/v1/playlists?select=*,user:users(username),tracks:playlist_tracks(track:tracks(*)))&is_public=eq.true&order=created_at.desc
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "playlist_title": "Мой плейлист",
    "playlist_description": "Описание",
    "user_id": "uuid",
    "playlist_cover_url": "https://...",
    "is_public": false,
    "is_active": true,
    "follow_count": 10,
    "created_at": "2025-02-01T00:00:00Z",
    "updated_at": "2025-02-01T00:00:00Z",
    "user": {
      "username": "ivan_user"
    },
    "tracks": [
      {
        "track": {
          "id": "uuid",
          "track_title": "Трек",
          "track_duration": 180
        }
      }
    ]
  }
]
```

#### POST - Создание плейлиста

**Запрос:**
```http
POST /rest/v1/playlists
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "playlist_title": "Новый плейлист",
  "playlist_description": "Описание",
  "playlist_cover_url": "https://...",
  "is_public": false,
  "is_active": true
}
```

**Валидация:**
- `playlist_title` должен быть от 2 до 100 символов

#### PATCH - Обновление плейлиста

**Запрос:**
```http
PATCH /rest/v1/playlists?id=eq.[playlist_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "playlist_title": "Обновленное название",
  "is_public": true
}
```

#### DELETE - Удаление плейлиста (каскадное удаление треков)

**Запрос:**
```http
DELETE /rest/v1/playlists?id=eq.[playlist_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

---

### 8. Таблица: playlist_tracks (Связь Плейлист-Трек)

**Endpoint:** `/rest/v1/playlist_tracks`

#### GET - Получение треков плейлиста

**Запрос:**
```http
GET /rest/v1/playlist_tracks?select=*,track:tracks(*)&playlist_id=eq.[playlist_id]&order=order_position.asc
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

#### POST - Добавление трека в плейлист

**Запрос:**
```http
POST /rest/v1/playlist_tracks
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "playlist_id": "uuid",
  "track_id": "uuid",
  "order_position": 1
}
```

**Валидация:**
- Трек не может быть добавлен дважды в один плейлист (UNIQUE constraint)
- `order_position` должен быть больше 0

#### DELETE - Удаление трека из плейлиста

**Запрос:**
```http
DELETE /rest/v1/playlist_tracks?playlist_id=eq.[playlist_id]&track_id=eq.[track_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

---

### 9. Таблица: listening_history (История прослушиваний)

**Endpoint:** `/rest/v1/listening_history`

#### GET - Получение истории прослушиваний

**Запрос:**
```http
GET /rest/v1/listening_history?select=*,track:tracks(track_title,album:albums(album_title,artist:artists(artist_name))))&user_id=eq.[user_id]&order=listened_at.desc&limit=100
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ограничения:**
- Пользователь может видеть только свою историю прослушиваний
- Администраторы могут видеть всю историю

#### POST - Создание записи истории прослушивания

**Запрос:**
```http
POST /rest/v1/listening_history
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "track_id": "uuid",
  "duration_played": 120,
  "completed": false
}
```

**Примечание:**
- `user_id` устанавливается автоматически из JWT токена
- `listened_at` устанавливается автоматически
- Триггер `listening_history_trigger` автоматически увеличивает `track_play_count`

---

### 10. Таблица: favorites_tracks (Избранные треки)

**Endpoint:** `/rest/v1/favorites_tracks`

#### GET - Получение избранных треков

**Запрос:**
```http
GET /rest/v1/favorites_tracks?select=*,track:tracks(*)&user_id=eq.[user_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

#### POST - Добавление трека в избранное

**Используйте RPC функцию:** `toggle_favorite_track`

---

### 11. Таблица: favorites_albums (Избранные альбомы)

**Endpoint:** `/rest/v1/favorites_albums`

#### GET - Получение избранных альбомов

**Запрос:**
```http
GET /rest/v1/favorites_albums?select=*,album:albums(*)&user_id=eq.[user_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

#### POST - Добавление альбома в избранное

**Используйте RPC функцию:** `toggle_favorite_album`

---

### 12. Таблица: favorites_playlists (Избранные плейлисты)

**Endpoint:** `/rest/v1/favorites_playlists`

#### GET - Получение избранных плейлистов

**Запрос:**
```http
GET /rest/v1/favorites_playlists?select=*,playlist:playlists(*)&user_id=eq.[user_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

#### POST - Добавление плейлиста в избранное

**Используйте RPC функцию:** `toggle_favorite_playlist`

---

### 13. Таблица: artist_applications (Анкеты артистов)

**Endpoint:** `/rest/v1/artist_applications`

#### GET - Получение анкет артистов

**Запрос:**
```http
GET /rest/v1/artist_applications?select=*,user:users(username)&status=eq.pending&order=created_at.desc
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ограничения:**
- Пользователь может видеть только свои анкеты
- Дистрибьюторы могут видеть все анкеты

#### POST - Создание анкеты артиста

**Запрос:**
```http
POST /rest/v1/artist_applications
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "artist_name": "Новый артист",
  "artist_bio": "Биография",
  "artist_image_url": "https://...",
  "genre": "Рок",
  "status": "pending"
}
```

**Примечание:**
- `user_id` устанавливается автоматически из JWT токена
- `status` по умолчанию устанавливается в "pending"

---

### 14. Таблица: audit_log (Лог аудита)

**Endpoint:** `/rest/v1/audit_log`

#### GET - Получение логов аудита

**Запрос:**
```http
GET /rest/v1/audit_log?select=*&order=created_at.desc&limit=100
Authorization: Bearer [JWT_TOKEN]
apikey: [SERVICE_ROLE_KEY]
```

**Ограничения:**
- Доступно только для администраторов
- Требуется SERVICE_ROLE_KEY

---

## RPC функции (Stored Procedures)

### 1. toggle_favorite_track

**Описание:** Добавление/удаление трека из избранного

**Endpoint:** `POST /rest/v1/rpc/toggle_favorite_track`

**Запрос:**
```json
{
  "p_track_id": "uuid"
}
```

**Ответ:**
```json
{
  "success": true,
  "action": "added"
}
```

или

```json
{
  "success": true,
  "action": "removed"
}
```

**Ошибки:**
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

---

### 2. toggle_favorite_album

**Описание:** Добавление/удаление альбома из избранного

**Endpoint:** `POST /rest/v1/rpc/toggle_favorite_album`

**Запрос:**
```json
{
  "p_album_id": "uuid"
}
```

**Ответ:**
```json
{
  "success": true,
  "action": "added"
}
```

или

```json
{
  "success": true,
  "action": "removed"
}
```

---

### 3. toggle_favorite_playlist

**Описание:** Добавление/удаление плейлиста из избранного

**Endpoint:** `POST /rest/v1/rpc/toggle_favorite_playlist`

**Запрос:**
```json
{
  "p_playlist_id": "uuid"
}
```

**Ответ:**
```json
{
  "success": true,
  "action": "added"
}
```

или

```json
{
  "success": true,
  "action": "removed"
}
```

---

### 4. approve_artist_application

**Описание:** Одобрение анкеты артиста (только для дистрибьюторов)

**Endpoint:** `POST /rest/v1/rpc/approve_artist_application`

**Запрос:**
```json
{
  "p_application_id": "uuid"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Application approved",
  "artist_id": "uuid"
}
```

**Ошибки:**
```json
{
  "success": false,
  "error": "Only distributors can approve applications"
}
```

или

```json
{
  "success": false,
  "error": "Application not found"
}
```

или

```json
{
  "success": false,
  "error": "Artist with this name already exists"
}
```

---

### 5. reject_artist_application

**Описание:** Отклонение анкеты артиста (только для дистрибьюторов)

**Endpoint:** `POST /rest/v1/rpc/reject_artist_application`

**Запрос:**
```json
{
  "p_application_id": "uuid",
  "p_comment": "Причина отклонения (опционально)"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Application rejected"
}
```

**Ошибки:**
```json
{
  "success": false,
  "error": "Only distributors can reject applications"
}
```

или

```json
{
  "success": false,
  "error": "Application not found"
}
```

---

### 6. ensure_user_exists

**Описание:** Проверка и создание профиля пользователя в таблице `public.users`

**Endpoint:** `POST /rest/v1/rpc/ensure_user_exists`

**Запрос:**
```json
{}
```

**Ответ:**
```json
{
  "success": true,
  "message": "User already exists"
}
```

или

```json
{
  "success": true,
  "message": "User created successfully",
  "username": "generated_username"
}
```

**Ошибки:**
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

---

### 7. create_user_profile

**Описание:** Явное создание профиля пользователя

**Endpoint:** `POST /rest/v1/rpc/create_user_profile`

**Запрос:**
```json
{
  "p_user_id": "uuid",
  "p_username": "username",
  "p_first_name": "Иван",
  "p_last_name": "Иванов"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "User profile created successfully",
  "username": "username"
}
```

---

## Представления (Views)

### 1. track_statistics

**Описание:** Статистика по трекам (популярность, количество прослушиваний)

**Endpoint:** `GET /rest/v1/track_statistics`

**Запрос:**
```http
GET /rest/v1/track_statistics?select=*&order=track_play_count.desc&limit=100
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "track_title": "Название трека",
    "track_duration": 180,
    "track_play_count": 1000,
    "track_like_count": 500,
    "album_title": "Название альбома",
    "artist_name": "Исполнитель",
    "created_at": "2025-02-01T00:00:00Z",
    "is_public": true,
    "popularity_level": "high"
  }
]
```

---

### 2. user_statistics

**Описание:** Статистика по пользователям

**Endpoint:** `GET /rest/v1/user_statistics`

**Запрос:**
```http
GET /rest/v1/user_statistics?select=*&order=total_listens.desc
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "username": "ivan_user",
    "email": "user@example.com",
    "role_name": "слушатель",
    "created_at": "2025-02-01T00:00:00Z",
    "last_login": "2025-02-01T12:00:00Z",
    "playlist_count": 5,
    "total_listens": 1000,
    "unique_tracks_listened": 500
  }
]
```

---

### 3. playlist_duration

**Описание:** Длительность плейлистов

**Endpoint:** `GET /rest/v1/playlist_duration`

**Запрос:**
```http
GET /rest/v1/playlist_duration?select=*&order=total_duration_seconds.desc
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "playlist_title": "Мой плейлист",
    "user_id": "uuid",
    "username": "ivan_user",
    "is_public": false,
    "follow_count": 10,
    "total_duration_seconds": 3600,
    "track_count": 20,
    "created_at": "2025-02-01T00:00:00Z",
    "updated_at": "2025-02-01T00:00:00Z"
  }
]
```

---

### 4. album_duration

**Описание:** Длительность альбомов

**Endpoint:** `GET /rest/v1/album_duration`

**Запрос:**
```http
GET /rest/v1/album_duration?select=*&order=total_duration_seconds.desc
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "album_title": "Название альбома",
    "artist_id": "uuid",
    "artist_name": "Исполнитель",
    "album_release_date": "2025-01-01",
    "total_duration_seconds": 3600,
    "track_count": 12,
    "created_at": "2025-02-01T00:00:00Z",
    "updated_at": "2025-02-01T00:00:00Z"
  }
]
```

---

## Storage API

### Базовый URL

```
https://[project-ref].supabase.co/storage/v1/
```

### Buckets

1. **songs** - Аудио файлы (mp3, wav, flac, ogg, m4a)
2. **covers** - Обложки альбомов (jpeg, png, webp)
3. **avatars** - Аватары пользователей (jpeg, png, webp)

### Загрузка файла

**Endpoint:** `POST /storage/v1/object/[bucket_name]/[file_path]`

**Запрос:**
```http
POST /storage/v1/object/songs/user_id/filename.mp3
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: audio/mpeg

[Binary file data]
```

**Ответ:**
```json
{
  "Key": "user_id/filename.mp3"
}
```

### Получение файла

**Endpoint:** `GET /storage/v1/object/[bucket_name]/[file_path]`

**Запрос:**
```http
GET /storage/v1/object/songs/user_id/filename.mp3
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
Binary file data

### Получение публичного URL

**Метод:** Используйте метод `getPublicUrl()` клиента Supabase

**Пример (TypeScript):**
```typescript
const { data } = supabase.storage
  .from('songs')
  .getPublicUrl('user_id/filename.mp3');
```

### Получение подписанного URL (для приватных файлов)

**Метод:** Используйте метод `createSignedUrl()` клиента Supabase

**Пример (TypeScript):**
```typescript
const { data, error } = await supabase.storage
  .from('songs')
  .createSignedUrl('user_id/filename.mp3', 3600); // URL действителен 1 час
```

### Удаление файла

**Endpoint:** `DELETE /storage/v1/object/[bucket_name]/[file_path]`

**Запрос:**
```http
DELETE /storage/v1/object/songs/user_id/filename.mp3
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

### Список файлов

**Endpoint:** `GET /storage/v1/object/list/[bucket_name]`

**Запрос:**
```http
GET /storage/v1/object/list/songs?prefix=user_id/&limit=100
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

**Ответ:**
```json
[
  {
    "name": "user_id/filename.mp3",
    "id": "uuid",
    "updated_at": "2025-02-01T00:00:00Z",
    "created_at": "2025-02-01T00:00:00Z",
    "last_accessed_at": "2025-02-01T00:00:00Z",
    "metadata": {
      "size": 5242880,
      "mimetype": "audio/mpeg"
    }
  }
]
```

---

## Коды ошибок

### HTTP коды статуса

- **200 OK** - Успешный запрос
- **201 Created** - Ресурс успешно создан
- **204 No Content** - Успешное удаление
- **400 Bad Request** - Неверный запрос (валидация)
- **401 Unauthorized** - Не авторизован
- **403 Forbidden** - Нет доступа (RLS политики)
- **404 Not Found** - Ресурс не найден
- **409 Conflict** - Конфликт (например, нарушение UNIQUE constraint)
- **500 Internal Server Error** - Внутренняя ошибка сервера

### Формат ошибки

```json
{
  "message": "Error message",
  "code": "ERROR_CODE",
  "details": "Detailed error information",
  "hint": "Hint for resolving the error"
}
```

### Типичные ошибки

#### 1. Ошибка аутентификации

```json
{
  "message": "JWT expired",
  "code": "PGRST301",
  "details": "JWT token has expired"
}
```

**Решение:** Обновите токен через `/auth/v1/token?grant_type=refresh_token`

#### 2. Ошибка доступа (RLS)

```json
{
  "message": "new row violates row-level security policy",
  "code": "42501",
  "details": "User does not have permission to insert into this table"
}
```

**Решение:** Проверьте RLS политики и права доступа пользователя

#### 3. Ошибка валидации

```json
{
  "message": "new row for relation \"tracks\" violates check constraint \"tracks_track_duration_check\"",
  "code": "23514",
  "details": "track_duration must be between 1 and 7200"
}
```

**Решение:** Проверьте данные перед отправкой запроса

#### 4. Ошибка внешнего ключа

```json
{
  "message": "insert or update on table \"tracks\" violates foreign key constraint \"tracks_album_id_fkey\"",
  "code": "23503",
  "details": "album_id does not exist in albums table"
}
```

**Решение:** Убедитесь, что связанная запись существует

---

## Примеры запросов

### Пример 1: Получение популярных треков

```http
GET /rest/v1/track_statistics?select=*&is_public=eq.true&order=track_play_count.desc&limit=10
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

### Пример 2: Поиск треков по названию

```http
GET /rest/v1/tracks?select=*,album:albums(album_title,artist:artists(artist_name))&track_title.ilike.*rock*&is_public=eq.true&limit=20
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

### Пример 3: Получение плейлиста с треками

```http
GET /rest/v1/playlists?select=*,user:users(username),tracks:playlist_tracks(order_position,track:tracks(track_title,track_duration,track_audio_url,album:albums(album_title,artist:artists(artist_name)))))&id=eq.[playlist_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

### Пример 4: Добавление трека в избранное

```http
POST /rest/v1/rpc/toggle_favorite_track
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "p_track_id": "uuid"
}
```

### Пример 5: Создание плейлиста с треками

**Шаг 1: Создание плейлиста**
```http
POST /rest/v1/playlists
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "playlist_title": "Мой плейлист",
  "playlist_description": "Описание",
  "is_public": false
}
```

**Шаг 2: Добавление треков**
```http
POST /rest/v1/playlist_tracks
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
Content-Type: application/json

{
  "playlist_id": "uuid",
  "track_id": "uuid",
  "order_position": 1
}
```

### Пример 6: Получение истории прослушиваний пользователя

```http
GET /rest/v1/listening_history?select=*,track:tracks(track_title,track_duration,album:albums(album_title,artist:artists(artist_name))))&user_id=eq.[user_id]&order=listened_at.desc&limit=50
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

### Пример 7: Загрузка аудио файла в Storage

```typescript
const file = event.target.files[0];
const filePath = `${user.id}/${Date.now()}.mp3`;

const { data, error } = await supabase.storage
  .from('songs')
  .upload(filePath, file, {
    contentType: 'audio/mpeg',
    upsert: false
  });

if (error) {
  console.error('Error uploading file:', error);
} else {
  // Получаем публичный URL
  const { data: urlData } = supabase.storage
    .from('songs')
    .getPublicUrl(filePath);
  
  console.log('File uploaded:', urlData.publicUrl);
}
```

### Пример 8: Получение статистики пользователя

```http
GET /rest/v1/user_statistics?select=*&id=eq.[user_id]
Authorization: Bearer [JWT_TOKEN]
apikey: [ANON_KEY]
```

---

## Работа с Postman

### Настройка Postman для работы с Supabase API

#### 1. Создание коллекции

1. Откройте Postman
2. Создайте новую коллекцию: `ImperialTunes API`
3. Добавьте переменные коллекции:
   - `base_url` - `https://[project-ref].supabase.co`
   - `anon_key` - Ваш `SUPABASE_ANON_KEY`
   - `service_role_key` - Ваш `SUPABASE_SERVICE_ROLE_KEY` (только для административных операций)
   - `jwt_token` - JWT токен (будет заполнен после аутентификации)

#### 2. Настройка переменных окружения

В Postman можно создать Environment с переменными:

**Variables:**
- `supabase_url`: `https://[project-ref].supabase.co`
- `supabase_anon_key`: `[ваш ANON KEY]`
- `supabase_service_role_key`: `[ваш SERVICE ROLE KEY]`
- `access_token`: (будет заполнен автоматически)
- `refresh_token`: (будет заполнен автоматически)

#### 3. Настройка общих заголовков

**ВАЖНО:** В новых версиях Postman используйте вкладку **Scripts** → **Pre-req** (Pre-request Script) для коллекции.

Создайте Pre-request Script для коллекции:

```javascript
// Автоматически добавляем заголовки ко всем запросам коллекции
// ВАЖНО: В Pre-request Script НЕТ pm.response, только pm.request!

// Удаляем старые заголовки (если есть), чтобы избежать дублирования
pm.request.headers.remove('apikey');
pm.request.headers.remove('Authorization');
pm.request.headers.remove('Content-Type');
pm.request.headers.remove('Prefer');

// Добавляем apikey
pm.request.headers.add({
    key: 'apikey',
    value: pm.environment.get('supabase_anon_key')
});

// Добавляем Authorization заголовок, если есть токен
const accessToken = pm.environment.get('access_token');
if (accessToken) {
    pm.request.headers.add({
        key: 'Authorization',
        value: 'Bearer ' + accessToken
    });
} else {
    // Предупреждение только для REST API запросов (не для auth)
    if (pm.request.url.toString().includes('/rest/v1/')) {
        console.warn('⚠️ Access token not found. Please authenticate first.');
    }
}

// Добавляем стандартные заголовки
pm.request.headers.add({
    key: 'Content-Type',
    value: 'application/json'
});

pm.request.headers.add({
    key: 'Prefer',
    value: 'return=representation'
});
```

---

### Получение JWT токена

#### Метод 1: Вход через Supabase Auth API

**Шаг 1: Создайте запрос для входа**

**Request:**
- **Method:** `POST`
- **URL:** `{{supabase_url}}/auth/v1/token?grant_type=password`
- **Headers:**
  ```
  apikey: {{supabase_anon_key}}
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "your_password"
  }
  ```

**Шаг 2: Сохранение токена автоматически**

**ВАЖНО:** В новых версиях Postman используйте вкладку **Scripts** → **Post-res** (Post-response Script), а не Tests.

Добавьте **Post-response Script** к запросу входа:

```javascript
// Парсим ответ
const response = pm.response.json();

// Сохраняем токены в переменные окружения
if (response.access_token) {
    pm.environment.set('access_token', response.access_token);
    console.log('✅ Access token saved:', response.access_token.substring(0, 20) + '...');
}

if (response.refresh_token) {
    pm.environment.set('refresh_token', response.refresh_token);
    console.log('✅ Refresh token saved');
}

// Сохраняем информацию о пользователе
if (response.user) {
    pm.environment.set('user_id', response.user.id);
    pm.environment.set('user_email', response.user.email);
    console.log('✅ User ID saved:', response.user.id);
}

// Проверяем успешность
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Access token received", function () {
    pm.expect(response.access_token).to.exist;
});

pm.test("User information received", function () {
    pm.expect(response.user).to.exist;
});
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6InFhSHVvT2loUm8xUHhFOUwiLCJ0eXAiOiJKV1QifQ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1762811948,
  "refresh_token": "m7dd5mlbszsd",
  "user": {
    "id": "4fc7f570-82b1-4fcc-bed2-5089f58fb8d6",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "user@example.com",
    "email_confirmed_at": "2025-10-29T13:13:45.483629Z",
    "user_metadata": {
      "email": "user@example.com",
      "email_verified": true,
      "first_name": "Имя",
      "last_name": "Фамилия",
      "username": "USERNAME"
    },
    "created_at": "2025-10-29T13:13:34.602365Z",
    "updated_at": "2025-11-10T20:59:08.757683Z",
    "is_anonymous": false
  },
  "weak_password": null
}
```

**Примечание:** Если токен уже получен, но не сохранен автоматически, вы можете:
1. Скопировать `access_token` из ответа
2. Открыть Environment (⚙️)
3. Вставить токен в переменную `access_token`
4. Сохранить

#### Метод 2: Регистрация нового пользователя

**Request:**
- **Method:** `POST`
- **URL:** `{{supabase_url}}/auth/v1/signup`
- **Headers:**
  ```
  apikey: {{supabase_anon_key}}
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "newuser@example.com",
    "password": "secure_password",
    "data": {
      "first_name": "Иван",
      "last_name": "Иванов",
      "username": "ivan_user"
    }
  }
  ```

**Post-response Script (Post-res) - аналогичный методу 1:**
```javascript
const response = pm.response.json();

// Supabase может вернуть токен в разных форматах
if (response.access_token) {
    pm.environment.set('access_token', response.access_token);
    pm.environment.set('refresh_token', response.refresh_token);
    console.log('✅ Tokens saved from signup');
} else if (response.session && response.session.access_token) {
    pm.environment.set('access_token', response.session.access_token);
    pm.environment.set('refresh_token', response.session.refresh_token);
    console.log('✅ Tokens saved from session');
}

if (response.user) {
    pm.environment.set('user_id', response.user.id);
    pm.environment.set('user_email', response.user.email);
}
```

#### Метод 3: Обновление токена (Refresh Token)

Если токен истек, используйте refresh token:

**Request:**
- **Method:** `POST`
- **URL:** `{{supabase_url}}/auth/v1/token?grant_type=refresh_token`
- **Headers:**
  ```
  apikey: {{supabase_anon_key}}
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "refresh_token": "{{refresh_token}}"
  }
  ```

**Post-response Script (Post-res):**
```javascript
const response = pm.response.json();

if (response.access_token) {
    pm.environment.set('access_token', response.access_token);
    console.log('✅ Token refreshed successfully');
}

if (response.refresh_token) {
    pm.environment.set('refresh_token', response.refresh_token);
}
```

---

### Примеры запросов в Postman

#### Пример 1: Получение списка треков

**Request:**
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/tracks?select=*,album:albums(album_title,artist:artists(artist_name))&is_public=eq.true&order=track_play_count.desc&limit=10`
- **Headers:** (добавляются автоматически через Pre-request Script)

**Post-response Script (Post-res) для проверки ответа:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});

const tracks = pm.response.json();
if (tracks.length > 0) {
    console.log('✅ Found', tracks.length, 'tracks');
    pm.environment.set('track_id', tracks[0].id);
    pm.test("Tracks have required fields", function () {
        pm.expect(tracks[0]).to.have.property('id');
        pm.expect(tracks[0]).to.have.property('track_title');
    });
} else {
    console.warn('⚠️ No tracks found. Check RLS policies or data availability.');
}
```

#### Пример 2: Создание плейлиста

**Request:**
- **Method:** `POST`
- **URL:** `{{supabase_url}}/rest/v1/playlists`
- **Headers:** (добавляются автоматически)
- **Body (raw JSON):**
  ```json
  {
    "playlist_title": "Мой тестовый плейлист",
    "playlist_description": "Описание плейлиста",
    "is_public": false
  }
  ```

**Post-response Script (Post-res):**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

const response = pm.response.json();
if (response.length > 0 && response[0].id) {
    pm.environment.set('playlist_id', response[0].id);
    console.log('✅ Playlist created with ID:', response[0].id);
} else {
    console.error('❌ Failed to create playlist');
}
```

#### Пример 3: Вызов RPC функции

**Request:**
- **Method:** `POST`
- **URL:** `{{supabase_url}}/rest/v1/rpc/toggle_favorite_track`
- **Headers:** (добавляются автоматически)
- **Body (raw JSON):**
  ```json
  {
    "p_track_id": "{{track_id}}"
  }
  ```

**Post-response Script (Post-res):**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

const response = pm.response.json();
pm.test("Response has success field", function () {
    pm.expect(response).to.have.property('success');
});

if (response.success) {
    console.log('✅ Action:', response.action);
} else {
    console.error('❌ Action failed:', response.message || 'Unknown error');
}
```

---

### Диагностика проблем

#### Проблема: Пустой массив `[]` в ответе

Если получаете пустой массив при запросах к данным:

1. **Проверьте RLS политики:**
   - Альбомы: видны только если `is_public = TRUE` ИЛИ `is_active = TRUE`
   - Треки: видны только если `is_public = TRUE` ИЛИ `uploaded_by = ваш user_id`
   - Плейлисты: видны только если `is_public = TRUE` ИЛИ `user_id = ваш user_id`

2. **Проверьте наличие данных:**
   - Используйте упрощенные запросы без фильтров:
     - `{{supabase_url}}/rest/v1/albums?select=id,album_title,is_public,is_active&limit=100`
     - `{{supabase_url}}/rest/v1/tracks?select=id,track_title,is_public&limit=100`
   - Проверьте заголовок `Content-Range` в ответе (добавьте `Prefer: count=exact`)

3. **Проверьте токен:**
   - Убедитесь, что `access_token` сохранен в Environment
   - Проверьте, что токен не истек (срок действия 3600 секунд = 1 час)
   - Если истек, выполните запрос на получение токена снова

4. **Проверьте информацию о пользователе:**
   - `GET {{supabase_url}}/auth/v1/user` с заголовком `Authorization: Bearer {{access_token}}`
   - `GET {{supabase_url}}/rest/v1/users?select=*,role:roles(*)&id=eq.{{user_id}}`

#### Проблема: Ошибка 401 Unauthorized

- Проверьте, что токен сохранен в Environment
- Проверьте, что заголовок `Authorization` добавляется автоматически
- Обновите токен, если он истек

#### Проблема: Ошибка 405 Method Not Allowed

- Убедитесь, что используете правильный HTTP метод:
  - `POST` для получения токена (`/auth/v1/token`)
  - `GET` для чтения данных
  - `POST` для создания данных
  - `PATCH` для обновления данных
  - `DELETE` для удаления данных

---

### Экспорт коллекции Postman

После настройки всех запросов:

1. **Экспорт коллекции:**
   - Кликните на коллекцию → `...` → `Export`
   - Выберите формат `Collection v2.1`
   - Сохраните файл `ImperialTunes_API.postman_collection.json`

2. **Экспорт окружения:**
   - Кликните на Environment → `...` → `Export`
   - Сохраните файл `ImperialTunes_Environment.postman_environment.json`

3. **Импорт в другой Postman:**
   - `File` → `Import`
   - Выберите экспортированные файлы
   - Настройте переменные окружения с вашими ключами

---

### Важные замечания для новых версий Postman

В новых версиях Postman интерфейс изменился:

- **Вкладка "Tests"** → теперь **"Scripts"** → **"Post-res"** (Post-response Script)
- **Pre-request Script** → теперь **"Scripts"** → **"Pre-req"** (Pre-request Script)

Все скрипты, которые ранее были в "Tests", теперь находятся в разделе "Post-res" внутри вкладки "Scripts".

**Важно:**
- В **Pre-request Script** (Pre-req) доступен только `pm.request` (запрос еще не выполнен)
- В **Post-response Script** (Post-res) доступен `pm.response` (запрос уже выполнен)
- Не используйте `pm.response` в Pre-request Script — это вызовет ошибку `Cannot read properties of undefined (reading 'json')`!

**Как найти скрипты в новой версии:**
1. Откройте запрос или коллекцию
2. Перейдите на вкладку **Scripts**
3. В левой панели выберите:
   - **Pre-req** для скриптов, выполняющихся ДО запроса
   - **Post-res** для скриптов, выполняющихся ПОСЛЕ запроса

---

### Полезные советы для работы с Postman

#### 1. Использование переменных

Вместо жестко заданных значений используйте переменные:
- `{{supabase_url}}/rest/v1/tracks?id=eq.{{track_id}}`
- `{{supabase_url}}/rest/v1/users?id=eq.{{user_id}}`

#### 2. Создание папок в коллекции

Организуйте запросы по категориям:
- `Auth` - аутентификация
- `Tracks` - работа с треками
- `Playlists` - работа с плейлистами
- `Users` - работа с пользователями
- `RPC` - вызовы RPC функций

#### 3. Использование примеров ответов

Сохраняйте примеры ответов для документации:
- Кликните на запрос → `Examples` → `Add Example`
- Сохраните успешные и ошибочные ответы

#### 4. Автоматические тесты

Добавляйте тесты к каждому запросу для проверки:
- Статус кода
- Структуры ответа
- Наличия обязательных полей
- Типов данных

#### 5. Мониторинг запросов

Используйте **Console** в Postman для отладки:
- `View` → `Show Postman Console`
- Просматривайте все запросы и ответы в реальном времени

---

### Пример полной настройки Postman

**Структура коллекции:**

```
ImperialTunes API
├── Auth
│   ├── Sign Up
│   ├── Sign In
│   ├── Refresh Token
│   └── Get Current User
├── Tracks
│   ├── Get All Tracks
│   ├── Get Track by ID
│   ├── Create Track
│   ├── Update Track
│   └── Delete Track
├── Playlists
│   ├── Get All Playlists
│   ├── Create Playlist
│   ├── Add Track to Playlist
│   └── Remove Track from Playlist
├── RPC Functions
│   ├── Toggle Favorite Track
│   ├── Toggle Favorite Album
│   └── Approve Artist Application
└── Storage
    ├── Upload File
    ├── Get File
    └── Delete File
```

**Переменные окружения (Environment):**

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `supabase_url` | `https://xxx.supabase.co` | `https://xxx.supabase.co` |
| `supabase_anon_key` | `your_anon_key` | `your_anon_key` |
| `access_token` | | `(auto-filled)` |
| `refresh_token` | | `(auto-filled)` |
| `user_id` | | `(auto-filled)` |

---

## Дополнительная информация

### Пагинация

Используйте параметры `limit` и `offset` для пагинации:

```http
GET /rest/v1/tracks?limit=20&offset=0
GET /rest/v1/tracks?limit=20&offset=20
GET /rest/v1/tracks?limit=20&offset=40
```

### Сортировка

Используйте параметр `order` для сортировки:

```http
GET /rest/v1/tracks?order=track_play_count.desc
GET /rest/v1/tracks?order=created_at.desc,track_title.asc
```

### Фильтрация

Используйте операторы PostgREST для фильтрации:

- `eq` - равно
- `neq` - не равно
- `gt` - больше
- `gte` - больше или равно
- `lt` - меньше
- `lte` - меньше или равно
- `like` - LIKE (case-sensitive)
- `ilike` - ILIKE (case-insensitive)
- `in` - в списке
- `is` - IS NULL / IS NOT NULL

**Примеры:**
```http
GET /rest/v1/tracks?is_public=eq.true
GET /rest/v1/tracks?track_play_count=gt.100
GET /rest/v1/tracks?track_title.ilike.*rock*
GET /rest/v1/tracks?album_id=in.(uuid1,uuid2,uuid3)
```

### Выбор полей

Используйте параметр `select` для выбора полей:

```http
GET /rest/v1/tracks?select=id,track_title,track_duration
GET /rest/v1/tracks?select=*,album:albums(*),artist:artists(*)
```

### Вложенные запросы

Поддерживаются вложенные запросы через связи:

```http
GET /rest/v1/tracks?select=*,album:albums(album_title,artist:artists(artist_name,artist_bio))
```

---

## Безопасность

### Row Level Security (RLS)

Все таблицы защищены политиками RLS:
- Пользователи могут видеть только свои данные
- Публичные данные доступны всем авторизованным пользователям
- Администраторы и дистрибьюторы имеют расширенные права доступа

### Аутентификация

- Все запросы требуют JWT токен
- Токены имеют срок действия (обычно 1 час)
- Токены можно обновить через refresh token

### Валидация данных

- Все данные валидируются на уровне БД (CHECK constraints)
- Внешние ключи обеспечивают целостность данных
- Триггеры автоматически обновляют связанные данные

---

## Лимиты и ограничения

### Лимиты запросов

- Максимальный размер запроса: 1 MB
- Максимальное количество записей в одном запросе: 1000 (по умолчанию)
- Таймаут запроса: 30 секунд

### Лимиты Storage

- Максимальный размер файла: 50 MB для аудио, 5 MB для изображений
- Максимальное количество файлов в bucket: без ограничений
- Поддерживаемые форматы: mp3, wav, flac, ogg, m4a (аудио); jpeg, png, webp (изображения)

---

## Версионирование API

Текущая версия API: **v1**

Базовый URL включает версию:
```
https://[project-ref].supabase.co/rest/v1/
```

---

