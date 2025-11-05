# 🚀 Supabase CLI - Быстрый доступ к облачной БД

## 📦 Установка

### ⚠️ Важно для Windows
**Supabase CLI НЕ поддерживает установку через `npm install -g`!** Используйте один из методов ниже.

### Windows (рекомендуется: через Scoop)

**1. Установите Scoop (если ещё не установлен):**
```powershell
# В PowerShell от администратора
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

**2. Установите Supabase CLI:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Windows (альтернатива: прямая загрузка)

**1. Скачайте последнюю версию:**
- Перейдите на [GitHub Releases](https://github.com/supabase/cli/releases)
- Скачайте `supabase_X.X.X_windows_amd64.zip`

**2. Распакуйте и добавьте в PATH:**
```powershell
# Распакуйте в папку, например: C:\Tools\supabase\
# Добавьте в PATH через системные переменные окружения
# Или временно для текущей сессии:
$env:PATH += ";C:\Tools\supabase"
```

### Windows (через Chocolatey)
```powershell
choco install supabase
```

### Linux/Mac
```bash
# Через Homebrew (Mac/Linux)
brew install supabase/tap/supabase

# Или через npm (только для локальной разработки, не глобально)
npm install supabase --save-dev
```

### Проверка установки
```bash
supabase --version
```

**Если команда не найдена после установки:**
1. Перезапустите PowerShell (Scoop автоматически добавляет shims в PATH)
2. Или добавьте путь вручную для текущей сессии:
```powershell
$env:PATH += ";C:\Users\TON618OFF\scoop\shims"
supabase --version
```
3. Или используйте полный путь:
```powershell
C:\Users\TON618OFF\scoop\shims\supabase.exe --version
```

---

## ⚠️ Важно: Локальная vs Облачная разработка

**Supabase CLI поддерживает два режима работы:**

### 🏠 Локальная разработка
- Использует Docker контейнеры
- Команды: `supabase start`, `supabase status`, `supabase stop`
- Для разработки и тестирования на локальной машине
- Требует установленного Docker

### ☁️ Облачная разработка (ваш случай)
- Работает с проектом в Supabase Cloud
- Команды: `supabase link`, `supabase db pull`, `supabase db dump`, `supabase db push`
- Для работы с продакшн или staging проектом
- **НЕ требует Docker**

**Важно:** Команда `supabase status` работает только для локальной разработки. Для проверки подключения к облачному проекту используйте:
```bash
# Проверить список связанных проектов
supabase projects list

# Попробовать выполнить команду (например, дамп схемы)
supabase db dump --linked --dry-run

# Если возникает ошибка аутентификации, попробуйте с --debug
supabase db dump --linked --debug --dry-run
```

**Решение проблем с аутентификацией:**
Если при выполнении команд появляется ошибка `Authentication error, reason: "Unsupported or invalid secret format"`, попробуйте:
1. Использовать флаг `--debug` в командах
2. Пересвязать проект с флагом `--skip-pooler`: `supabase link --project-ref ваш-ref --skip-pooler`
3. Использовать прямой connection string с `--db-url` вместо `--linked`

---

## 🔐 Быстрый старт: подключение к облачной БД

### 1. Авторизация
```bash
supabase login
```
Откроется браузер для авторизации через GitHub.

### 2. Связывание проекта с облачным проектом
```bash
# Находясь в корне проекта
supabase link --project-ref ваш-project-ref
```

**Где найти project-ref:**
- В Supabase Dashboard → Settings → General → Reference ID
- Или из URL: `https://xxxxx.supabase.co` → `xxxxx` это project-ref

### 3. Получение прямого доступа к БД (connection string)

Connection string можно получить несколькими способами:

**Вариант 1: Из Supabase Dashboard**
1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Settings** → **Database**
4. Найдите **Connection string** (URI или параметры подключения)

**Вариант 2: Из переменных окружения**
Если у вас есть `.env` файл с `SUPABASE_DB_URL`:
```bash
# Windows PowerShell
$env:SUPABASE_DB_URL
```

**Вариант 3: Использование в командах CLI**
После `supabase link` CLI автоматически использует connection string из связанного проекта:
```bash
# Все команды с --linked используют connection string автоматически
supabase db pull --linked
supabase db dump --linked
```

**Формат connection string:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

## 💻 Основные возможности CLI

### 📊 Работа с базой данных

