#!/bin/bash

# Полный скрипт для создания бэкапа Supabase и загрузки в облако
# Объединяет: бэкап БД, Storage, создание архива, загрузку в облако

set -e

# Загружаем переменные окружения
if [ -f .env.backup ]; then
    source .env.backup
    echo "✅ Переменные окружения загружены из .env.backup"
else
    echo "⚠️  Файл .env.backup не найден"
    echo "   Запустите: bash scripts/setup-backup-env.sh"
    exit 1
fi

echo "🔄 Начало создания полного бэкапа Supabase..."
echo ""

# 1. Создание бэкапа через Node.js скрипт
echo "📦 Шаг 1: Создание бэкапа БД и Storage..."
node scripts/backup-supabase.js

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при создании бэкапа"
    exit 1
fi

# 2. Находим последний созданный бэкап
LATEST_BACKUP=$(ls -td backups/supabase_backup_* 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ Не удалось найти созданный бэкап"
    exit 1
fi

echo ""
echo "📁 Созданный бэкап: $LATEST_BACKUP"

# 3. Создание архива (если ещё не создан)
ARCHIVE_FILE="${LATEST_BACKUP}.tar.gz"
if [ ! -f "$ARCHIVE_FILE" ]; then
    echo ""
    echo "🗜️  Шаг 2: Создание архива..."
    tar -czf "$ARCHIVE_FILE" -C backups "$(basename $LATEST_BACKUP)"
    echo "✅ Архив создан: $ARCHIVE_FILE"
else
    echo ""
    echo "✅ Архив уже существует: $ARCHIVE_FILE"
fi

# 4. Загрузка в облако (если настроено)
if [ -n "$AWS_S3_BUCKET" ] || [ -n "$RCLONE_REMOTE" ]; then
    echo ""
    echo "☁️  Шаг 3: Загрузка в облачное хранилище..."
    node scripts/upload-to-cloud.js "$ARCHIVE_FILE"
else
    echo ""
    echo "ℹ️  Облачное хранилище не настроено"
    echo "   Для загрузки в облако настройте AWS_S3_BUCKET или RCLONE_REMOTE"
fi

echo ""
echo "🎉 Полный бэкап завершён!"
echo "📁 Локальный бэкап: $LATEST_BACKUP"
if [ -f "$ARCHIVE_FILE" ]; then
    ARCHIVE_SIZE=$(du -h "$ARCHIVE_FILE" | cut -f1)
    echo "📦 Архив: $ARCHIVE_FILE ($ARCHIVE_SIZE)"
fi

