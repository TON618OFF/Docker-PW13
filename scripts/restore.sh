#!/bin/bash

# Скрипт для восстановления базы данных ImperialTunes
# Использование: ./scripts/restore.sh <backup_file>

set -e

# Конфигурация
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-imperial_tunes}
DB_USER=${DB_USER:-postgres}
BACKUP_DIR=${BACKUP_DIR:-./backups}

# Проверяем аргументы
if [ $# -eq 0 ]; then
    echo "❌ Ошибка: Не указан файл бэкапа"
    echo "📖 Использование: $0 <backup_file>"
    echo ""
    echo "📁 Доступные бэкапы:"
    ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "   Нет доступных бэкапов"
    exit 1
fi

BACKUP_FILE="$1"

# Проверяем существование файла
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Ошибка: Файл бэкапа не найден: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Восстановление базы данных ImperialTunes..."
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

# Проверяем MD5 хеш если есть файл с информацией
INFO_FILE=$(echo "$BACKUP_FILE" | sed 's/\.sql\.gz$/.txt/')
if [ -f "$INFO_FILE" ]; then
    echo "🔐 Проверка контрольной суммы..."
    EXPECTED_MD5=$(grep "MD5 Hash:" "$INFO_FILE" | cut -d' ' -f3)
    ACTUAL_MD5=$(md5sum "$BACKUP_FILE" | cut -d' ' -f1)
    
    if [ "$EXPECTED_MD5" != "$ACTUAL_MD5" ]; then
        echo "❌ Ошибка: Контрольная сумма не совпадает!"
        echo "   Ожидалось: $EXPECTED_MD5"
        echo "   Получено:  $ACTUAL_MD5"
        exit 1
    fi
    echo "✅ Контрольная сумма проверена"
fi

# Создаем резервную копию текущей базы данных
CURRENT_BACKUP="$BACKUP_DIR/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
echo "💾 Создание резервной копии текущей базы данных..."
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    --format=plain \
    --no-owner \
    --no-privileges \
    > "$CURRENT_BACKUP" 2>/dev/null || echo "⚠️ Предупреждение: Не удалось создать резервную копию текущей базы"

# Подтверждение от пользователя
echo ""
echo "⚠️ ВНИМАНИЕ: Это действие полностью заменит текущую базу данных!"
echo "📁 Файл для восстановления: $BACKUP_FILE"
echo "💾 Резервная копия текущей БД: $CURRENT_BACKUP"
echo ""
read -p "🤔 Продолжить восстановление? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Восстановление отменено"
    exit 1
fi

# Останавливаем подключения к базе данных
echo "🛑 Остановка подключений к базе данных..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" 2>/dev/null || true

# Восстанавливаем базу данных
echo "📦 Восстановление базы данных..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Сжатый файл
    gunzip -c "$BACKUP_FILE" | psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        --set ON_ERROR_STOP=1
else
    # Обычный файл
    psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        --set ON_ERROR_STOP=1 \
        < "$BACKUP_FILE"
fi

# Проверяем восстановление
echo "🔍 Проверка восстановления..."
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ База данных восстановлена успешно!"
    echo "📊 Количество таблиц: $TABLE_COUNT"
else
    echo "❌ Ошибка: База данных не была восстановлена корректно"
    exit 1
fi

# Проверяем основные таблицы
echo "🔍 Проверка основных таблиц..."
MISSING_TABLES=""
for table in users tracks playlists artists albums genres; do
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1 FROM $table LIMIT 1;" >/dev/null 2>&1; then
        MISSING_TABLES="$MISSING_TABLES $table"
    fi
done

if [ -n "$MISSING_TABLES" ]; then
    echo "⚠️ Предупреждение: Отсутствуют таблицы:$MISSING_TABLES"
else
    echo "✅ Все основные таблицы присутствуют"
fi

echo "🎉 Восстановление завершено успешно!"
echo "📁 Восстановленный файл: $BACKUP_FILE"
echo "💾 Резервная копия: $CURRENT_BACKUP"

