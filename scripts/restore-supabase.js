#!/usr/bin/env node

/**
 * Скрипт для восстановления данных из бэкапа Supabase
 * Восстанавливает: базу данных, Storage файлы
 * 
 * Использование:
 *   node scripts/restore-supabase.js <backup_directory>
 * 
 * Требуемые переменные окружения:
 *   SUPABASE_URL - URL проекта Supabase
 *   SUPABASE_SERVICE_ROLE_KEY - Service Role Key
 *   SUPABASE_DB_URL - Connection string для PostgreSQL (опционально)
 */

const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Конфигурация
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

// Проверка аргументов
const backupDir = process.argv[2];

if (!backupDir) {
  console.error('❌ Ошибка: Не указана директория бэкапа');
  console.error('📖 Использование: node scripts/restore-supabase.js <backup_directory>');
  process.exit(1);
}

// Проверка переменных окружения
if (!SUPABASE_URL) {
  console.error('❌ Ошибка: SUPABASE_URL не установлена');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Ошибка: SUPABASE_SERVICE_ROLE_KEY не установлена');
  process.exit(1);
}

// Создание клиента Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Запрос подтверждения у пользователя
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Восстановление базы данных
 */
async function restoreDatabase() {
  console.log('\n📦 Восстановление базы данных...');

  const dbDir = path.join(backupDir, 'database');
  
  try {
    const files = await fs.readdir(dbDir);
    const sqlFile = files.find(f => f.endsWith('.sql.gz') || f.endsWith('.sql'));
    const jsonFile = files.find(f => f.endsWith('.json'));

    if (sqlFile) {
      // Восстановление из SQL дампа
      if (!SUPABASE_DB_URL) {
        console.log('⚠️  SUPABASE_DB_URL не установлена, пропускаем восстановление БД из SQL');
        console.log('   Используйте Supabase CLI: supabase db reset');
        return;
      }

      const sqlPath = path.join(dbDir, sqlFile);
      const isCompressed = sqlFile.endsWith('.gz');

      console.log(`   📄 Файл: ${sqlFile}`);
      
      const confirmed = await askConfirmation('   ⚠️  Это действие заменит текущую БД. Продолжить? (y/N): ');
      if (!confirmed) {
        console.log('   ❌ Восстановление БД отменено');
        return;
      }

      if (isCompressed) {
        const restoreCommand = `gunzip -c "${sqlPath}" | psql "${SUPABASE_DB_URL}"`;
        return new Promise((resolve, reject) => {
          exec(restoreCommand, (error, stdout, stderr) => {
            if (error) {
              console.error('   ❌ Ошибка восстановления:', error.message);
              reject(error);
            } else {
              console.log('   ✅ База данных восстановлена');
              resolve();
            }
          });
        });
      } else {
        const restoreCommand = `psql "${SUPABASE_DB_URL}" < "${sqlPath}"`;
        return new Promise((resolve, reject) => {
          exec(restoreCommand, (error) => {
            if (error) {
              console.error('   ❌ Ошибка восстановления:', error.message);
              reject(error);
            } else {
              console.log('   ✅ База данных восстановлена');
              resolve();
            }
          });
        });
      }
    } else if (jsonFile) {
      // Восстановление из JSON файла (через API)
      console.log(`   📄 Файл: ${jsonFile}`);
      
      const confirmed = await askConfirmation('   ⚠️  Это действие добавит данные в текущую БД. Продолжить? (y/N): ');
      if (!confirmed) {
        console.log('   ❌ Восстановление БД отменено');
        return;
      }

      const jsonPath = path.join(dbDir, jsonFile);
      const data = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));

      for (const [tableName, records] of Object.entries(data.tables)) {
        if (records.length === 0) continue;

        console.log(`   📊 Восстановление таблицы: ${tableName} (${records.length} записей)...`);

        // Удаляем существующие данные (опционально)
        // await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Вставляем данные батчами по 1000 записей
        const batchSize = 1000;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          const { error } = await supabase.from(tableName).insert(batch);

          if (error) {
            console.error(`   ⚠️  Ошибка вставки в ${tableName}:`, error.message);
          }
        }

        console.log(`   ✅ ${tableName}: восстановлено`);
      }

      console.log('   ✅ Данные БД восстановлены');
    } else {
      console.log('   ⚠️  Файлы бэкапа БД не найдены');
    }
  } catch (error) {
    console.error('   ❌ Ошибка восстановления БД:', error.message);
  }
}

