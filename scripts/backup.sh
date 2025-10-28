#!/bin/bash

# Скрипт для создания бэкапа базы данных ImperialTunes
# Использование: ./scripts/backup.sh

set -e

# Конфигурация
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-imperial_tunes}
DB_USER=${DB_USER:-postgres}
BACKUP_DIR=${BACKUP_DIR:-./backups}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/imperial_tunes_backup_$DATE.sql"

# Создаем директорию для бэкапов если её нет
mkdir -p "$BACKUP_DIR"

echo "🔄 Создание бэкапа базы данных ImperialTunes..."
echo "📅 Дата: $(date)"
echo "📁 Файл: $BACKUP_FILE"

# Проверяем подключение к базе данных
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; then
    echo "❌ Ошибка: Не удается подключиться к базе данных"
    echo "   Проверьте параметры подключения:"
    echo "   - DB_HOST: $DB_HOST"
    echo "   - DB_PORT: $DB_PORT"
    echo "   - DB_USER: $DB_USER"
    exit 1
fi

# Создаем бэкап
echo "📦 Создание дампа базы данных..."
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --no-password \
    --format=plain \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --create \
    > "$BACKUP_FILE"

# Проверяем размер файла
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Бэкап создан успешно!"
echo "📊 Размер файла: $FILE_SIZE"

# Создаем сжатый архив
echo "🗜️ Создание сжатого архива..."
gzip "$BACKUP_FILE"
COMPRESSED_FILE="$BACKUP_FILE.gz"
COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo "📊 Размер сжатого файла: $COMPRESSED_SIZE"

# Вычисляем MD5 хеш
echo "🔐 Вычисление контрольной суммы..."
MD5_HASH=$(md5sum "$COMPRESSED_FILE" | cut -d' ' -f1)
echo "🔑 MD5: $MD5_HASH"

# Сохраняем информацию о бэкапе
INFO_FILE="$BACKUP_DIR/backup_info_$DATE.txt"
cat > "$INFO_FILE" << EOF
ImperialTunes Database Backup Information
=========================================
Date: $(date)
Database: $DB_NAME
Host: $DB_HOST:$DB_PORT
User: $DB_USER
Backup File: $(basename "$COMPRESSED_FILE")
Original Size: $FILE_SIZE
Compressed Size: $COMPRESSED_SIZE
MD5 Hash: $MD5_HASH
EOF

echo "📋 Информация о бэкапе сохранена в: $INFO_FILE"

# Очистка старых бэкапов (оставляем последние 7)
echo "🧹 Очистка старых бэкапов..."
find "$BACKUP_DIR" -name "imperial_tunes_backup_*.sql.gz" -type f -mtime +7 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "backup_info_*.txt" -type f -mtime +7 -delete 2>/dev/null || true

echo "🎉 Бэкап завершен успешно!"
echo "📁 Расположение: $COMPRESSED_FILE"
echo "🔑 MD5: $MD5_HASH"