#### Получение схемы из облачной БД
```bash
# Скачать схему из связанного проекта в локальные миграции
supabase db pull

# Скачать схему с указанием connection string
supabase db pull --db-url "postgresql://postgres:password@host:5432/postgres"

# Скачать только схему конкретной схемы
supabase db pull --schema public
```

#### Создание дампа базы данных
```bash
# Полный дамп связанного проекта (схема + данные)
supabase db dump --linked -f backup.sql

# Только данные (без схемы)
supabase db dump --linked --data-only -f data_backup.sql

# Только схема (без данных) - используйте без флага --data-only
supabase db dump --linked -f schema_backup.sql

# ⚠️ Если возникает ошибка аутентификации с pooler, используйте --debug
supabase db dump --linked --debug -f backup.sql

# Дамп конкретной схемы
supabase db dump --linked -s public -f public_schema.sql

# Дамп с указанием connection string напрямую (используйте прямой connection, не pooler)
supabase db dump --db-url "postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres" -f backup.sql

# Исключить таблицы из дампа
supabase db dump --linked --data-only -x public.sessions,public.audit_logs -f data_backup.sql

# Использовать прямую ссылку вместо pooler (может потребоваться пароль)
supabase link --project-ref ваш-project-ref --skip-pooler
supabase db dump --linked -f backup.sql
```

#### Применение миграций к облачной БД
```bash
# Применить все миграции из папки supabase/migrations/ к связанному проекту
supabase db push

# Применить миграции с указанием connection string
supabase db push --db-url "postgresql://postgres:password@host:5432/postgres"
```

#### Сравнение схем (diff)
```bash
# Сравнить локальную схему с облачной БД
supabase db diff

# Создать миграцию на основе различий
supabase db diff --use-migra -f migration_name
```

#### Выполнение SQL запросов через psql
Для выполнения SQL запросов напрямую используйте `psql` с connection string:
```bash
# Windows (если установлен PostgreSQL)
psql "postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres" -c "SELECT * FROM users LIMIT 5;"

# Или интерактивный режим
psql "postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres"
```

#### Сброс локальной БД
```bash
# Сбросить локальную БД и применить все миграции заново
supabase db reset
```

---

### 🔄 Синхронизация локальной и облачной БД

#### Получить схему из облака
```bash
# Скачать текущую схему из облака
supabase db pull

# Создать миграцию на основе изменений в облаке
supabase db diff --use-migra
```

#### Отправить локальные изменения в облако
```bash
# Применить все локальные миграции к облачной БД
supabase db push
```

#### Сравнить локальную и облачную схемы
```bash
# Показать различия
supabase db diff

# Создать миграцию на основе различий
supabase db diff --use-migra -f migration_name
```

---

### 📁 Работа с миграциями

#### Создание новой миграции
```bash
# Создать пустую миграцию
supabase migration new migration_name

# Создать миграцию на основе изменений
supabase db diff --use-migra -f migration_name
```

#### Просмотр истории миграций
```bash
# Показать все миграции
supabase migration list

# Показать статус миграций в облаке
supabase migration list --db-url "postgresql://..."
```

#### Применение миграций
```bash
# Применить все неприменённые миграции
supabase db push

# Применить конкретную миграцию (к локальной БД)
supabase migration up
```

---

### 🗄️ Storage (файлы)

**Формат путей:** Используйте `ss:///bucket/path` для указания путей в Storage.

#### Просмотр файлов
```bash
# Список всех buckets (показать корень)
supabase storage ls

# Список файлов в bucket
supabase storage ls ss:///songs

# Рекурсивный список всех файлов
supabase storage ls ss:///songs -r
```

#### Копирование файлов (загрузка/скачивание)
```bash
# Загрузить файл в bucket
supabase storage cp ./local-file.mp3 ss:///songs/file.mp3

# Загрузить всю папку
supabase storage cp -r ./local-folder/ ss:///songs/folder/

# Скачать файл из bucket
supabase storage cp ss:///songs/file.mp3 ./local-path/

# Скачать весь bucket
supabase storage cp -r ss:///songs ./local-backup/

# Параллельная загрузка (ускоряет процесс)
supabase storage cp -r ./large-folder/ ss:///songs/ -j 5
```

#### Перемещение файлов
```bash
# Переместить файл
supabase storage mv ss:///songs/old-name.mp3 ss:///songs/new-name.mp3

# Переместить папку
supabase storage mv ss:///songs/old-folder/ ss:///songs/new-folder/ -r
```