/**
 * Загрузка файлов в Storage bucket
 */
async function uploadToBucket(bucketName, localPath) {
  console.log(`\n📤 Загрузка файлов в bucket: ${bucketName}...`);

  let uploadedCount = 0;
  let totalSize = 0;

  async function uploadRecursive(dirPath, bucketPath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const bucketFilePath = bucketPath ? `${bucketPath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          await uploadRecursive(fullPath, bucketFilePath);
        } else {
          try {
            const fileBuffer = await fs.readFile(fullPath);
            const stats = await fs.stat(fullPath);
            
            // Загружаем файл с upsert (перезапись если существует)
            const { error } = await supabase.storage
              .from(bucketName)
              .upload(bucketFilePath, fileBuffer, {
                upsert: true,
                contentType: getContentType(entry.name)
              });

            if (error) {
              console.warn(`   ⚠️  Ошибка загрузки ${bucketFilePath}:`, error.message);
            } else {
              uploadedCount++;
              totalSize += stats.size;

              if (uploadedCount % 10 === 0) {
                const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
                process.stdout.write(`\r   📤 Загружено: ${uploadedCount} файлов (${sizeMB} MB)`);
              }
            }
          } catch (fileError) {
            console.error(`   ❌ Ошибка обработки ${fullPath}:`, fileError.message);
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ Ошибка обхода ${dirPath}:`, error.message);
    }
  }

  await uploadRecursive(localPath);
  
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`\n   ✅ Загружено ${uploadedCount} файлов в ${bucketName} (${sizeMB} MB)`);
  
  return { count: uploadedCount, size: totalSize };
}

/**
 * Определение Content-Type по расширению файла
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Восстановление Storage файлов
 */
async function restoreStorage() {
  console.log('\n📁 Восстановление Storage...');

  const storageDir = path.join(backupDir, 'storage');
  const buckets = [
    { name: 'songs', localPath: path.join(storageDir, 'songs') },
    { name: 'covers', localPath: path.join(storageDir, 'covers') },
    { name: 'avatars', localPath: path.join(storageDir, 'avatars') }
  ];

  const confirmed = await askConfirmation('   ⚠️  Это действие загрузит файлы в Storage. Продолжить? (y/N): ');
  if (!confirmed) {
    console.log('   ❌ Восстановление Storage отменено');
    return;
  }

  const results = {};

  for (const bucket of buckets) {
    try {
      const exists = await fs.access(bucket.localPath).then(() => true).catch(() => false);
      if (!exists) {
        console.log(`   ⚠️  Директория ${bucket.localPath} не найдена, пропускаем`);
        continue;
      }

      const result = await uploadToBucket(bucket.name, bucket.localPath);
      results[bucket.name] = result;
    } catch (error) {
      console.error(`   ❌ Ошибка восстановления bucket ${bucket.name}:`, error.message);
      results[bucket.name] = { count: 0, size: 0, error: error.message };
    }
  }

  return results;
}

/**
 * Главная функция
 */
async function main() {
  console.log('🔄 Начало восстановления из бэкапа Supabase...');
  console.log(`📅 Дата: ${new Date().toLocaleString('ru-RU')}`);
  console.log(`📁 Директория бэкапа: ${backupDir}\n`);

  // Проверка существования директории
  try {
    await fs.access(backupDir);
  } catch (error) {
    console.error(`❌ Ошибка: Директория бэкапа не найдена: ${backupDir}`);
    process.exit(1);
  }

  // Чтение информации о бэкапе
  try {
    const infoFile = path.join(backupDir, 'backup_info.txt');
    const info = await fs.readFile(infoFile, 'utf-8');
    console.log('📋 Информация о бэкапе:');
    console.log(info);
    console.log('');
  } catch (error) {
    console.log('⚠️  Файл backup_info.txt не найден\n');
  }

  try {
    // 1. Восстановление базы данных
    await restoreDatabase();

    // 2. Восстановление Storage
    const storageResults = await restoreStorage();

    console.log('\n🎉 Восстановление завершено!');
    console.log(`📁 Директория: ${backupDir}`);

  } catch (error) {
    console.error('\n❌ Критическая ошибка при восстановлении:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск
main();

