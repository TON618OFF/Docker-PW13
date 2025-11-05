# Инструкция по бэкапам Supabase

## Быстрый старт

### 1. Установка зависимостей

Убедитесь, что установлены необходимые пакеты:
```bash
npm install @supabase/supabase-js
```

### 2. Настройка переменных окружения

Запустите скрипт настройки:
```bash
bash scripts/setup-backup-env.sh
```

Или создайте файл `.env.backup` вручную:
```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Backup Configuration
BACKUP_DIR=./backups
```

**Где найти эти значения:**
- `SUPABASE_URL`: В Supabase Dashboard → Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: В Supabase Dashboard → Settings → API → service_role key (секретный!)
- `SUPABASE_DB_URL`: В Supabase Dashboard → Settings → Database → Connection string (используйте Connection pooling: Direct connection)

### 3. Загрузка переменных окружения

```bash
# Linux/Mac
source .env.backup
export $(cat .env.backup | xargs)

# Windows PowerShell
Get-Content .env.backup | ForEach-Object {
    if ($_ -match '^([^#].*?)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
```

### 4. Создание бэкапа

**Полный бэкап (БД + Storage):**
```bash
node scripts/backup-supabase.js
```

**Или через bash скрипт (с автоматической загрузкой в облако):**
```bash
bash scripts/full-backup-supabase.sh
```

### 5. Восстановление из бэкапа

```bash
node scripts/restore-supabase.js ./backups/supabase_backup_YYYYMMDD_HHMMSS
```

## Что бэкапится

### База данных
- **Метод 1 (если есть SUPABASE_DB_URL):** SQL дамп через `pg_dump`
- **Метод 2 (через API):** Экспорт всех таблиц в JSON через Supabase API

**Таблицы:**
- roles, users, artists, genres, albums, tracks
- playlists, track_genres, playlist_tracks
- listening_history, audit_log
- favorites_tracks, favorites_albums, favorites_playlists
- artist_applications

### Storage файлы
- **songs** - все аудио файлы (mp3, wav, flac, ogg, m4a)
- **covers** - обложки альбомов
- **avatars** - аватары пользователей

## Структура бэкапа

```
backups/
└── supabase_backup_YYYYMMDD_HHMMSS/
    ├── database/
    │   ├── database_backup_YYYYMMDD_HHMMSS.sql.gz  (или .json)
    │   └── database_data_YYYYMMDD_HHMMSS.json      (если через API)
    ├── storage/
    │   ├── songs/
    │   │   └── [структура файлов]
    │   ├── covers/
    │   │   └── [структура файлов]
    │   └── avatars/
    │       └── [структура файлов]
    ├── backup_info.txt
    └── backup_info.json
```

## Загрузка в облачное хранилище

### AWS S3

1. Установите AWS CLI:
```bash
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Mac
brew install awscli
```

2. Настройте credentials:
```bash
aws configure
```

3. Добавьте в `.env.backup`:
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1
```

4. Загрузите бэкап:
```bash
node scripts/upload-to-cloud.js ./backups/supabase_backup_YYYYMMDD_HHMMSS.tar.gz
```

### Google Drive (через rclone)

1. Установите rclone:
```bash
# Linux/Mac
curl https://rclone.org/install.sh | sudo bash
```

2. Настройте remote:
```bash
rclone config
# Выберите Google Drive и следуйте инструкциям
```

3. Добавьте в `.env.backup`:
```bash
RCLONE_REMOTE=gdrive  # или другое имя вашего remote
```

4. Загрузите бэкап:
```bash
node scripts/upload-to-cloud.js ./backups/supabase_backup_YYYYMMDD_HHMMSS.tar.gz
```

## Автоматизация

### Linux/Mac (cron)

Добавьте в crontab (`crontab -e`):
```bash
# Ежедневный бэкап в 2:00 ночи
0 2 * * * cd /path/to/project && source .env.backup && export $(cat .env.backup | xargs) && node scripts/backup-supabase.js >> /var/log/supabase-backup.log 2>&1
```

### Windows (Task Scheduler)

1. Создайте файл `backup.bat`:
```batch
@echo off
cd /d C:\path\to\project
call scripts\setup-backup-env.sh
node scripts\backup-supabase.js
```

2. Настройте Task Scheduler для запуска ежедневно в 2:00

## Важные замечания

1. **Service Role Key** - это секретный ключ с полным доступом. Храните его в безопасности!
2. **Бэкапы могут быть большими** - учитывайте размер при хранении
3. **Storage файлы** - скачиваются рекурсивно, может занять время для больших проектов
4. **Проверка целостности** - скрипт автоматически проверяет размеры и создаёт информацию о бэкапе

## Устранение проблем

### Ошибка: "SUPABASE_URL не установлена"
- Убедитесь, что вы загрузили переменные окружения: `source .env.backup`

### Ошибка: "Не удалось подключиться к Storage"
- Проверьте, что `SUPABASE_SERVICE_ROLE_KEY` правильный (не anon key!)
- Проверьте, что buckets существуют в Supabase Dashboard

### Ошибка: "pg_dump не найден"
- Установите PostgreSQL client tools
- Или используйте метод через API (автоматически, если SUPABASE_DB_URL не установлен)

### Медленное скачивание Storage
- Это нормально для больших файлов
- Скрипт показывает прогресс каждые 10 файлов

