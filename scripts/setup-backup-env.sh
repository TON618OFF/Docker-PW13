#!/bin/bash

# Скрипт для настройки переменных окружения для бэкапов
# Создаёт файл .env.backup с необходимыми переменными

echo "🔧 Настройка переменных окружения для бэкапов Supabase..."

ENV_FILE=".env.backup"

# Проверяем существование файла
if [ -f "$ENV_FILE" ]; then
    read -p "⚠️  Файл $ENV_FILE уже существует. Перезаписать? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Отменено"
        exit 1
    fi
fi

# Запрашиваем переменные
echo ""
echo "📝 Введите данные Supabase:"
echo ""

read -p "Supabase URL (например, https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Service Role Key (из Settings → API): " SUPABASE_SERVICE_ROLE_KEY
read -p "Database Connection String (опционально, для прямого доступа к БД): " SUPABASE_DB_URL
read -p "Директория для бэкапов (по умолчанию: ./backups): " BACKUP_DIR

# Значения по умолчанию
BACKUP_DIR=${BACKUP_DIR:-./backups}

# Создаём файл
cat > "$ENV_FILE" << EOF
# Переменные окружения для бэкапов Supabase
# Создано: $(date)

# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL=$SUPABASE_DB_URL

# Backup Configuration
BACKUP_DIR=$BACKUP_DIR

# Облачное хранилище (опционально)
# AWS S3
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_S3_BUCKET=your_bucket_name
# AWS_REGION=us-east-1

# Rclone (для Google Drive, Dropbox и т.д.)
# RCLONE_REMOTE=your_remote_name
EOF

echo ""
echo "✅ Файл $ENV_FILE создан!"
echo ""
echo "📖 Для использования:"
echo "   source $ENV_FILE"
echo "   или"
echo "   export \$(cat $ENV_FILE | xargs)"
echo ""
echo "🔒 ВАЖНО: Файл содержит секретные данные, не коммитьте его в Git!"

