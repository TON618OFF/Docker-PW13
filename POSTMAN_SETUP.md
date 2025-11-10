# Пошаговая инструкция по настройке Postman для ImperialTunes API

## Быстрый старт (если токен уже получен)

Если вы уже получили токен и хотите сразу начать делать запросы:

1. **Сохраните токен в Environment:**
   - Откройте Environment (⚙️) → `ImperialTunes`
   - Вставьте `access_token` из ответа в переменную `access_token`
   - Вставьте `user.id` в переменную `user_id`
   - Сохраните

2. **Создайте коллекцию** (если еще не создана):
   - New → Collection → `ImperialTunes API`
   - Добавьте Pre-request Script (см. Шаг 3.2)

3. **Создайте запросы** внутри коллекции (см. Шаг 4)

4. **Выполните запросы** — токен будет добавляться автоматически!

---

## Шаг 1: Создание Environment

1. В Postman нажмите на иконку шестеренки (⚙️) в правом верхнем углу → **Manage Environments**
2. Нажмите **Add**
3. Название: `ImperialTunes`
4. Добавьте переменные:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `supabase_url` | `https://xfemnksyqjnbecksxpcw.supabase.co` | `https://xfemnksyqjnbecksxpcw.supabase.co` |
| `supabase_anon_key` | `[ваш ANON KEY]` | `[ваш ANON KEY]` |
| `access_token` | (оставьте пустым) | (заполнится автоматически) |
| `refresh_token` | (оставьте пустым) | (заполнится автоматически) |
| `user_id` | (оставьте пустым) | (заполнится автоматически) |

5. Нажмите **Save**
6. Выберите созданное окружение в выпадающем списке справа вверху

---

## Шаг 2: Настройка запроса на получение токена

### 2.1. Обновите URL запроса

Измените URL на:
```
{{supabase_url}}/auth/v1/token?grant_type=password
```

### 2.2. Настройте Headers

В разделе **Headers** добавьте:
- `apikey`: `{{supabase_anon_key}}`
- `Content-Type`: `application/json`

### 2.3. Настройте Body

В разделе **Body** выберите **raw** и **JSON**, затем введите:
```json
{
  "email": "ton618off@yandex.ru",
  "password": "Tonton123!"
}
```

### 2.4. Добавьте Post-response Script для автоматического сохранения токена

**ВАЖНО:** Скрипт для сохранения токена должен быть в разделе **Post-res** (Post-response Script) внутри вкладки **Scripts** (выполняется ПОСЛЕ запроса), а НЕ в Pre-req!

1. Перейдите на вкладку **Scripts** (под URL)
2. В левой панели выберите **Post-res** (Post-response Script)
3. Добавьте следующий код:

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
    console.log('✅ User email saved:', response.user.email);
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

**Примечание:** Если токен уже получен, но не сохранен автоматически, вы можете:
1. Скопировать `access_token` из ответа
2. Открыть Environment (⚙️)
3. Вставить токен в переменную `access_token`
4. Сохранить

### 2.5. Выполните запрос

1. Нажмите **Send**
2. Проверьте, что статус ответа **200 OK**
3. В консоли Postman (View → Show Postman Console) должны появиться сообщения о сохранении токена
4. Проверьте Environment: токены должны быть сохранены автоматически

**Примечание:** Если в вашей версии Postman есть вкладка "Tests" (старая версия), используйте её вместо "Post-res". В новых версиях Postman "Tests" объединены с "Scripts" → "Post-res".

---

## Шаг 3: Создание запросов для получения данных

### 3.1. Создайте коллекцию

1. Нажмите **New** → **Collection**
2. Название: `ImperialTunes API`
3. Нажмите **Create**

### 3.2. Настройте Pre-request Script для коллекции

**ВАЖНО:** Pre-request Script выполняется ДО запроса, поэтому здесь нельзя использовать `pm.response`!

1. Откройте коллекцию → вкладка **Scripts** (или **Pre-request Script** в старых версиях)
2. В левой панели выберите **Pre-req** (Pre-request Script)
3. Добавьте следующий код для автоматического добавления заголовков:

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

## Шаг 4: Примеры запросов

### 4.1. Получение списка треков

**Создайте новый запрос:**
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/tracks?select=*,album:albums(album_title,artist:artists(artist_name))&is_public=eq.true&order=track_play_count.desc&limit=10`
- **Headers:** (добавляются автоматически через Pre-request Script)

**Post-response Script (Post-res):**
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
    // Сохраняем первый track_id для дальнейших запросов
    pm.environment.set('track_id', tracks[0].id);
}
```

---

### 4.2. Получение списка альбомов

**Создайте новый запрос:**
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/albums?select=*,artist:artists(artist_name),tracks:tracks(track_title,track_duration)&order=created_at.desc&limit=10`

**Примечание:** RLS политика позволяет видеть альбомы, где `is_public = TRUE` ИЛИ `is_active = TRUE`. Если получаете пустой массив, попробуйте запросы ниже для проверки данных.

**Post-response Script (Post-res):**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

const albums = pm.response.json();
if (albums.length > 0) {
    console.log('✅ Found', albums.length, 'albums');
    pm.environment.set('album_id', albums[0].id);
}
```

---

### 4.3. Получение списка артистов

**Создайте новый запрос:**
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/artists?select=*&order=artist_name.asc&limit=20`

**Post-response Script (Post-res):**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

const artists = pm.response.json();
if (artists.length > 0) {
    console.log('✅ Found', artists.length, 'artists');
    pm.environment.set('artist_id', artists[0].id);
}
```

