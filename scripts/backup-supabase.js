#!/usr/bin/env node

/**
 * Скрипт для создания полного бэкапа Supabase проекта
 * Включает: базу данных, Storage файлы (songs, covers, avatars)
 * 
 * Использование:
 *   node scripts/backup-supabase.js
 * 
 * Требуемые переменные окружения:
 *   SUPABASE_URL - URL проекта Supabase
 *   SUPABASE_SERVICE_ROLE_KEY - Service Role Key (для доступа к Storage)
 *   SUPABASE_DB_URL - Connection string для PostgreSQL (опционально, для прямого доступа к БД)
 */

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Конфигурация
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL; // Формат: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DATE = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
             new Date().toTimeString().split(' ')[0].replace(/:/g, '');
const BACKUP_ROOT = path.join(BACKUP_DIR, `supabase_backup_${DATE}`);

// Проверка переменных окружения
if (!SUPABASE_URL) {
  console.error('[ERROR] Ошибка: SUPABASE_URL не установлена');
  console.error('   Установите переменную окружения: export SUPABASE_URL=your_supabase_url');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] Ошибка: SUPABASE_SERVICE_ROLE_KEY не установлена');
  console.error('   Установите переменную окружения: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('   Service Role Key можно найти в Supabase Dashboard: Settings -> API');
  process.exit(1);
}

// Создание клиента Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Создание директорий для бэкапа
 */
async function createBackupDirectories() {
  console.log('[INFO] Создание структуры директорий...');
  
  await fs.mkdir(BACKUP_ROOT, { recursive: true });
  await fs.mkdir(path.join(BACKUP_ROOT, 'database'), { recursive: true });
  await fs.mkdir(path.join(BACKUP_ROOT, 'storage'), { recursive: true });
  await fs.mkdir(path.join(BACKUP_ROOT, 'storage', 'songs'), { recursive: true });
  await fs.mkdir(path.join(BACKUP_ROOT, 'storage', 'covers'), { recursive: true });
  await fs.mkdir(path.join(BACKUP_ROOT, 'storage', 'avatars'), { recursive: true });
  
  console.log('[OK] Директории созданы');
}

/**
 * Бэкап базы данных через pg_dump
 */