#### Удаление файлов
```bash
# Удалить файл
supabase storage rm ss:///songs/file.mp3

# Удалить папку рекурсивно
supabase storage rm ss:///songs/folder/ -r
```

---

### 🔐 Аутентификация

#### Управление пользователями
```bash
# Список пользователей
supabase auth list users

# Создать пользователя
supabase auth create user --email user@example.com --password secret

# Удалить пользователя
supabase auth delete user --id user-uuid
```

#### Сброс пароля
```bash
supabase auth reset-password --email user@example.com
```

---

### 🧪 Локальная разработка

#### Запуск локального Supabase
```bash
# Инициализация проекта (первый раз)
supabase init

# Запуск локальных сервисов (Docker должен быть установлен)
supabase start

# Остановка локальных сервисов
supabase stop

# Сброс локальной БД
supabase db reset
```

#### Получение локальных credentials
```bash
# После supabase start
supabase status

# Выведет:
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - JWT secret: ...
```

---

### 🔍 Отладка и мониторинг

#### Просмотр логов
```bash
# Логи базы данных
supabase db logs

# Логи API
supabase functions logs

# Логи конкретной функции
supabase functions logs function_name
```

#### Выполнение SQL в интерактивном режиме
```bash
# Подключение к облачной БД через psql
supabase db remote connect

# Или напрямую через psql (используя connection string)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

---

### 📝 Создание типов TypeScript

#### Генерация типов из схемы БД
```bash
# Генерация типов для TypeScript
supabase gen types typescript --remote > src/types/database.types.ts

# Или для локальной БД
supabase gen types typescript --local > src/types/database.types.ts
```

---

## 🎯 Полезные команды для вашего проекта

### 1. Быстрое подключение к облачной БД через psql
```bash
# Получить connection string
supabase db remote get

# Использовать для подключения:
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

### 2. Применить все миграции к облачной БД
```bash
supabase db push
```

### 3. Скачать схему из облака для документации
```bash
supabase db dump --remote --schema-only > schema_dump.sql
```

### 4. Бэкап данных конкретной таблицы
```bash
supabase db dump --remote --table users > users_backup.sql
```

### 5. Скачать все файлы из Storage для бэкапа
```bash
supabase storage download songs ./backups/songs --recursive
supabase storage download covers ./backups/covers --recursive
supabase storage download avatars ./backups/avatars --recursive
```

### 6. Создать миграцию на основе изменений
```bash
# Если вы внесли изменения через Supabase Dashboard
supabase db pull
# Это создаст миграцию на основе различий
```

---

## 🔧 Конфигурация проекта

### Файл `supabase/config.toml`
После `supabase init` создаётся файл конфигурации:
```toml
[project]
# Project ID в Supabase Dashboard
project_id = "your-project-id"

[auth]
enabled = true

[api]
enabled = true
port = 54321

[db]
port = 54322
```

---

## ⚡ Быстрые команды (чек-лист)

```bash
# 1. Установка и авторизация (Windows через Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
supabase login

# 2. Подключение к проекту
supabase link --project-ref ваш-project-ref

# 3. Получить connection string
supabase db remote get

# 4. Применить миграции
supabase db push

# 5. Скачать схему
supabase db dump --remote --schema-only > schema.sql

# 6. Скачать данные таблицы
supabase db dump --remote --table users > users.sql

# 7. Скачать Storage файлы
supabase storage download songs ./backups/songs --recursive

# 8. Создать миграцию
supabase migration new add_new_table

# 9. Просмотреть миграции
supabase migration list

# 10. Генерация TypeScript типов
supabase gen types typescript --remote > src/types/db.types.ts
```

---

## 📚 Дополнительные ресурсы

- [Официальная документация Supabase CLI](https://supabase.com/docs/reference/cli)
- [Руководство по миграциям](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Работа с Storage через CLI](https://supabase.com/docs/reference/cli/supabase-storage)

---

## ⚠️ Важные замечания

1. **Безопасность:** Connection string содержит пароль - не коммитьте его в Git!

2. **Миграции:** Всегда проверяйте миграции перед применением к production!

3. **Бэкапы:** Делайте бэкапы перед применением миграций!

4. **Локальная разработка:** Для локальной разработки используйте `supabase start` (требует Docker).