---

### 4.4. Получение списка жанров

**Создайте новый запрос:**
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/genres?select=*&is_active=eq.true&order=genre_name.asc`

---

### 4.5. Получение плейлистов

**Создайте новый запрос:**
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/playlists?select=*,user:users(username),tracks:playlist_tracks(track:tracks(*))&is_public=eq.true&order=created_at.desc&limit=10`

---

### 4.6. Получение истории прослушиваний

**Создайте новый запрос:**
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/listening_history?select=*,track:tracks(track_title,track_duration,album:albums(album_title,artist:artists(artist_name)))&user_id=eq.{{user_id}}&order=listened_at.desc&limit=50`

---

### 4.7. Диагностика: Проверка наличия данных

Если получаете пустые массивы, используйте эти запросы для диагностики:

#### Проверка всех альбомов (без фильтров):
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/albums?select=id,album_title,is_public,is_active&limit=100`

#### Проверка всех треков (без фильтров):
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/tracks?select=id,track_title,is_public&limit=100`

#### Проверка всех артистов:
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/artists?select=id,artist_name&limit=100`

#### Проверка количества записей (используя count):
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/albums?select=*&limit=1`
- **Headers:** Добавьте `Prefer: count=exact` (или используйте `count=exact` в параметрах)

**Проверка в консоли Postman:**
В ответе будет заголовок `Content-Range`, например: `Content-Range: 0-0/0` (0 записей) или `Content-Range: 0-9/25` (25 записей, показано 10)

#### Проверка информации о текущем пользователе:
- **Method:** `GET`
- **URL:** `{{supabase_url}}/auth/v1/user`
- **Headers:** `Authorization: Bearer {{access_token}}`

#### Проверка роли пользователя:
- **Method:** `GET`
- **URL:** `{{supabase_url}}/rest/v1/users?select=*,role:roles(*)&id=eq.{{user_id}}`

---

### Решение проблемы пустых массивов

**Если получаете `[]` для всех запросов:**

1. **Проверьте токен:**
   - Убедитесь, что `access_token` сохранен в Environment
   - Проверьте, что токен не истек (срок действия 3600 секунд = 1 час)
   - Если истек, выполните запрос на получение токена снова

2. **Проверьте RLS политики:**
   - Альбомы: видны только если `is_public = TRUE` ИЛИ `is_active = TRUE`
   - Треки: видны только если `is_public = TRUE` ИЛИ `uploaded_by = ваш user_id`
   - Плейлисты: видны только если `is_public = TRUE` ИЛИ `user_id = ваш user_id`

3. **Проверьте наличие данных:**
   - Используйте запросы из раздела 4.7 для диагностики
   - Проверьте заголовок `Content-Range` в ответе

4. **Если данных нет в базе:**
   - Добавьте тестовые данные через веб-интерфейс приложения
   - Или используйте SQL запросы для добавления данных напрямую в Supabase

---

## Шаг 5: Проверка работы

1. **Выполните запрос на получение токена** (Шаг 2)
   - Убедитесь, что токен сохранен в Environment
   - Проверьте консоль Postman на наличие сообщений об успешном сохранении

2. **Выполните любой запрос из Шага 4**
   - Убедитесь, что заголовки добавляются автоматически
   - Проверьте, что ответ содержит данные

3. **Проверьте Environment**
   - Откройте Environment → убедитесь, что `access_token` заполнен
   - Проверьте, что `user_id` сохранен

---

## Полезные советы

### Просмотр сохраненного токена

1. Откройте Environment (иконка шестеренки)
2. Найдите переменную `access_token`
3. Токен должен быть виден в поле **Current Value**

### Если токен истек

Создайте запрос для обновления токена:
- **Method:** `POST`
- **URL:** `{{supabase_url}}/auth/v1/token?grant_type=refresh_token`
- **Body:**
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
    console.log('✅ Token refreshed');
}
```

### Отладка запросов

1. Откройте **Console** в Postman: `View` → `Show Postman Console`
2. Все запросы и ответы будут видны в реальном времени
3. Проверяйте заголовки запросов - там должен быть `Authorization: Bearer [token]`

---

## Структура коллекции (рекомендуемая)

```
ImperialTunes API
├── Auth
│   └── Sign In (ваш текущий запрос)
├── Tracks
│   ├── Get All Tracks
│   └── Get Track by ID
├── Albums
│   ├── Get All Albums
│   └── Get Album by ID
├── Artists
│   └── Get All Artists
├── Genres
│   └── Get All Genres
├── Playlists
│   └── Get All Playlists
└── Listening History
    └── Get My History
```

---

## Частые проблемы и решения

### Проблема: "JWT expired" или "Invalid JWT"

**Решение:** Выполните запрос на обновление токена (см. выше)

### Проблема: "new row violates row-level security policy"

**Решение:** Убедитесь, что используете правильный токен и что пользователь имеет права доступа

### Проблема: Токен не сохраняется автоматически

**Решение:** 
1. Проверьте, что Environment выбран в выпадающем списке
2. Проверьте, что Post-response Script (Post-res) добавлен к запросу
3. Проверьте консоль Postman на наличие ошибок

### Проблема: Заголовки не добавляются автоматически

**Решение:**
1. Убедитесь, что Pre-request Script добавлен к коллекции (не к отдельному запросу)
2. Проверьте, что запрос находится внутри коллекции
3. Проверьте консоль Postman на наличие ошибок в скрипте