async function backupDatabase() {
  console.log('\n[INFO] Создание бэкапа базы данных...');
  
  if (!SUPABASE_DB_URL) {
    console.log('[WARN] SUPABASE_DB_URL не установлена, будет использован метод через API');
    console.log('   Для полного SQL дампа установите: SUPABASE_DB_URL=postgresql://...');
    return null;
  }

  const dbBackupFile = path.join(BACKUP_ROOT, 'database', `database_backup_${DATE}.sql`);
  const compressedFile = `${dbBackupFile}.gz`;

  // Парсим connection string для извлечения пароля
  let dbUrl = SUPABASE_DB_URL;
  let password = null;
  
  try {
    const urlMatch = dbUrl.match(/postgresql:\/\/postgres:([^@]+)@/);
    if (urlMatch) {
      password = decodeURIComponent(urlMatch[1]);
    }
  } catch (e) {
    // Игнорируем ошибку парсинга
  }

  // Создаём временный файл .pgpass для Windows (если нужно)
  const pgpassPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.pgpass');
  let pgpassCreated = false;

  if (password && process.platform === 'win32') {
    try {
      // Формат .pgpass: hostname:port:database:username:password
      const urlObj = new URL(dbUrl.replace('postgresql://', 'http://'));
      const host = urlObj.hostname;
      const port = urlObj.port || '5432';
      const dbName = urlObj.pathname.slice(1) || 'postgres';
      const pgpassContent = `${host}:${port}:${dbName}:postgres:${password}\n*:*:*:*:${password}\n`;
      
      // Проверяем существование .pgpass
      const existingPgpass = await fs.readFile(pgpassPath, 'utf-8').catch(() => '');
      if (!existingPgpass.includes(password)) {
        await fs.appendFile(pgpassPath, pgpassContent, 'utf-8');
        pgpassCreated = true;
        // Устанавливаем права доступа (только для владельтеля)
        if (process.platform !== 'win32') {
          await execAsync(`chmod 600 "${pgpassPath}"`);
        }
      }
    } catch (pgpassError) {
      console.log('[INFO] Не удалось создать .pgpass, используем переменную окружения');
    }
  }

  return new Promise((resolve, reject) => {
    // Используем pg_dump для создания дампа
    // Используем переменную окружения PGPASSWORD или .pgpass
    const env = { ...process.env };
    if (password) {
      env.PGPASSWORD = password;
    }
    
    // Убираем пароль из connection string для безопасности в логах
    const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log(`[INFO] Используется pg_dump для: ${safeUrl}`);
    
    const dumpCommand = `pg_dump "${dbUrl}" --no-owner --no-privileges --clean --if-exists --format=plain`;
    
    // Создаём файл для записи
    const writeStream = createWriteStream(dbBackupFile);
    let hasError = false;
    let errorMessage = null;

    const childProcess = exec(dumpCommand, { env, maxBuffer: 10 * 1024 * 1024 });
    
    // Обрабатываем stderr
    if (childProcess.stderr) {
      childProcess.stderr.on('data', (data) => {
        const errorText = data.toString();
        // Игнорируем предупреждения PostgreSQL, но логируем реальные ошибки
        if (errorText.includes('ERROR') || errorText.includes('FATAL')) {
          console.error('[ERROR] pg_dump stderr:', errorText);
          hasError = true;
          errorMessage = errorText;
        }
      });
    }

    // Записываем stdout в файл напрямую
    if (childProcess.stdout) {
      childProcess.stdout.pipe(writeStream);
    }

    // Обрабатываем ошибки записи
    writeStream.on('error', (err) => {
      console.error('[ERROR] Ошибка записи файла:', err.message);
      hasError = true;
      errorMessage = err.message;
    });

    // Обрабатываем завершение процесса
    childProcess.on('close', async (code) => {
      // Удаляем временный .pgpass если создали
      if (pgpassCreated) {
        try {
          const content = await fs.readFile(pgpassPath, 'utf-8');
          const newContent = content.replace(new RegExp(`.*:.*:.*:.*:${password.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\n?`, 'g'), '');
          await fs.writeFile(pgpassPath, newContent, 'utf-8');
        } catch (e) {
          // Игнорируем ошибку удаления
        }
      }

      // Закрываем поток записи
      writeStream.end();

      // Ждём завершения записи
      await new Promise((resolve) => {
        if (writeStream.writableEnded) {
          resolve();
        } else {
          writeStream.on('finish', resolve);
          writeStream.on('close', resolve);
          // Таймаут на случай, если поток не закрывается
          setTimeout(resolve, 2000);
        }
      });

      if (code !== 0 || hasError) {
        console.error('[ERROR] Ошибка создания дампа БД (код:', code, ')');
        if (errorMessage) {
          console.error('[ERROR] Детали:', errorMessage);
        }
        reject(new Error(`pg_dump failed with code ${code}: ${errorMessage || 'Unknown error'}`));
        return;
      }

      try {
        // Небольшая задержка для гарантии записи на диск
        await new Promise(resolve => setTimeout(resolve, 500));

        // Проверяем размер файла
        const stats = await fs.stat(dbBackupFile);
        if (stats.size === 0) {
          console.error('[ERROR] Файл дампа пуст');
          reject(new Error('Empty dump file'));
          return;
        }

        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`[OK] Дамп БД создан: ${fileSizeMB} MB`);

        // Пропускаем сжатие на Windows (gzip может быть недоступен)
        if (process.platform === 'win32') {
          resolve(dbBackupFile);
          return;
        }

        // Сжимаем файл (только для Linux/Mac)
        console.log('[INFO] Сжатие дампа БД...');
        const gzipCommand = `gzip -f "${dbBackupFile}"`;
        
        exec(gzipCommand, async (gzipError) => {
          if (gzipError) {
            console.warn('[WARN] Предупреждение: Не удалось сжать файл:', gzipError.message);
            resolve(dbBackupFile);
          } else {
            try {
              const compressedStats = await fs.stat(compressedFile);
              const compressedSizeMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
              console.log(`[OK] Дамп БД сжат: ${compressedSizeMB} MB`);
              resolve(compressedFile);
            } catch (statError) {
              console.warn('[WARN] Предупреждение: Не удалось проверить размер сжатого файла');
              resolve(compressedFile);
            }
          }
        });
      } catch (statError) {
        console.error('[ERROR] Ошибка проверки файла:', statError.message);
        reject(statError);
      }
    });
  });
}

/**
 * Альтернативный метод: экспорт данных через Supabase API (если нет доступа к БД напрямую)
 */
async function backupDatabaseViaAPI() {
  console.log('\n[INFO] Создание бэкапа базы данных через API...');
  console.log('[WARN] Этот метод экспортирует только данные, не схему БД');
  
  const tables = [
    'roles', 'users', 'artists', 'genres', 'albums', 'tracks', 
    'playlists', 'track_genres', 'playlist_tracks', 'listening_history',
    'audit_log', 'favorites_tracks', 'favorites_albums', 
    'favorites_playlists', 'artist_applications'
  ];

  const dataBackup = {
    timestamp: new Date().toISOString(),
    tables: {}
  };

  for (const table of tables) {
    try {
      console.log(`   [INFO] Экспорт таблицы: ${table}...`);
      
      // Получаем все данные из таблицы (с пагинацией если нужно)
      let allData = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.warn(`   [WARN] Ошибка экспорта ${table}:`, error.message);
          break;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      dataBackup.tables[table] = allData;
      console.log(`   [OK] ${table}: ${allData.length} записей`);
    } catch (error) {
      console.error(`   [ERROR] Ошибка экспорта ${table}:`, error.message);
    }
  }

  // Сохраняем данные в JSON файл
  const jsonFile = path.join(BACKUP_ROOT, 'database', `database_data_${DATE}.json`);
  await fs.writeFile(jsonFile, JSON.stringify(dataBackup, null, 2), 'utf-8');
  
  const stats = await fs.stat(jsonFile);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`[OK] Данные БД экспортированы: ${fileSizeMB} MB`);
  
  return jsonFile;
}

/**
 * Рекурсивное скачивание файлов из Storage bucket
 */
async function downloadBucketFiles(bucketName, localPath, maxFiles = null) {
  console.log(`\n[INFO] Скачивание файлов из bucket: ${bucketName}...`);
  
  let downloadedCount = 0;
  let totalSize = 0;
  
  async function downloadRecursive(folderPath = '') {
    try {
      // Получаем список файлов в текущей директории
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error(`   [ERROR] Ошибка получения списка файлов в ${folderPath}:`, error.message || JSON.stringify(error));
        return;
      }

      if (!files || files.length === 0) {
        if (folderPath === '') {
          console.log(`   [INFO] Нет файлов в корне bucket ${bucketName}`);
        }
        return;
      }

      console.log(`   [INFO] Найдено ${files.length} элементов в ${folderPath || 'корне'}`);

      for (const file of files) {
        if (maxFiles && downloadedCount >= maxFiles) {
          console.log(`   [WARN] Достигнут лимит файлов (${maxFiles}), остановка`);
          return;
        }

        const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;

        // В Supabase Storage, объекты из list() могут быть файлами или папками
        // Папки обычно имеют id === null или не имеют расширения файла
        // Но также могут быть файлы без расширения, поэтому проверяем более тщательно
        const isFolder = file.id === null || 
                        (file.metadata === null && !file.name.includes('.')) ||
                        (file.name && !file.name.includes('.') && file.id === null);

        if (isFolder) {
          // Это папка, обходим рекурсивно
          console.log(`   [INFO] Обход папки: ${filePath}`);
          await downloadRecursive(filePath);
          continue;
        }

        try {
          // Сначала пробуем скачать через Storage API с service_role ключом
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucketName)
            .download(filePath);

          if (downloadError) {
            // Детальная информация об ошибке
            const errorMsg = downloadError.message || JSON.stringify(downloadError);
            console.log(`   [INFO] Прямая загрузка не удалась для ${filePath}, пробуем публичный URL...`);
            console.log(`   [INFO] Ошибка: ${errorMsg}`);
            
            // Пробуем получить публичный URL и скачать через HTTP
            try {
              const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
              if (urlData?.publicUrl) {
                console.log(`   [INFO] Загрузка через публичный URL: ${filePath}`);
                const response = await fetch(urlData.publicUrl);
                if (response.ok) {
                  const arrayBuffer = await response.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  
                  const localFilePath = path.join(localPath, filePath);
                  const localDir = path.dirname(localFilePath);
                  await fs.mkdir(localDir, { recursive: true });
                  await fs.writeFile(localFilePath, buffer);
                  
                  downloadedCount++;
                  totalSize += buffer.length;
                  console.log(`   [OK] Скачан: ${filePath} (${(buffer.length / 1024).toFixed(2)} KB)`);
                  continue;
                } else {
                  console.warn(`   [WARN] HTTP запрос не удался для ${filePath}: ${response.status} ${response.statusText}`);
                }
              } else {
                console.warn(`   [WARN] Не удалось получить публичный URL для ${filePath}`);
              }
            } catch (httpError) {
              console.warn(`   [WARN] Ошибка HTTP загрузки для ${filePath}:`, httpError.message);
            }
            continue;
          }

          if (!fileData) {
            console.warn(`   [WARN] Файл ${filePath} пустой`);
            continue;
          }

          // Создаём локальную структуру директорий
          const localFilePath = path.join(localPath, filePath);
          const localDir = path.dirname(localFilePath);
          await fs.mkdir(localDir, { recursive: true });

          // Сохраняем файл
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await fs.writeFile(localFilePath, buffer);

          downloadedCount++;
          totalSize += buffer.length;

          // Логируем каждый файл для отладки
          const fileSizeKB = (buffer.length / 1024).toFixed(2);
          console.log(`   [OK] Скачан: ${filePath} (${fileSizeKB} KB)`);

          // Прогресс каждые 10 файлов
          if (downloadedCount % 10 === 0) {
            const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            console.log(`   [INFO] Прогресс: ${downloadedCount} файлов (${sizeMB} MB)`);
          }
        } catch (fileError) {
          console.error(`   [ERROR] Ошибка сохранения ${filePath}:`, fileError.message);
        }
      }
    } catch (error) {
      console.error(`   [ERROR] Ошибка обхода ${folderPath}:`, error.message || JSON.stringify(error));
    }
  }

  await downloadRecursive();
  
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`\n   [OK] Скачано ${downloadedCount} файлов из ${bucketName} (${sizeMB} MB)`);
  
  return { count: downloadedCount, size: totalSize };
}

/**
 * Бэкап всех Storage buckets
 */
async function backupStorage() {
  console.log('\n[INFO] Создание бэкапа Storage...');
  
  const buckets = [
    { name: 'songs', localPath: path.join(BACKUP_ROOT, 'storage', 'songs') },
    { name: 'covers', localPath: path.join(BACKUP_ROOT, 'storage', 'covers') },
    { name: 'avatars', localPath: path.join(BACKUP_ROOT, 'storage', 'avatars') }
  ];

  const results = {};

  for (const bucket of buckets) {
    try {
      const result = await downloadBucketFiles(bucket.name, bucket.localPath);
      results[bucket.name] = result;
    } catch (error) {
      console.error(`[ERROR] Ошибка бэкапа bucket ${bucket.name}:`, error.message);
      results[bucket.name] = { count: 0, size: 0, error: error.message };
    }
  }

  return results;
}

/**
 * Создание файла с информацией о бэкапе
 */
async function createBackupInfo() {
  console.log('\n[INFO] Создание информации о бэкапе...');
  
  const infoFile = path.join(BACKUP_ROOT, 'backup_info.txt');
  
  // Получаем размеры файлов
  let dbSize = 0;
  let storageSize = 0;
  
  try {
    const dbFiles = await fs.readdir(path.join(BACKUP_ROOT, 'database'));
    for (const file of dbFiles) {
      const stats = await fs.stat(path.join(BACKUP_ROOT, 'database', file));
      dbSize += stats.size;
    }
  } catch (e) {}

  try {
    const storageDirs = ['songs', 'covers', 'avatars'];
    for (const dir of storageDirs) {
      const dirPath = path.join(BACKUP_ROOT, 'storage', dir);
      const files = await getAllFiles(dirPath);
      for (const file of files) {
        const stats = await fs.stat(file);
        storageSize += stats.size;
      }
    }
  } catch (e) {}

  const info = {
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString('ru-RU'),
    supabase_url: SUPABASE_URL,
    backup_location: BACKUP_ROOT,
    database: {
      size_bytes: dbSize,
      size_mb: (dbSize / (1024 * 1024)).toFixed(2),
      files: await fs.readdir(path.join(BACKUP_ROOT, 'database')).catch(() => [])
    },
    storage: {
      size_bytes: storageSize,
      size_mb: (storageSize / (1024 * 1024)).toFixed(2),
      buckets: {
        songs: await countFiles(path.join(BACKUP_ROOT, 'storage', 'songs')),
        covers: await countFiles(path.join(BACKUP_ROOT, 'storage', 'covers')),
        avatars: await countFiles(path.join(BACKUP_ROOT, 'storage', 'avatars'))
      }
    },
    total_size_mb: ((dbSize + storageSize) / (1024 * 1024)).toFixed(2)
  };

  await fs.writeFile(infoFile, JSON.stringify(info, null, 2), 'utf-8');
  
  // Также создаём текстовую версию
  const textInfo = `
ImperialTunes Supabase Backup Information
==========================================
Дата создания: ${info.date}
Время создания: ${info.timestamp}
Supabase URL: ${SUPABASE_URL}
Расположение: ${BACKUP_ROOT}

БАЗА ДАННЫХ:
  Размер: ${info.database.size_mb} MB
  Файлы: ${info.database.files.join(', ')}

STORAGE:
  Общий размер: ${info.storage.size_mb} MB
  Songs (аудио): ${info.storage.buckets.songs} файлов
  Covers (обложки): ${info.storage.buckets.covers} файлов
  Avatars (аватары): ${info.storage.buckets.avatars} файлов

ОБЩИЙ РАЗМЕР: ${info.total_size_mb} MB
==========================================
`;
  
  await fs.writeFile(path.join(BACKUP_ROOT, 'backup_info.txt'), textInfo, 'utf-8');
  
  console.log('[OK] Информация о бэкапе сохранена');
  console.log(textInfo);
  
  return info;
}

/**
 * Вспомогательная функция: получить все файлы рекурсивно
 */
async function getAllFiles(dirPath) {
  const files = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

/**
 * Вспомогательная функция: подсчитать файлы
 */
async function countFiles(dirPath) {
  try {
    const files = await getAllFiles(dirPath);
    return files.length;
  } catch (e) {
    return 0;
  }
}

/**
 * Создание архива бэкапа
 */
async function createArchive() {
  console.log('\n[INFO] Создание архива бэкапа...');
  
  const archiveName = `${BACKUP_ROOT}.tar.gz`;
  const tarCommand = `tar -czf "${archiveName}" -C "${BACKUP_DIR}" "${path.basename(BACKUP_ROOT)}"`;
  
  return new Promise((resolve, reject) => {
    exec(tarCommand, async (error) => {
      if (error) {
        console.warn('[WARN] Предупреждение: Не удалось создать архив:', error.message);
        console.warn('   Убедитесь, что установлен tar и gzip');
        resolve(null);
      } else {
        try {
          const stats = await fs.stat(archiveName);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`[OK] Архив создан: ${path.basename(archiveName)} (${sizeMB} MB)`);
          resolve(archiveName);
        } catch (statError) {
          resolve(null);
        }
      }
    });
  });
}

/**
 * Главная функция
 */
async function main() {
  console.log('[INFO] Начало создания полного бэкапа Supabase проекта...');
  console.log(`[INFO] Дата: ${new Date().toLocaleString('ru-RU')}`);
  console.log(`[INFO] Директория: ${BACKUP_ROOT}\n`);

  try {
    // 1. Создание директорий
    await createBackupDirectories();

    // 2. Бэкап базы данных
    let dbBackupFile = null;
    try {
      dbBackupFile = await backupDatabase();
      if (!dbBackupFile) {
        throw new Error('pg_dump не вернул файл');
      }
    } catch (dbError) {
      console.log('[WARN] Прямой бэкап БД не удался, пробуем через API...');
      console.log('[INFO] Причина:', dbError.message);
      dbBackupFile = await backupDatabaseViaAPI();
    }

    // 3. Бэкап Storage
    const storageResults = await backupStorage();

    // 4. Создание информации о бэкапе
    const backupInfo = await createBackupInfo();

    // 5. Создание архива (опционально)
    const archiveFile = await createArchive();

    console.log('\n[OK] Бэкап завершен успешно!');
    console.log(`[INFO] Расположение: ${BACKUP_ROOT}`);
    if (archiveFile) {
      console.log(`[INFO] Архив: ${archiveFile}`);
    }
    console.log(`[INFO] Общий размер: ${backupInfo.total_size_mb} MB`);

  } catch (error) {
    console.error('\n[ERROR] Критическая ошибка при создании бэкапа:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск
main();

